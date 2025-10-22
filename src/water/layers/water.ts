import * as THREE from 'three'
import { params } from '../params'

export interface WaterUniforms {
  uTime: { value: number }
  uOpacity: { value: number }
  uEnvironmentMap: { value: THREE.CubeTexture | null }
  uPlanarMap: { value: THREE.Texture | null }
  uPlanarDebug: { value: number }
  uPlanarBoost: { value: number }
  uMirrorMatrix: { value: THREE.Matrix4 }
  uMirrorMap: { value: THREE.Texture | null }
  uSkyRotation: { value: number }
  uExposure: { value: number }
  // Grading applied to environment map contributions (reflections/refractions)
  uSkyExposure: { value: number }
  uSkyContrast: { value: number }
  uSkySaturation: { value: number }
  uSkyTint: { value: THREE.Color }
  uUseRawEnv: { value: number }
  uDebugSolidColorEnabled: { value: number }
  uDebugColor: { value: THREE.Color }
  uWavesAmplitude: { value: number }
  uWavesFrequency: { value: number }
  uWavesPersistence: { value: number }
  uWavesLacunarity: { value: number }
  uWavesIterations: { value: number }
  uWavesSpeed: { value: number }
  uPlaneDepth: { value: number }
  uPlaneWidth: { value: number }
  uEdgeFadeDistance: { value: number }
  // Water color from fog colors
  uFogColorShallow: { value: THREE.Color }
  uFogColorDeep: { value: THREE.Color }
  uWaterReflectionStrength: { value: number }
  // Horizon haze
  uHorizonTint: { value: THREE.Color }
  // Fresnel
  uFresnelScale: { value: number }
  uFresnelPower: { value: number }
  // Underside
  uUndersideColor: { value: THREE.Color }
  uRefractionIOR: { value: number }
  uUndersideTransmissionStrength: { value: number }
}

const vertexShader = `
precision highp float;

uniform float uTime;

uniform float uWavesAmplitude;
uniform float uWavesSpeed;
uniform float uWavesFrequency;
uniform float uWavesPersistence;
uniform float uWavesLacunarity;
uniform float uWavesIterations;
uniform float uPlaneDepth;
uniform float uPlaneWidth;
uniform float uEdgeFadeDistance;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vEdgeFade;

//\tSimplex 3D Noise 
//\tby Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)
//
vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

// Simplex 2D noise
//
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Helper function to calculate elevation at any point
float getElevation(float x, float z) {
  vec2 pos = vec2(x, z);

  float elevation = 0.0;
  float amplitude = 1.0;
  float frequency = uWavesFrequency;
  vec2 p = pos.xy;

  for(float i = 0.0; i < uWavesIterations; i++) {
    float noiseValue = snoise(p * frequency + uTime * uWavesSpeed);
    elevation += amplitude * noiseValue;
    amplitude *= uWavesPersistence;
    frequency *= uWavesLacunarity;
  }

  elevation *= uWavesAmplitude;

  return elevation;
}

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  
  // Edge-based attenuation (fade toward left, right, and back edges; NOT the front edge)
  float halfW = uPlaneWidth * 0.5;
  float distLeft = position.x + halfW;
  float distRight = halfW - position.x;
  float distBack = uPlaneDepth - modelPosition.z;
  float edgeDist = min(min(distLeft, distRight), distBack);
  vEdgeFade = clamp(smoothstep(0.0, uEdgeFadeDistance, edgeDist), 0.0, 1.0);
  
  float elevation = getElevation(modelPosition.x, modelPosition.z);
  modelPosition.y += elevation * vEdgeFade;

  // Calculate normal using partial derivatives
  float eps = 0.001;
  float combinedFade = vEdgeFade;
  vec3 tangent = normalize(vec3(eps, getElevation(modelPosition.x - eps, modelPosition.z) * combinedFade - elevation * combinedFade, 0.0));
  vec3 bitangent = normalize(vec3(0.0, getElevation(modelPosition.x, modelPosition.z - eps) * combinedFade - elevation * combinedFade, eps));
  vec3 objectNormal = normalize(cross(tangent, bitangent));

  vNormal = objectNormal;
  vWorldPosition = modelPosition.xyz;

  gl_Position = projectionMatrix * viewMatrix * modelPosition;
}`

