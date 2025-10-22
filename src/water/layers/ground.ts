import * as THREE from 'three'
import { params } from '../params'

interface GroundUniforms {
  uTexture: { value: THREE.Texture | null }
  uDisplacementMap: { value: THREE.Texture | null }
  uDisplacementScale: { value: number }
  uTime: { value: number }
  uTextureScale: { value: number }
  uTextureRotation: { value: number }
  uBrightness: { value: number }
  uCausticsColor: { value: THREE.Color }
  uCausticsIntensity: { value: number }
  uCausticsScale: { value: number }
  uCausticsSpeed: { value: number }
  uCausticsThickness: { value: number }
  uCausticsOffset: { value: number }
  uDisplacementFadeStart: { value: number }
  uPlaneDepth: { value: number }
  uLightIntensity: { value: number }
  uAmbientIntensity: { value: number }
}

const vertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform sampler2D uDisplacementMap;
uniform float uDisplacementScale;
uniform float uTextureScale;
uniform float uTextureRotation;
uniform float uDisplacementFadeStart;
uniform float uPlaneDepth;

void main() {
  vUv = uv;

  // Compute world position from the original vertex
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);

  // Sample displacement using world-space tiling so it matches fragment sampling
  vec2 worldUV = worldPosition.xz * uTextureScale;
  // Apply rotation around origin (world 0,0) for texture space
  float c = cos(uTextureRotation);
  float s = sin(uTextureRotation);
  mat2 rot = mat2(c, -s, s, c);
  worldUV = rot * worldUV;
  float displacement = texture2D(uDisplacementMap, worldUV).r;

  // Calculate depth-based attenuation (0 at front edge, 1 at back edge)
  float normalizedDepth = worldPosition.z / uPlaneDepth;
  float depthFade = 1.0 - smoothstep(uDisplacementFadeStart, 1.0, normalizedDepth);

  // Center displacement around 0 by subtracting 0.5, then scale with depth fade
  float finalDisplacement = (displacement - 0.5) * uDisplacementScale * depthFade;
  worldPosition.y += finalDisplacement;

  // Calculate normal from displacement map for lighting
  float eps = 0.01; // Sample offset for normal calculation
  
  // Sample neighboring heights
  vec2 worldUV_dx = (worldPosition.xz + vec2(eps, 0.0)) * uTextureScale;
  worldUV_dx = rot * worldUV_dx;
  float displacement_dx = texture2D(uDisplacementMap, worldUV_dx).r;
  float height_dx = (displacement_dx - 0.5) * uDisplacementScale * depthFade;
  
  vec2 worldUV_dz = (worldPosition.xz + vec2(0.0, eps)) * uTextureScale;
  worldUV_dz = rot * worldUV_dz;
  float displacement_dz = texture2D(uDisplacementMap, worldUV_dz).r;
  float height_dz = (displacement_dz - 0.5) * uDisplacementScale * depthFade;
  
  // Calculate tangent vectors
  vec3 tangentX = normalize(vec3(eps, height_dx - finalDisplacement, 0.0));
  vec3 tangentZ = normalize(vec3(0.0, height_dz - finalDisplacement, eps));
  
  // Normal is cross product of tangents
  vec3 objectNormal = normalize(cross(tangentZ, tangentX));
  vNormal = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz);

  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`

const fragmentShader = `
uniform float uTime;
uniform sampler2D uTexture;
uniform vec3 uCausticsColor;
uniform float uCausticsIntensity;
uniform float uCausticsOffset;
uniform float uCausticsScale;
uniform float uCausticsSpeed;
uniform float uCausticsThickness;
uniform float uTextureScale;
uniform float uBrightness;
uniform float uTextureRotation;
uniform float uLightIntensity;
uniform float uAmbientIntensity;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

