import * as THREE from 'three'
import { params } from '../params'

const vertexShader = `
varying vec3 vWorldPosition;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = modelPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * modelPosition;
}`

const fragmentShader = `
precision highp float;

uniform vec3 uColor;
uniform float uTime;
uniform float uSpecularStrength;
uniform float uSpecularPower;
uniform float uSpecularNoiseAmount;
uniform float uSpecularNoiseScale;
uniform float uCutoutWidth;
uniform float uCutoutDepth;
uniform float uCutoutOffsetX;
uniform float uCutoutOffsetZ;

varying vec3 vWorldPosition;

void main() {
  // Only render from the front edge of water backwards (z >= 0)
  if (vWorldPosition.z < 0.0) {
    discard;
  }
  // Check if this fragment is within the cutout bounds (where foreground water is)
  float halfWidth = uCutoutWidth * 0.5;
  float halfDepth = uCutoutDepth * 0.5;
  
  float minX = uCutoutOffsetX - halfWidth;
  float maxX = uCutoutOffsetX + halfWidth;
  float minZ = uCutoutOffsetZ - halfDepth;
  float maxZ = uCutoutOffsetZ + halfDepth;
  
  bool inCutout = vWorldPosition.x >= minX && vWorldPosition.x <= maxX &&
                  vWorldPosition.z >= minZ && vWorldPosition.z <= maxZ;
  
  if (inCutout) {
    discard; // Cut a hole for the foreground water to show through
  }
  
  // Subtle animated color variation (very low-cost)
  // Use low-frequency waves in XZ and slow time to avoid flicker
  vec2 uv = vWorldPosition.xz * uSpecularNoiseScale;
  float t = uTime;
  float w1 = sin(uv.x * 2.1 + t * 0.07);
  float w2 = sin(uv.y * 1.7 - t * 0.05);
  float w3 = sin((uv.x + uv.y) * 0.75 + t * 0.03);
  float m = (w1 * 0.35 + w2 * 0.25 + w3 * 0.4) * 0.03; // ~±3%
  vec3 color = clamp(uColor * (1.0 + m), 0.0, 1.0);

  // Fake specular highlights to mimic foreground water
  // Build a cheap procedural normal from two very low-frequency wave gradients
  vec2 d1 = normalize(vec2(1.0, 0.3));
  vec2 d2 = normalize(vec2(-0.2, 1.0));
  float p1 = dot(uv, d1) * 2.0 + t * 0.08;
  float p2 = dot(uv, d2) * 1.6 - t * 0.06;
  float A1 = 0.015;
  float A2 = 0.010;
  // Analytic partial derivatives of sine waves
  float dhdx = A1 * cos(p1) * d1.x * 2.0 + A2 * cos(p2) * d2.x * 1.6;
  float dhdz = A1 * cos(p1) * d1.y * 2.0 + A2 * cos(p2) * d2.y * 1.6;
  vec3 N = normalize(vec3(-dhdx, 1.0, -dhdz));
  vec3 V = normalize(cameraPosition - vWorldPosition);
  vec3 L = normalize(vec3(-0.2, 1.0, 0.3)); // simple sky light
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), uSpecularPower);
  // Add small noise to break up specular uniformity
  float noise = (sin(uv.x * 8.3 + t * 0.21) * 0.5 + 0.5) * (sin(uv.y * 7.1 - t * 0.17) * 0.5 + 0.5);
  float specMod = mix(1.0, 0.8 + 0.4 * noise, uSpecularNoiseAmount);
  color += uSpecularStrength * spec * specMod;
  color = clamp(color, 0.0, 1.0);

  // Do not contribute to fog post-process; treat as background/sky color
  gl_FragColor = vec4(color, 0.0);
}`

export interface BackgroundWaterOptions {
  width?: number
  depth?: number
  color?: THREE.Color
  cutoutWidth?: number
  cutoutDepth?: number
  cutoutOffsetX?: number
  cutoutOffsetZ?: number
}

export class BackgroundWater extends THREE.Mesh {
  declare material: THREE.ShaderMaterial
  declare geometry: THREE.PlaneGeometry

  constructor(options: BackgroundWaterOptions = {}) {
    super()

    const width = options.width ?? 20
    const depth = options.depth ?? 20
    const color = options.color ?? (params as any).horizonTint
    const cutoutWidth = options.cutoutWidth ?? 0
    const cutoutDepth = options.cutoutDepth ?? 0
    const cutoutOffsetX = options.cutoutOffsetX ?? 0
    const cutoutOffsetZ = options.cutoutOffsetZ ?? 0

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: color },
        uTime: { value: 0 },
        uSpecularStrength: { value: (params as any).backgroundSpecularStrength },
        uSpecularPower: { value: (params as any).backgroundSpecularPower },
        uCutoutWidth: { value: cutoutWidth },
        uCutoutDepth: { value: cutoutDepth },
        uCutoutOffsetX: { value: cutoutOffsetX },
        uCutoutOffsetZ: { value: cutoutOffsetZ },
        uSpecularNoiseAmount: { value: (params as any).backgroundSpecularNoiseAmount },
        uSpecularNoiseScale: { value: (params as any).backgroundSpecularNoiseScale },
      },
      transparent: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    })

    this.geometry = new THREE.PlaneGeometry(width, depth, 64, 64)
    this.rotation.x = Math.PI * 0.5
    this.position.y = 0
  }

  update(time: number): void {
    ;(this.material.uniforms as any).uTime.value = time
  }
}
