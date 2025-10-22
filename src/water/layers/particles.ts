import * as THREE from 'three'
import { params } from '../params'

interface ParticlesUniforms {
  uTime: { value: number }
  uSiltDriftSpeed: { value: number }
  uSiltNoiseScale: { value: number }
  uSiltColor: { value: THREE.Color }
  uSiltOpacityMin: { value: number }
  uSiltOpacityMax: { value: number }
  uBubbleRiseSpeed: { value: number }
  uBubbleWobbleAmount: { value: number }
  uBubbleSpawnHeight: { value: number }
  uBubbleColor: { value: THREE.Color }
  uParticlesFogInfluence: { value: number }
  uCameraPosition: { value: THREE.Vector3 }
  // Fog uniforms
  uFogColorShallow: { value: THREE.Color }
  uFogColorDeep: { value: THREE.Color }
  uFogDepthTop: { value: number }
  uFogDepthBottom: { value: number }
  uFogNear: { value: number }
  uFogFar: { value: number }
  uFogExpK: { value: number }
  // depth comparison
  uSceneDepth: { value: THREE.Texture | null }
  uCameraNear: { value: number }
  uCameraFar: { value: number }
}

const vertexShader = `
attribute vec3 particleOffset;      // Instance position
attribute float particleType;       // 0.0 = silt, 1.0 = bubble
attribute float particleId;         // Unique ID for noise variation
attribute float particleSize;       // Size multiplier
attribute float particlePhase;      // Random phase for motion variation

uniform float uTime;
uniform float uSiltDriftSpeed;
uniform float uSiltNoiseScale;
uniform float uBubbleRiseSpeed;
uniform float uBubbleWobbleAmount;
uniform float uBubbleSpawnHeight;

varying vec2 vUv;
varying vec4 vClipPos; // clip-space position for depth/uv reconstruction
varying float vParticleType;
varying float vViewZ; // positive camera-space depth
varying float vParticleId; // pass to frag for per-bubble variation

// Simplex 3D Noise
vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vUv = uv;
  vParticleType = particleType;
  vParticleId = particleId;
  
  vec3 animatedPosition = particleOffset;

  if (particleType < 0.5) {
    // SILT PARTICLES - slow organic drift
    float noiseScale = uSiltNoiseScale;
    vec3 noiseInput = particleOffset * noiseScale + vec3(uTime * uSiltDriftSpeed * 0.1, particleId * 100.0, particlePhase);
    
    // Multi-octave noise for organic motion
    vec3 drift = vec3(
      snoise(noiseInput) * 0.1,
      snoise(noiseInput + vec3(100.0, 0.0, 0.0)) * 0.05,
      snoise(noiseInput + vec3(0.0, 100.0, 0.0)) * 0.1
    );
    
    animatedPosition += drift;
    
    // Clamp to underwater volume (between floor at -3.0 and surface at -0.05)
    animatedPosition.y = clamp(animatedPosition.y, -3.0, -0.05);
  } else {
    // BUBBLES - rise with gentle wobble, loop from spawn height to surface
    // Distribute initial positions along the column so bubbles are visible everywhere at start
    float t = uTime;
    float rise = t * uBubbleRiseSpeed;
    float surfaceY = -0.05;
    float pathLen = max(surfaceY - uBubbleSpawnHeight, 0.0001);
    float initialOffset = particlePhase * pathLen; // spreads bubbles across full height initially
    float y = uBubbleSpawnHeight + mod(rise + initialOffset, pathLen);

    float wobbleX = sin(t * 2.3 + particleId * 13.7) * uBubbleWobbleAmount;
    float wobbleZ = cos(t * 2.1 + particleId * 17.9) * uBubbleWobbleAmount;

    animatedPosition.x += wobbleX;
    animatedPosition.z += wobbleZ;
    animatedPosition.y = y;
  }
  
  // Billboard to face camera
  vec4 modelViewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
  vViewZ = -modelViewPosition.z;
  vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 cameraUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  
  // Apply particle size
  vec3 billboardPosition = modelViewPosition.xyz;
  billboardPosition += (position.x * cameraRight + position.y * cameraUp) * particleSize;
  
  vec4 clipPos = projectionMatrix * vec4(billboardPosition, 1.0);
  gl_Position = clipPos;
  vClipPos = clipPos;
}`