const fragmentShader = `
precision highp float;

uniform float uSkyRotation;
uniform float uExposure;
// Grading for environment sampling to match skybox controls
uniform float uSkyExposure;
uniform float uSkyContrast;
uniform float uSkySaturation;
uniform vec3 uSkyTint;
uniform float uUseRawEnv; // 1.0 = use raw HDR env, bypass grading

// Debug solid color rendering (0.0 disabled, 1.0 enabled)
uniform float uDebugSolidColorEnabled;
uniform vec3 uDebugColor;

// Water color from fog colors
uniform vec3 uFogColorShallow;
uniform vec3 uFogColorDeep;
// Edge-based system replaces camera-distance-based water color

uniform float uWaterReflectionStrength;
uniform float uFresnelScale;
uniform float uFresnelPower;

// Horizon haze
uniform vec3 uHorizonTint; // unified horizon tint

uniform vec3 uUndersideColor; // matte underside color
uniform float uRefractionIOR; // index of refraction for water (e.g., 1.333)
uniform float uUndersideTransmissionStrength; // how much of refracted sky shows through from below

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vEdgeFade;

uniform samplerCube uEnvironmentMap;
uniform sampler2D uPlanarMap; // top-down capture of scene elements above water (e.g. icon plane)
uniform float uPlaneWidth;
uniform float uPlaneDepth;
uniform float uPlanarDebug; // 1.0 = draw planar texture directly for debugging
uniform float uPlanarBoost; // multiply planar contribution
uniform mat4 uMirrorMatrix; // world -> mirror projected coords
uniform sampler2D uMirrorMap; // rendered scene from mirror camera

mat3 rotationY(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(
    c, 0.0, -s,
    0.0, 1.0, 0.0,
    s, 0.0, c
  );
}

// Approximate sRGB -> Linear conversion (sufficient for UI textures)
vec3 srgbToLinear(vec3 c) {
  return pow(c, vec3(2.2));
}

vec3 applySkyGrading(vec3 color) {
  color *= uSkyExposure;
  color = (color - 0.5) * uSkyContrast + 0.5;
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, uSkySaturation);
  color *= uSkyTint;
  return clamp(color, 0.0, 1.0);
}

void main() {
  // If debug solid color is enabled, output it immediately
  if (uDebugSolidColorEnabled > 0.5) {
    gl_FragColor = vec4(uDebugColor, 1.0);
    return;
  }
  // Calculate vector from camera to the vertex
  vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
  vec3 reflectedDirection = reflect(viewDirection, vNormal);
  reflectedDirection.x = -reflectedDirection.x;
  reflectedDirection = rotationY(uSkyRotation) * reflectedDirection;

  // Sample environment map to get the sky reflection
  vec4 reflectionColor = textureCube(uEnvironmentMap, reflectedDirection);
  if (uUseRawEnv < 0.5) {
    reflectionColor.rgb = applySkyGrading(reflectionColor.rgb);
  }

  // Planar projection UVs for sampling uPlanarMap (debug decal) and mirror texture
  // World XZ mapped into [0,1] using a reasonable scale assuming plane centered at z in [0, uPlaneDepth]
  // The offscreen capture will be set to cover the foreground water extents.
  vec2 planarUV = vec2(0.0);
  planarUV.x = clamp(vWorldPosition.x / max(uPlaneWidth, 1e-3) + 0.5, 0.0, 1.0);
  // Centered Z mapping: water spans [-uPlaneDepth/2, +uPlaneDepth/2]
  planarUV.y = clamp((vWorldPosition.z - 0.5 * uPlaneDepth) / max(uPlaneDepth, 1e-3) + 0.5, 0.0, 1.0);
  vec4 planarSample = texture2D(uPlanarMap, planarUV);
  // Decode from sRGB because planarRT is stored as sRGB but our pipeline mixes in linear
  planarSample.rgb = srgbToLinear(planarSample.rgb);
  planarSample.rgb *= uPlanarBoost;

  // Mirror sampling using provided matrix (project world position)
  vec4 clip = uMirrorMatrix * vec4(vWorldPosition, 1.0);
  vec2 mirrorUV = clip.xy / max(clip.w, 1e-6) * 0.5 + 0.5;
  vec3 mirrorSample = texture2D(uMirrorMap, mirrorUV).rgb;

  // Encode surface information in alpha channel for post-processing  
  // Alpha = 0.0 for top surface (no fog), 1.0 for bottom surface (fog)
  float surfaceFlag = gl_FrontFacing ? 0.0 : 1.0;
  
  // We'll compute a base water color for both sides, then apply haze/horizon
  vec3 baseColor;
  if (gl_FrontFacing) {
    // Top surface - mix water color with reflections
    
    // 1. Base water color using fog colors (no camera-distance dependency)
    vec3 waterColor = mix(uFogColorShallow, uFogColorDeep, 0.5);
    
    // 2. Calculate Fresnel for reflection blend
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = uFresnelScale * pow(1.0 - max(dot(viewDir, vNormal), 0.0), uFresnelPower);
    fresnel = clamp(fresnel, 0.0, 1.0);
    
    // 3. Blend water color with reflection based on Fresnel
    float reflectionMix = fresnel * uWaterReflectionStrength;
    // Mix in planar reflection contribution (icon plane etc.) before horizon tint
    vec3 planarRef = planarSample.rgb;
    // Combine sky reflection with true mirror (no decal in normal mode)
    vec3 combinedReflection = mix(reflectionColor.rgb, mirrorSample, 0.85);
    vec3 surfaceColor = mix(waterColor, combinedReflection, reflectionMix);
    // Debug: directly show planar sample to validate capture and UVs
    if (uPlanarDebug > 0.5) {
      gl_FragColor = vec4(planarRef, 0.0);
      return;
    }
    
    // 4. Apply horizon tint based on edge fade (1.0 at edges)
    surfaceColor = mix(surfaceColor, uHorizonTint, 1.0 - vEdgeFade);
    
    // 5. Apply exposure
    surfaceColor = clamp(surfaceColor * uExposure, 0.0, 1.0);
    
    gl_FragColor = vec4(surfaceColor, surfaceFlag);
  } else {
    // Underside: blend dedicated color with refracted skybox for realistic transmission
    // Normal should point toward the air when viewed from below
    vec3 N = normalize(-vNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);

    // Compute refracted direction from water to air
    float eta = 1.0 / max(uRefractionIOR, 1e-4);
    vec3 refractedDir = refract(-V, N, eta);
    // Rotate to match sky orientation and coordinate convention
    refractedDir.x = -refractedDir.x;
    refractedDir = rotationY(uSkyRotation) * refractedDir;

    // Fresnel term using Schlick's approximation for water->air
    float cosTheta = clamp(dot(V, N), 0.0, 1.0);
    float F0 = pow((uRefractionIOR - 1.0) / (uRefractionIOR + 1.0), 2.0);
    float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);

    // Sample skybox along refracted direction
    vec3 refractedColor = textureCube(uEnvironmentMap, refractedDir).rgb;
    if (uUseRawEnv < 0.5) {
      refractedColor = applySkyGrading(refractedColor);
    }

    // Slightly mix in planar map as blurred color beneath surface for refraction
    // Use same planar UV; modulate by (1.0 - fresnel)
    vec3 refractedCombined = mix(refractedColor, planarSample.rgb, clamp(planarSample.a, 0.0, 1.0) * 0.4 * (1.0 - fresnel));

    // Total internal reflection handling: refract returns near-zero when invalid
    float hasRefraction = step(1e-4, length(refractedDir));
    float transmission = (1.0 - fresnel) * uUndersideTransmissionStrength * hasRefraction;

    // Blend between water underside tint and refracted sky
    baseColor = mix(uUndersideColor, refractedCombined, transmission);
    baseColor = clamp(baseColor * uExposure, 0.0, 1.0);
    gl_FragColor = vec4(baseColor, surfaceFlag);
  }
}`

