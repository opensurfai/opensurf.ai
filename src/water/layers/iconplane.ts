import * as THREE from 'three'

export interface IconPlaneOptions {
  textureUrl?: string
  width?: number
  height?: number
}

export class IconPlane extends THREE.Mesh {
  declare material: THREE.ShaderMaterial
  declare geometry: THREE.PlaneGeometry

  constructor(options: IconPlaneOptions = {}) {
    super()

    const textureUrl = options.textureUrl ?? '/icon.svg'
    const width = options.width ?? 0.8
    const height = options.height ?? 0.8

    const texture = new THREE.TextureLoader().load(textureUrl)
    // Keep source SVG colors faithful (sRGB)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying vec2 vUv;

        vec3 sRGBToLinear( in vec3 srgb ) {
          bvec3 cutoff = lessThanEqual( srgb, vec3( 0.04045 ) );
          vec3 lower = srgb / 12.92;
          vec3 higher = pow( ( srgb + 0.055 ) / 1.055, vec3( 2.4 ) );
          return mix( higher, lower, vec3( cutoff ) );
        }

        vec3 linearToSRGB( in vec3 linearRGB ) {
          bvec3 cutoff = lessThanEqual( linearRGB, vec3( 0.0031308 ) );
          vec3 lower = linearRGB * 12.92;
          vec3 higher = 1.055 * pow( max(linearRGB, vec3(0.0) ), vec3( 1.0 / 2.4 ) ) - 0.055;
          return mix( higher, lower, vec3( cutoff ) );
        }

        void main() {
          vec4 texel = texture2D( map, vUv );
          // Discard fully or near-fully transparent texels to avoid haloing
          if ( texel.a <= 0.01 ) discard;
          // Convert from texture (sRGB) -> linear working space
          vec3 colorLinear = sRGBToLinear( texel.rgb );
          // Optional tiny exposure trim if needed
          colorLinear *= 1.3;
          // Convert back to sRGB for output since we are not using includes
          vec3 colorOut = linearToSRGB( colorLinear );
          gl_FragColor = vec4( colorOut, 0.0 );
        }
      `,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      dithering: false,
      transparent: false,
    })

    this.geometry = new THREE.PlaneGeometry(width, height, 1, 1)
    // Horizontal, parallel to water surface at y=0
    this.rotation.x = -Math.PI * 0.5
    this.position.y = 0.05
  }
}