const fragmentShader = `
precision highp float;

uniform vec3 uSiltColor;
uniform float uSiltOpacityMax;
uniform vec3 uBubbleColor;
uniform float uTime;
uniform sampler2D uSceneDepth;  // depth from main pass (waterFog RT)
uniform float uCameraNear;
uniform float uCameraFar;
uniform float uFogNear;
uniform float uFogFar;
uniform float uParticlesFogInfluence;

varying vec2 vUv;
varying vec4 vClipPos;
varying float vParticleType;
varying float vViewZ;
varying float vParticleId;

float perspectiveDepthToViewZ(const in float fragDepth, const in float near, const in float far) {
  float z = fragDepth * 2.0 - 1.0; // back to NDC
  return (2.0 * near * far) / (far + near - z * (far - near));
}

void main() {
  // Calculate distance from center
  vec2 centered = vUv * 2.0 - 1.0;
  float dist = length(centered);
  
  // Note: we discard per-type below to allow bubble shape wobble
  
  float alpha;
  vec3 color;
  if (vParticleType < 0.5) {
    if (dist > 1.0) { discard; }
    // Silt: soft center and falloff
    float gradient = 1.0 - dist;
    gradient = pow(gradient, 1.5);
    alpha = gradient * uSiltOpacityMax;
    color = uSiltColor;
  } else {
    // Bubbles:
    // - Darkening rim (absorptive edge)
    // - Subtle interior with vertical brightness gradient (lighter top, darker bottom)
    // - Shape jiggle via angular/radial distortion
    
    // Distort the circular SDF to add wobble
    // Use radial wobble only (avoid anisotropic scaling that can cause quad clipping)
    vec2 p = centered;
    float angle = atan(p.y, p.x);
    float harmonic = 0.6 * sin(angle * 2.0 + uTime * 2.0 + vParticleId * 20.0)
                   + 0.25 * sin(angle * 4.0 - uTime * 1.2 + vParticleId * 33.0)
                   + 0.15 * sin(angle * 6.0 + uTime * 2.4 + vParticleId * 47.0);
    // Inward-only jiggle: keep the effective radius <= 1.0 to avoid quad clipping
    float jiggleAmp = 0.1; // increase to move distortion further inward
    float allowedRadius = 1.0 - jiggleAmp * abs(harmonic);
    float d = length(p) / allowedRadius;
    if (d > 1.0) { discard; }
    
    // Rim mask concentrated near the edge of the circle
    // Wider and stronger for a punchier outline
    float rimMask = smoothstep(0.78, 1.0, d);
    rimMask = pow(rimMask, 2.0);

    // Interior mask favours the center and fades toward the rim
    float innerMask = 1.0 - smoothstep(0.58, 0.90, d);

    // Vertical gradient: vUv.y in [0,1] (top=1). Map bottom darker, top lighter
    float vertical = clamp(vUv.y, 0.0, 1.0);
    // Concentrate highlight towards the top but extend influence down to mid-height
    float topMask = pow(smoothstep(0.35, 0.98, vertical), 1.6);
    float brightness = mix(0.25, 2.2, topMask);

    // Colors for components
    vec3 rimColor = mix(vec3(0.0), uBubbleColor, 0.08); // darker rim to attenuate background
    vec3 innerColor = uBubbleColor * brightness;

    // Opacity contributions
    float rimAlpha = rimMask * 0.60;    // thicker, punchier rim
    // Bottom becomes mostly transparent by gating interior with topMask
    float innerAlpha = innerMask * 0.36 * topMask;

    // Combine non-premultiplied color/alpha
    alpha = clamp(rimAlpha + innerAlpha, 0.0, 0.75);
    color = (rimColor * rimAlpha + innerColor * innerAlpha) / max(alpha, 1e-5);
  }

  // Depth-based occlusion: compare particle depth vs scene depth
  // Convert particle clip-space to NDC and UV
  vec3 ndc = vClipPos.xyz / max(vClipPos.w, 1e-6);
  vec2 uv = ndc.xy * 0.5 + 0.5;
  float particleDepth = (ndc.z + 1.0) * 0.5; // [0..1]
  float sceneDepth = texture2D(uSceneDepth, uv).r;
  // If the scene is closer, discard this particle fragment
  if (sceneDepth < particleDepth - 1e-4) {
    discard;
  }
  
  // Distance fade using fog near/far and influence
  float fogNear = uFogNear;
  float fogFar = uFogFar;
  float fogT = clamp((vViewZ - fogNear) / max(fogFar - fogNear, 1e-5), 0.0, 1.0);
  float fade = 1.0 - fogT * uParticlesFogInfluence;
  alpha *= fade;

  // Output
  gl_FragColor = vec4(color, alpha);
}`