export interface WaterOptions {
  environmentMap?: THREE.CubeTexture
  resolution?: number
  width?: number
  depth?: number
  maxAspectRatio?: number
}

export class Water extends THREE.Mesh {
  declare material: THREE.ShaderMaterial & { uniforms: WaterUniforms }
  declare geometry: THREE.PlaneGeometry

  constructor(options: WaterOptions = {}) {
    super()

    const width = options.width ?? 2
    const depth = options.depth ?? 2
    const resolution = options.resolution ?? 512
    const maxAspectRatio = options.maxAspectRatio ?? 1.0

    // Calculate subdivisions based on max aspect ratio to maintain roughly square triangles
    let segmentsX: number
    let segmentsZ: number

    if (maxAspectRatio > 1.0) {
      // Plane can be wider than deep - allocate more segments to width
      segmentsX = Math.round(resolution * maxAspectRatio)
      segmentsZ = resolution
    } else {
      // Square or taller
      segmentsX = resolution
      segmentsZ = resolution
    }

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uEnvironmentMap: { value: options.environmentMap ?? null },
        uPlanarMap: { value: null },
        uPlanarDebug: { value: 0 },
        uPlanarBoost: { value: 1.0 },
        uMirrorMatrix: { value: new THREE.Matrix4() },
        uMirrorMap: { value: null },
        uSkyRotation: { value: params.skyRotation },
        uExposure: { value: params.waterExposure },
        // Apply skybox grading to env sampling inside water shader
        uSkyExposure: { value: params.skyboxExposure },
        uSkyContrast: { value: params.skyboxContrast },
        uSkySaturation: { value: params.skyboxSaturation },
        uSkyTint: { value: params.skyboxTint },
        uUseRawEnv: { value: (params as any).waterUseRawEnv ? 1.0 : 0.0 },
        uDebugSolidColorEnabled: { value: 0 },
        uDebugColor: { value: new THREE.Color(1, 0, 0) },
        uWavesAmplitude: { value: params.wavesAmplitude },
        uWavesFrequency: { value: params.wavesFrequency },
        uWavesPersistence: { value: params.wavesPersistence },
        uWavesLacunarity: { value: params.wavesLacunarity },
        uWavesIterations: { value: params.wavesIterations },
        uWavesSpeed: { value: params.wavesSpeed },
        uPlaneDepth: { value: depth },
        uPlaneWidth: { value: width },
        uEdgeFadeDistance: { value: params.waterEdgeFadeDistance },
        // Water color from fog colors
        uFogColorShallow: { value: params.fogColorShallow },
        uFogColorDeep: { value: params.fogColorDeep },
        uWaterReflectionStrength: { value: params.waterReflectionStrength },
        // Horizon tint (unified)
        uHorizonTint: { value: (params as any).horizonTint },
        // Fresnel
        uFresnelScale: { value: params.fresnelScale },
        uFresnelPower: { value: params.fresnelPower },
        // Underside
        uUndersideColor: { value: params.undersideColor },
        uRefractionIOR: { value: params.refractionIOR },
        uUndersideTransmissionStrength: { value: params.undersideTransmissionStrength },
      },
      transparent: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    }) as THREE.ShaderMaterial & { uniforms: WaterUniforms }

    this.geometry = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ)
    this.rotation.x = -Math.PI * 0.5
    this.position.y = 0
    this.position.z = depth / 2 // Front edge at z=0
  }

  update(time: number): void {
    this.material.uniforms.uTime.value = time
  }
}