// Simplex 3D Noise 
// by Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)
vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  // Permutations
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
  // ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0 / 7.0; // N=7
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

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

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  // Use world-space coordinates for consistent tiling
  vec2 worldUV = vWorldPosition.xz * uTextureScale;
  float c = cos(uTextureRotation);
  float s = sin(uTextureRotation);
  mat2 rot = mat2(c, -s, s, c);
  worldUV = rot * worldUV;
  vec4 texColor = texture2D(uTexture, worldUV);

  float caustics = 0.0;

  // Layer multiple caustic patterns using world coordinates
  caustics += uCausticsIntensity * (uCausticsOffset - abs(snoise(vec3(worldUV * uCausticsScale, uTime * uCausticsSpeed))));
  caustics += uCausticsIntensity * (uCausticsOffset - abs(snoise(vec3(worldUV.yx * uCausticsScale, -uTime * uCausticsSpeed))));

  // Shape the caustics
  caustics = smoothstep(0.5 - uCausticsThickness, 0.5 + uCausticsThickness, caustics);

  // Directional lighting from displacement - glancing angle for dramatic shadows
  vec3 lightDir = normalize(vec3(1.0, 0.15, 0.3)); // Light from low angle, side-to-side
  vec3 normal = normalize(vNormal);
  float diffuse = max(dot(normal, lightDir), 0.0);
  
  // Combine ambient and diffuse lighting
  float lighting = uAmbientIntensity + diffuse * uLightIntensity;
  
  vec3 finalColor = texColor.rgb * lighting + caustics * uCausticsColor;
  finalColor *= uBrightness;

  // Alpha = 1.0 to apply fog to ground
  gl_FragColor = vec4(finalColor, 1.0);
}`

interface GroundOptions {
  texture?: THREE.Texture
  displacementMap?: THREE.Texture
  width?: number
  depth?: number
  maxAspectRatio?: number
}

export class Ground extends THREE.Mesh {
  declare material: THREE.ShaderMaterial & { uniforms: GroundUniforms }
  declare geometry: THREE.PlaneGeometry

  constructor(options: GroundOptions = {}) {
    super()

    const width = options.width ?? 2
    const depth = options.depth ?? 2
    const maxAspectRatio = options.maxAspectRatio ?? 1.0

    // Calculate subdivisions based on max aspect ratio to maintain roughly square triangles
    const baseSegments = 256
    let segmentsX: number
    let segmentsZ: number

    if (maxAspectRatio > 1.0) {
      // Plane can be wider than deep - allocate more segments to width
      segmentsX = Math.round(baseSegments * maxAspectRatio)
      segmentsZ = baseSegments
    } else {
      // Square or taller
      segmentsX = baseSegments
      segmentsZ = baseSegments
    }

    // Set textures to repeat for tiling
    if (options.texture) {
      options.texture.wrapS = THREE.RepeatWrapping
      options.texture.wrapT = THREE.RepeatWrapping
    }
    if (options.displacementMap) {
      options.displacementMap.wrapS = THREE.RepeatWrapping
      options.displacementMap.wrapT = THREE.RepeatWrapping
    }

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: options.texture ?? null },
        uDisplacementMap: { value: options.displacementMap ?? null },
        uDisplacementScale: { value: params.groundDisplacementScale },
        uTime: { value: 0 },
        uTextureScale: { value: params.groundTextureScale },
        uTextureRotation: { value: params.groundTextureRotation },
        uBrightness: { value: params.groundBrightness },
        uCausticsColor: { value: params.causticsColor },
        uCausticsIntensity: { value: params.causticsIntensity },
        uCausticsScale: { value: params.causticsScale },
        uCausticsSpeed: { value: params.causticsSpeed },
        uCausticsThickness: { value: params.causticsThickness },
        uCausticsOffset: { value: params.causticsOffset },
        uDisplacementFadeStart: { value: 0.5 },
        uPlaneDepth: { value: depth },
        uLightIntensity: { value: params.groundLightIntensity },
        uAmbientIntensity: { value: params.groundAmbientIntensity },
      },
    }) as THREE.ShaderMaterial & { uniforms: GroundUniforms }

    // Use calculated subdivisions to maintain roughly square triangles
    this.geometry = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ)
    this.rotation.x = -Math.PI * 0.5
    this.position.y = -3
    this.position.z = depth / 2 // Front edge at z=0
  }

  update(time: number): void {
    this.material.uniforms.uTime.value = time
  }
}
