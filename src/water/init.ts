import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { BackPlane } from "./layers/backplane";
import { Ground } from "./layers/ground";
import { IconPlane } from "./layers/iconplane";
import { Particles } from "./layers/particles";
import { Skybox } from "./layers/skybox";
import { Water } from "./layers/water";
import { BackgroundWater } from "./layers/waterfar";
import { WaterFogPost } from "./layers/waterfog";
import { params } from "./params";
import { ScrollController } from "./scroll";
import { setupUI } from "./ui";

export function init(el: HTMLElement) {
  const debug =
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("debug")) ??
    false;

  // Scene dimensions
  const CAMERA_DISTANCE = 0.3; // Distance from camera to front edge of planes
  const FOV = 60; // Field of view in degrees
  const PLANE_DEPTH = 3; // Fixed depth
  const MAX_ASPECT_RATIO = 3.0; // Max width:depth ratio (prevents extreme stretching)
  const BACKGROUND_WATER_WIDTH = 1000;
  const BACKGROUND_WATER_DEPTH = 1000;

  // Animation clock
  const clock = new THREE.Clock();

  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    FOV,
    window.innerWidth / window.innerHeight,
    0.2,
    100
  );

  // Calculate plane width to fill viewport at REAR edge
  const aspect = camera.aspect;
  const fovRadians = (FOV * Math.PI) / 180;
  const rearEdgeDistance = CAMERA_DISTANCE + PLANE_DEPTH;
  let PLANE_WIDTH = 2 * rearEdgeDistance * Math.tan(fovRadians / 2) * aspect;

  // Clamp to max aspect ratio to prevent pathological cases
  const maxWidth = PLANE_DEPTH * MAX_ASPECT_RATIO;
  if (PLANE_WIDTH > maxWidth) {
    PLANE_WIDTH = maxWidth;
    console.warn(
      `Clamped plane width to ${maxWidth} (aspect ratio ${MAX_ASPECT_RATIO}:1)`
    );
  }
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearAlpha(0.2);
  renderer.autoClear = false;
  renderer.domElement.classList.add("webgl");
  el.appendChild(renderer.domElement);

  // Optional FPS stats (debug only)
  type StatsLike = {
    begin: () => void;
    end: () => void;
    dom: HTMLElement;
    showPanel?: (id: number) => void;
  };
  let stats: StatsLike | null = null;
  if (debug) {
    // Lazy-load stats only in debug mode to avoid bundling cost in prod
    import("three/examples/jsm/libs/stats.module.js")
      .then(({ default: Stats }: any) => {
        stats = new Stats() as StatsLike;
        if (typeof stats.showPanel === "function") stats.showPanel(0);
        stats.dom.style.position = "fixed";
        stats.dom.style.left = "0px";
        stats.dom.style.top = "0px";
        stats.dom.style.zIndex = "10000";
        (stats.dom.style as any).pointerEvents = "none";
        document.body.appendChild(stats.dom);
      })
      .catch((err) => console.warn("Failed to load stats module", err));
  }

  // Post-process setup (fog as a layer)
  const waterFog = new WaterFogPost(
    camera,
    window.innerWidth,
    window.innerHeight
  );

  let scrollController: ScrollController | null = null;

  const sandDiffuseTexture = new THREE.TextureLoader().load(
    "/sim/ground-col1.jpg"
  );
  sandDiffuseTexture.colorSpace = THREE.SRGBColorSpace;

  const sandDisplacementTexture = new THREE.TextureLoader().load(
    "/sim/ground-dis1.jpg"
  );

  // We'll create skybox and water after HDR loads
  let skybox: Skybox;
  scene.environment = null as unknown as THREE.Texture;

  // Add some light to see the ground material
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  let water: Water;
  let backgroundWater: BackgroundWater;
  let particles: Particles;
  let iconPlane: IconPlane;
  // Planar capture setup
  const planarRT = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      depthBuffer: true,
    }
  );
  planarRT.texture.colorSpace = THREE.SRGBColorSpace;

  // Mirror reflection setup (for true planar reflection on water)
  const mirrorRT = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      depthBuffer: true,
    }
  );
  const mirrorCamera = new THREE.PerspectiveCamera(
    FOV,
    window.innerWidth / window.innerHeight,
    0.2,
    100
  );

  const ground = new Ground({
    texture: sandDiffuseTexture,
    displacementMap: sandDisplacementTexture,
    width: PLANE_WIDTH,
    depth: PLANE_DEPTH,
    maxAspectRatio: MAX_ASPECT_RATIO,
  });
  scene.add(ground);

  // Back plane at far edge of scene
  const backPlane = new BackPlane({
    width: PLANE_WIDTH, // Extends along X axis (left to right)
    height: 3, // From ground (-3) to water surface (0)
  });
  backPlane.position.set(0, -1.5, PLANE_DEPTH);
  backPlane.rotation.y = 0; // Facing forward (toward camera)
  scene.add(backPlane);

  // Side walls to bound the underwater volume in depth (for fog/particles)
  // Left wall (negative X), spans along Z
  const leftWall = new BackPlane({
    width: PLANE_DEPTH, // span along Z when rotated
    height: 3,
  });
  leftWall.position.set(-PLANE_WIDTH / 2, -1.5, PLANE_DEPTH / 2);
  // Rotate 90 degrees so the plane faces inward along +X
  leftWall.rotation.y = Math.PI * 0.5;
  scene.add(leftWall);

  // Right wall (positive X), spans along Z
  const rightWall = new BackPlane({
    width: PLANE_DEPTH,
    height: 3,
  });
  rightWall.position.set(PLANE_WIDTH / 2, -1.5, PLANE_DEPTH / 2);
  // Rotate -90 degrees so the plane faces inward along -X
  rightWall.rotation.y = -Math.PI * 0.5;
  scene.add(rightWall);

  const sky = "/sim/skybox3.hdr";

  // Load HDR equirectangular sky and convert to a cubemap for our shaders
  new HDRLoader().load(sky, (hdrTexture) => {
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    const cubeRT = new THREE.WebGLCubeRenderTarget(1024);
    cubeRT.fromEquirectangularTexture(renderer, hdrTexture);
    const environmentMap = cubeRT.texture;

    // Skybox using the generated cubemap
    skybox = new Skybox(environmentMap);
    scene.environment = environmentMap;
    scene.add(skybox);

    // Skyplane removed; always render skybox
    skybox.visible = true;

    // Particle system (silt and bubbles)
    particles = new Particles({
      siltCount: params.siltCount,
      bubbleCount: params.bubbleCount,
      bounds: {
        minX: -PLANE_WIDTH / 2,
        maxX: PLANE_WIDTH / 2,
        minY: -3.0,
        maxY: 0.2,
        minZ: 0.0,
        maxZ: PLANE_DEPTH / 3,
      },
    });
    particles.visible = params.particlesEnabled;
    // Put particles on their own layer so we can render them separately
    particles.layers.set(1);
    scene.add(particles);

    // Foreground water with high resolution and wave simulation (renders AFTER particles)
    water = new Water({
      environmentMap,
      resolution: 512,
      width: PLANE_WIDTH,
      depth: PLANE_DEPTH,
      maxAspectRatio: MAX_ASPECT_RATIO,
    });
    scene.add(water);
    // Wire planar texture target to water uniforms
    water.material.uniforms.uPlanarMap.value = planarRT.texture;
    water.material.uniforms.uMirrorMap.value = mirrorRT.texture;

    // Background water - covers entire surface with hole cut for foreground water
    backgroundWater = new BackgroundWater({
      width: BACKGROUND_WATER_WIDTH,
      depth: BACKGROUND_WATER_DEPTH,
      cutoutWidth: PLANE_WIDTH,
      cutoutDepth: PLANE_DEPTH,
      cutoutOffsetX: 0,
      cutoutOffsetZ: PLANE_DEPTH / 2,
    });
    // Icon plane slightly above water
    const iconSize = PLANE_WIDTH * 0.03;
    iconPlane = new IconPlane({
      textureUrl: "/icon.svg",
      width: -iconSize,
      height: -iconSize,
    });
    iconPlane.position.set(0, iconSize * 0.5, 0.5);
    iconPlane.rotation.x = Math.PI;
    iconPlane.renderOrder = 999;
    // scene.add(iconPlane)

    // Position at same location as ground plane but at water level (y=0)
    backgroundWater.position.y = 0;
    backgroundWater.visible = true;
    scene.add(backgroundWater);

    // Initialize scroll controller now that camera and plane size are known
    const scroll = new ScrollController(camera, CAMERA_DISTANCE);
    scrollController = scroll;

    // Initialize UI now that all elements exist
    if (debug) {
      setupUI({
        water,
        backgroundWater,
        ground,
        skybox,
        particles,
        fogUniforms: waterFog.uniforms,
      });
    }
  });

  let animationFrameId: number | null = null;

  function animate() {
    if (stats) stats.begin();
    const elapsedTime = clock.getElapsedTime();
    if (water) {
      water.update(elapsedTime);
    }
    if (backgroundWater) {
      backgroundWater.update(elapsedTime);
    }
    ground.update(elapsedTime);
    if (particles) {
      particles.update(elapsedTime, camera);
    }
    if (scrollController) {
      scrollController.update(elapsedTime);
    }

    // 0) Render planar capture (top-down of icon layer only)
    // renderer.setRenderTarget(planarRT)
    // renderer.setClearColor(new THREE.Color(0, 0, 0), 0)
    // renderer.clear(true, true, true)
    // renderer.render(planarScene, planarCamera)
    // renderer.setRenderTarget(null)

    // 0.5) Render mirror reflection (reflect camera across water plane y=0)
    if (water) {
      mirrorCamera.position.copy(camera.position);
      mirrorCamera.position.y *= -1;
      mirrorCamera.quaternion.copy(camera.quaternion);
      // Flip pitch by mirroring over X axis
      mirrorCamera.scale.set(1, -1, 1);
      mirrorCamera.updateMatrixWorld(true);
      mirrorCamera.updateProjectionMatrix();

      // Compute world->clip matrix for mirror sampling
      const mirrorMatrix = new THREE.Matrix4();
      mirrorMatrix.multiplyMatrices(
        mirrorCamera.projectionMatrix,
        mirrorCamera.matrixWorldInverse
      );
      (water.material.uniforms as any).uMirrorMatrix.value.copy(mirrorMatrix);

      // Render only the icon (optional optimization); for now render full scene
      const prevWaterVisible = water.visible;
      water.visible = false; // avoid feedback loop: don't render water while sampling mirrorRT
      renderer.setRenderTarget(mirrorRT);
      renderer.setClearColor(new THREE.Color(0, 0, 0), 0);
      renderer.clear(true, true, true);
      renderer.render(scene, mirrorCamera);
      renderer.setRenderTarget(null);
      water.visible = prevWaterVisible;
    }

    // 1) Render main scene to offscreen RT (captures depth)
    waterFog.begin(renderer);
    // Clear the offscreen target before rendering
    renderer.clear(true, true, true);
    renderer.render(scene, camera);
    waterFog.end(renderer, camera);

    // 2) Blit fogged color to screen
    // waterFog.end already rendered the fogged quad to the default framebuffer

    // 3) Render particles in a second pass using captured depth for occlusion
    if (particles) {
      particles.setDepthTexture(waterFog.renderTarget.depthTexture!, camera);
      // Render only layer 1 (particles)
      const oldMask = camera.layers.mask;
      camera.layers.set(1);
      // Do not clear color, only update depth test against tDepth in shader
      renderer.render(scene, camera);
      // Restore layer mask
      camera.layers.mask = oldMask;
    }
    if (stats) stats.end();
    animationFrameId = requestAnimationFrame(animate);
  }

  // Handle resize
  const handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Update camera and renderer sizes
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    waterFog.setSize(width, height);
    planarRT.setSize(width, height);
    mirrorRT.setSize(width, height);

    // Recompute plane width based on new aspect to keep foreground water filling view
    const fovRadians = (FOV * Math.PI) / 180;
    const rearEdgeDistance = CAMERA_DISTANCE + PLANE_DEPTH;
    let newPlaneWidth =
      2 * rearEdgeDistance * Math.tan(fovRadians / 2) * camera.aspect;
    const maxWidth = PLANE_DEPTH * MAX_ASPECT_RATIO;
    if (newPlaneWidth > maxWidth) newPlaneWidth = maxWidth;

    // Scale scene elements horizontally to match new plane width
    const widthScale = newPlaneWidth / PLANE_WIDTH;

    if (water) {
      water.scale.x *= widthScale;
      (water.material.uniforms as any).uPlaneWidth.value = newPlaneWidth;
    }

    // Ground plane matches water extents
    ground.scale.x *= widthScale;

    // Back wall and side walls
    backPlane.scale.x *= widthScale;
    leftWall.position.x = -newPlaneWidth / 2;
    rightWall.position.x = newPlaneWidth / 2;

    // Background water cutout tracks foreground water size
    if (backgroundWater) {
      (backgroundWater.material.uniforms as any).uCutoutWidth.value =
        newPlaneWidth;
      (backgroundWater.material.uniforms as any).uCutoutDepth.value =
        PLANE_DEPTH;
    }

    // Update mirror camera to new aspect
    mirrorCamera.aspect = camera.aspect;
    mirrorCamera.updateProjectionMatrix();

    // Commit new baseline width
    PLANE_WIDTH = newPlaneWidth;
  };

  window.addEventListener("resize", handleResize);

  // Start animation
  animate();

  return () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }

    window.removeEventListener("resize", handleResize);

    if (scrollController) {
      scrollController.destroy();
    }

    // Dispose geometries and materials
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        }
      }
    });

    waterFog.dispose();
    planarRT.dispose();
    mirrorRT.dispose();

    // Dispose textures
    sandDiffuseTexture.dispose();
    sandDisplacementTexture.dispose();
    // no skyplane texture

    // Dispose renderer
    renderer.dispose();

    // Remove canvas
    if (el.contains(renderer.domElement)) {
      el.removeChild(renderer.domElement);
    }
    // Remove stats overlay if present
    if (stats && stats.dom && document.body.contains(stats.dom)) {
      document.body.removeChild(stats.dom);
    }
  };
}
