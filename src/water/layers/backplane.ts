import * as THREE from 'three'

const vertexShader = `
varying vec3 vWorldPosition;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = modelPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * modelPosition;
}`

const fragmentShader = `
precision highp float;

varying vec3 vWorldPosition;

void main() {
  // Alpha = 1.0 to always apply fog
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}`

interface Options {
  width: number
  height: number
}

export class BackPlane extends THREE.Mesh {
  declare material: THREE.ShaderMaterial
  declare geometry: THREE.PlaneGeometry

  constructor({ width, height }: Options) {
    super()

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    })

    this.geometry = new THREE.PlaneGeometry(width, height, 2, 2)
  }
}
