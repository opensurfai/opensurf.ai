import * as THREE from 'three'
import { params } from '../params'

export interface FogPostUniforms {
  tColor: { value: THREE.Texture | null }
  tDepth: { value: THREE.DepthTexture | null }
  uCameraNear: { value: number }
  uCameraFar: { value: number }
  uPostEnabled: { value: number }
  // gating
  uWaterLevel: { value: number }
  uCameraY: { value: number }
  // artistic controls
  uFogColorShallow: { value: THREE.Color }
  uFogColorDeep: { value: THREE.Color }
  uFogDepthTop: { value: number }
  uFogDepthBottom: { value: number }
  uFogDensityHeightFalloff: { value: number }
  uNear: { value: number }
  uFar: { value: number }
  uCurveType: { value: number }
  uExpK: { value: number }
  uPreviewMode: { value: number }
  uDistanceDarkening: { value: number }
  // matrices for world reconstruction
  uInvProjection: { value: THREE.Matrix4 }
  uCameraWorldMatrix: { value: THREE.Matrix4 }
  // particles
  uSiltColor: { value: THREE.Color }
  uSiltOpacityMax: { value: number }
  uParticlesEnabled: { value: number }
}

const vertexShader = `
precision highp float;

varying vec2 vUv;

void main() {
  vUv = uv;
  // Direct clip-space passthrough for fullscreen quad
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const fragmentShader = `
precision highp float;
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

uniform sampler2D tColor;
uniform sampler2D tDepth;

uniform float uCameraNear;
uniform float uCameraFar;
uniform float uPostEnabled;

uniform float uWaterLevel;     // world Y of the water plane
uniform float uCameraY;        // camera world Y

uniform vec3  uFogColorShallow;      // bright turquoise for upper areas
uniform vec3  uFogColorDeep;         // rich dark blue for depths
uniform float uFogDepthTop;          // world Y for shallow color (e.g., 0)
uniform float uFogDepthBottom;       // world Y for deep color (e.g., -3)
uniform float uFogDensityHeightFalloff; // how much denser at bottom (1.0 = neutral)
uniform float uNear;                 // start distance for fog
uniform float uFar;                  // distance where fog reaches max
uniform int   uCurveType;            // 0: linear, 1: smoothstep, 2: exp
uniform float uExpK;                 // exponential curve constant (k)
uniform float uPreviewMode;          // 1.0 to show factor as grayscale
uniform float uDistanceDarkening;    // how much to darken at far plane (0 = none, 1 = full black)

uniform mat4 uInvProjection;   // camera.projectionMatrixInverse
uniform mat4 uCameraWorldMatrix; // camera.matrixWorld

// Particle uniforms
uniform vec3 uSiltColor;
uniform float uSiltOpacityMax;
uniform int uParticlesEnabled;

varying vec2 vUv;

float perspectiveDepthToViewZ(const in float fragDepth, const in float near, const in float far) {
  float z = fragDepth * 2.0 - 1.0; // back to NDC
  return (2.0 * near * far) / (far + near - z * (far - near));
}

// Avoid naming conflicts across platforms; use clamp directly instead of a helper