interface ParticlesOptions {
  siltCount?: number
  bubbleCount?: number
  bounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    minZ: number
    maxZ: number
  }
}

export class Particles extends THREE.InstancedMesh {
  declare material: THREE.ShaderMaterial & { uniforms: ParticlesUniforms }
  declare geometry: THREE.PlaneGeometry

  private readonly siltCount: number
  private readonly bubbleCount: number
  private readonly totalCount: number

  constructor(options: ParticlesOptions = {}) {
    const siltCount = options.siltCount ?? params.siltCount
    const bubbleCount = options.bubbleCount ?? params.bubbleCount
    const totalCount = siltCount + bubbleCount

    const bounds = options.bounds ?? {
      minX: -1.5,
      maxX: 1.5,
      minY: -3.0,
      maxY: -0.1,
      minZ: 0.0,
      maxZ: 3.0,
    }

    // Create geometry - simple quad for billboards (centered at origin)
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1)

    // Create material with custom shaders
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSiltDriftSpeed: { value: params.siltDriftSpeed },
        uSiltNoiseScale: { value: params.siltNoiseScale },
        uSiltColor: { value: params.siltColor as THREE.Color },
        uSiltOpacityMax: { value: params.siltOpacityMax },
        uBubbleRiseSpeed: { value: params.bubbleRiseSpeed },
        uBubbleWobbleAmount: { value: params.bubbleWobbleAmount },
        uBubbleSpawnHeight: { value: params.bubbleSpawnHeight },
        uBubbleColor: { value: params.bubbleColor as THREE.Color },
        uParticlesFogInfluence: { value: params.particlesFogInfluence },
        uCameraPosition: { value: new THREE.Vector3() },
        // Fog uniforms
        uFogColorShallow: { value: params.fogColorShallow as THREE.Color },
        uFogColorDeep: { value: params.fogColorDeep as THREE.Color },
        uFogDepthTop: { value: params.fogDepthTop },
        uFogDepthBottom: { value: params.fogDepthBottom },
        uFogNear: { value: params.fogNear },
        uFogFar: { value: params.fogFar },
        uFogExpK: { value: params.fogExpK },
        uSceneDepth: { value: null },
        uCameraNear: { value: 0.2 },
        uCameraFar: { value: 100.0 },
      },
      transparent: true,
      depthWrite: false, // Don't write to depth buffer (allows proper blending)
      depthTest: false, // Disable hardware depth test; we do manual test vs uSceneDepth
      side: THREE.DoubleSide,
      // Normal alpha blending for particles
      blending: THREE.NormalBlending,
    }) as THREE.ShaderMaterial & { uniforms: ParticlesUniforms }

    super(geometry, material, totalCount)

    this.siltCount = siltCount
    this.bubbleCount = bubbleCount
    this.totalCount = totalCount

    // Set render order to ensure particles render after water
    this.renderOrder = 1000

    // Set instance attributes
    this.setupInstanceAttributes(bounds)

    this.frustumCulled = false
  }

  private setupInstanceAttributes(bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    minZ: number
    maxZ: number
  }): void {
    const particleOffsets = new Float32Array(this.totalCount * 3)
    const particleTypes = new Float32Array(this.totalCount)
    const particleIds = new Float32Array(this.totalCount)
    const particleSizes = new Float32Array(this.totalCount)
    const particlePhases = new Float32Array(this.totalCount)

    let index = 0

    // Create silt particles
    for (let i = 0; i < this.siltCount; i++) {
      // Random position in bounds
      particleOffsets[index * 3 + 0] = THREE.MathUtils.lerp(bounds.minX, bounds.maxX, Math.random())
      particleOffsets[index * 3 + 1] = THREE.MathUtils.lerp(bounds.minY, bounds.maxY, Math.random())
      particleOffsets[index * 3 + 2] = THREE.MathUtils.lerp(bounds.minZ, bounds.maxZ, Math.random())

      // Type: 0.0 = silt
      particleTypes[index] = 0.0

      // Unique ID for noise variation
      particleIds[index] = Math.random()

      // Size variation
      particleSizes[index] = THREE.MathUtils.lerp(
        params.siltSizeMin,
        params.siltSizeMax,
        Math.random(),
      )

      // Random phase for animation
      particlePhases[index] = Math.random()

      index++
    }

    // Create bubble particles
    for (let i = 0; i < this.bubbleCount; i++) {
      // Random position in bounds (start near floor)
      particleOffsets[index * 3 + 0] = THREE.MathUtils.lerp(bounds.minX, bounds.maxX, Math.random())
      particleOffsets[index * 3 + 1] = params.bubbleSpawnHeight // Will be animated in shader
      particleOffsets[index * 3 + 2] = THREE.MathUtils.lerp(bounds.minZ, bounds.maxZ, Math.random())

      // Type: 1.0 = bubble
      particleTypes[index] = 1.0

      // Unique ID
      particleIds[index] = Math.random()

      // Size variation
      particleSizes[index] = THREE.MathUtils.lerp(
        params.bubbleSizeMin,
        params.bubbleSizeMax,
        Math.random(),
      )

      // Random phase (controls initial height offset)
      particlePhases[index] = Math.random()

      index++
    }

    // Set instance attributes
    this.geometry.setAttribute(
      'particleOffset',
      new THREE.InstancedBufferAttribute(particleOffsets, 3),
    )
    this.geometry.setAttribute('particleType', new THREE.InstancedBufferAttribute(particleTypes, 1))
    this.geometry.setAttribute('particleId', new THREE.InstancedBufferAttribute(particleIds, 1))
    this.geometry.setAttribute('particleSize', new THREE.InstancedBufferAttribute(particleSizes, 1))
    this.geometry.setAttribute(
      'particlePhase',
      new THREE.InstancedBufferAttribute(particlePhases, 1),
    )
  }

  update(time: number, camera: THREE.Camera): void {
    this.material.uniforms.uTime.value = time
    this.material.uniforms.uCameraPosition.value.copy(camera.position)
  }

  setDepthTexture(depth: THREE.Texture, camera: THREE.PerspectiveCamera): void {
    this.material.uniforms.uSceneDepth.value = depth
    this.material.uniforms.uCameraNear.value = camera.near
    this.material.uniforms.uCameraFar.value = camera.far
  }

  updateFogUniforms(): void {
    // Sync with current params (useful when params change via UI)
    this.material.uniforms.uFogColorShallow.value = params.fogColorShallow as THREE.Color
    this.material.uniforms.uFogColorDeep.value = params.fogColorDeep as THREE.Color
    this.material.uniforms.uFogDepthTop.value = params.fogDepthTop
    this.material.uniforms.uFogDepthBottom.value = params.fogDepthBottom
    this.material.uniforms.uFogNear.value = params.fogNear
    this.material.uniforms.uFogFar.value = params.fogFar
    this.material.uniforms.uFogExpK.value = params.fogExpK
  }
}
