import * as THREE from 'three'
import { params } from '../params'

export interface SkyboxUniforms {
  uEnvironmentMap: { value: THREE.CubeTexture | null }
  uSkyRotation: { value: number }
  uExposure: { value: number }
  uContrast: { value: number }
  uSaturation: { value: number }
  uTint: { value: THREE.Color }
  uToneMapEnabled: { value: number }
  uWhitePoint: { value: number }
}

const vertexShader = `
precision highp float;

varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`

const fragmentShader = `
precision highp float;

uniform samplerCube uEnvironmentMap;
uniform float uSkyRotation; // radians around Y
uniform float uExposure; // exposure multiplier
uniform float uContrast; // 1.0 = none
uniform float uSaturation; // 1.0 = none
uniform vec3 uTint; // multiply tint
uniform float uToneMapEnabled; // 1.0 to enable filmic
uniform float uWhitePoint; // filmic white point

varying vec3 vWorldPosition;

mat3 rotationY(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(
    c, 0.0, -s,
    0.0, 1.0, 0.0,
    s, 0.0, c
  );
}

void main() {
  // Direction from camera to world position
  vec3 dir = normalize(vWorldPosition - cameraPosition);
  dir.x = -dir.x; // match coordinate convention used in water shader
  dir = rotationY(uSkyRotation) * dir;
  vec3 color = textureCube(uEnvironmentMap, dir).rgb;
  // exposure (scene linear HDR)
  color *= uExposure;
  // contrast around 0.5
  color = (color - 0.5) * uContrast + 0.5;
  // saturation: convert to luma then lerp
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, uSaturation);
  // tint
  color *= uTint;

  // optional ACES filmic tone mapping to roll off sun highlights
  if (uToneMapEnabled > 0.5) {
    // Narkowicz ACES fitted (column-major matrices)
    const mat3 acesInputMat = mat3(
      0.59719, 0.07600, 0.02840,
      0.35458, 0.90834, 0.13383,
      0.04823, 0.01566, 0.83777
    );
    const mat3 acesOutputMat = mat3(
      1.60475, -0.10208, -0.00327,
      -0.53108,  1.10813, -0.07276,
      -0.07367, -0.00605,  1.07602
    );
    // Apply white point as pre-scale (normalizes highlights before curve)
    vec3 v = acesInputMat * (color / max(uWhitePoint, 1e-3));
    // tone map curve
    float a = 2.51; float b = 0.03; float c = 2.43; float d = 0.59; float e = 0.14;
    v = (v * (a * v + b)) / (v * (c * v + d) + e);
    color = acesOutputMat * v;
    color = clamp(color, 0.0, 1.0);
  } else {
    color = clamp(color, 0.0, 1.0);
  }
  // Alpha = 0.2 to indicate this is skybox (NOT water surface)
  gl_FragColor = vec4(color, 0.2);
}`

export class Skybox extends THREE.Mesh {
  declare material: THREE.ShaderMaterial & { uniforms: SkyboxUniforms }
  declare geometry: THREE.BoxGeometry

  constructor(environmentMap: THREE.CubeTexture | null) {
    super()

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uEnvironmentMap: { value: environmentMap },
        uSkyRotation: { value: params.skyRotation },
        uExposure: { value: params.skyboxExposure },
        uContrast: { value: params.skyboxContrast },
        uSaturation: { value: params.skyboxSaturation },
        uTint: { value: params.skyboxTint },
        uToneMapEnabled: { value: (params as any).skyboxToneMapEnabled ? 1.0 : 0.0 },
        uWhitePoint: { value: (params as any).skyboxWhitePoint },
      },
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
    }) as THREE.ShaderMaterial & { uniforms: SkyboxUniforms }

    // Large cube surrounding the scene
    const size = 100
    this.geometry = new THREE.BoxGeometry(size, size, size)
    this.renderOrder = -1
  }
}