void main() {
  vec4 base = texture2D(tColor, vUv);
  
  // Alpha channel encodes surface type: 0.0 = no fog, 1.0 = apply fog
  float surfaceFlag = base.a;

  if (uPostEnabled < 0.5) {
    gl_FragColor = vec4(base.rgb, 1.0);
    return;
  }

  float fragDepth = texture2D(tDepth, vUv).r;

  // Check for sky (no depth written) — pass through without horizon band logic
  if (fragDepth >= 1.0) {
    gl_FragColor = vec4(base.rgb, 1.0);
    return;
  }

  // If this surface doesn't need fog (surfaceFlag < 0.5), pass through
  if (surfaceFlag < 0.5) {
    gl_FragColor = vec4(base.rgb, 1.0);
    return;
  }

  // Apply fog to this surface
  // View-space depth (negative in front of camera)
  float cameraViewZ = perspectiveDepthToViewZ(fragDepth, uCameraNear, uCameraFar);
  float viewDistance = abs(cameraViewZ);

  // Reconstruct world-space position for depth-based color
  float ndcZ = fragDepth * 2.0 - 1.0;
  vec2 ndcXY = vUv * 2.0 - 1.0;
  vec4 clipPos = vec4(ndcXY, ndcZ, 1.0);
  vec4 viewPos = uInvProjection * clipPos;
  viewPos /= max(viewPos.w, 1e-6);
  vec4 worldPos = uCameraWorldMatrix * viewPos;
  float worldY = worldPos.y;

  // 1. Calculate depth-based factor from CAMERA depth (0 at surface, 1 at floor)
  // Fog color is determined by where YOU are, not what you're looking at
  float depthRange = max(uFogDepthTop - uFogDepthBottom, 1e-4);
  float depthFactor = clamp((uFogDepthTop - uCameraY) / depthRange, 0.0, 1.0);
  depthFactor = pow(depthFactor, 0.4); // squish shallow color towards top
  
  // 2. Calculate base fog color from camera depth
  vec3 baseFogColor = mix(uFogColorShallow, uFogColorDeep, depthFactor);
  
  // 3. Calculate distance-based fog opacity
  float denom = max(uFar - uNear, 1e-4);
  float t = clamp((viewDistance - uNear) / denom, 0.0, 1.0);
  
  // Apply curve type
  if (uCurveType == 1) {
    t = smoothstep(0.0, 1.0, t);
  } else if (uCurveType == 2) {
    float k = max(uExpK, 1e-4);
    t = 1.0 - exp(-k * t);
  }
  
  // Density modulation for volumetric feel
  float densityModulation = mix(1.0, uFogDensityHeightFalloff, depthFactor);
  float opacity = clamp(t * densityModulation, 0.0, 1.0);
  
  // 4. Darken fog color based on distance (near = base color, far = darkened)
  vec3 fogColorNear = baseFogColor;
  vec3 fogColorFar = baseFogColor * (1.0 - uDistanceDarkening);
  vec3 finalFogColor = mix(fogColorNear, fogColorFar, t);

  // Preview mode: show opacity as grayscale
  if (uPreviewMode > 0.5) {
    gl_FragColor = vec4(vec3(opacity), 1.0);
    return;
  }

  // 5. Final blend
  vec3 outColor = mix(base.rgb, finalFogColor, opacity);
  gl_FragColor = vec4(outColor, 1.0);
}`

export class WaterFogPost {
  readonly renderTarget: THREE.WebGLRenderTarget
  readonly scene: THREE.Scene
  readonly camera: THREE.OrthographicCamera
  readonly geometry: THREE.PlaneGeometry
  readonly material: THREE.ShaderMaterial & { uniforms: FogPostUniforms }

  constructor(perspectiveCamera: THREE.PerspectiveCamera, width: number, height: number) {
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      depthBuffer: true,
    })
    this.renderTarget.depthTexture = new THREE.DepthTexture(width, height)
    this.renderTarget.depthTexture.type = THREE.UnsignedShortType
    this.renderTarget.texture.colorSpace = THREE.SRGBColorSpace

    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.geometry = new THREE.PlaneGeometry(2, 2)

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tColor: { value: null },
        tDepth: { value: null },
        uCameraNear: { value: perspectiveCamera.near },
        uCameraFar: { value: perspectiveCamera.far },
        uPostEnabled: { value: params.fogEnabled },
        uWaterLevel: { value: 0.0 },
        uCameraY: { value: 0 },
        uFogColorShallow: { value: params.fogColorShallow },
        uFogColorDeep: { value: params.fogColorDeep },
        uFogDepthTop: { value: params.fogDepthTop },
        uFogDepthBottom: { value: params.fogDepthBottom },
        uFogDensityHeightFalloff: { value: params.fogDensityHeightFalloff },
        uNear: { value: params.fogNear },
        uFar: { value: params.fogFar },
        uCurveType: { value: params.fogCurveType },
        uExpK: { value: params.fogExpK },
        uPreviewMode: { value: params.fogPreviewMode },
        uDistanceDarkening: { value: params.fogDistanceDarkening },
        uInvProjection: { value: perspectiveCamera.projectionMatrixInverse.clone() },
        uCameraWorldMatrix: { value: perspectiveCamera.matrixWorld.clone() },
        // particles
        uSiltColor: { value: params.siltColor as THREE.Color },
        uSiltOpacityMax: { value: params.siltOpacityMax },
        uParticlesEnabled: { value: 0 }, // Disabled for now
      },
      depthTest: false,
      depthWrite: false,
      transparent: false,
    }) as THREE.ShaderMaterial & { uniforms: FogPostUniforms }

    const quad = new THREE.Mesh(this.geometry, this.material)
    quad.frustumCulled = false
    this.scene.add(quad)
  }

  begin(renderer: THREE.WebGLRenderer): void {
    renderer.setRenderTarget(this.renderTarget)
  }

  end(renderer: THREE.WebGLRenderer, perspectiveCamera: THREE.PerspectiveCamera): void {
    renderer.setRenderTarget(null)

    this.material.uniforms.tColor.value = this.renderTarget.texture
    this.material.uniforms.tDepth.value = this.renderTarget.depthTexture
    this.material.uniforms.uCameraNear.value = perspectiveCamera.near
    this.material.uniforms.uCameraFar.value = perspectiveCamera.far
    // Keep water level at world y=0 to match the scene
    this.material.uniforms.uWaterLevel.value = 0.0
    this.material.uniforms.uCameraY.value = perspectiveCamera.position.y
    this.material.uniforms.uInvProjection.value.copy(perspectiveCamera.projectionMatrixInverse)
    this.material.uniforms.uCameraWorldMatrix.value.copy(perspectiveCamera.matrixWorld)

    renderer.render(this.scene, this.camera)
  }

  setSize(width: number, height: number): void {
    this.renderTarget.setSize(width, height)
    if (this.renderTarget.depthTexture) {
      this.renderTarget.depthTexture.dispose()
    }
    this.renderTarget.depthTexture = new THREE.DepthTexture(width, height)
    this.renderTarget.depthTexture.type = THREE.UnsignedShortType
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
    this.renderTarget.dispose()
    if (this.renderTarget.depthTexture) {
      this.renderTarget.depthTexture.dispose()
    }
  }

  get uniforms(): FogPostUniforms {
    return this.material.uniforms
  }
}
