import * as THREE from 'three'
import { params } from './params'

export class ScrollController {
  private camera: THREE.PerspectiveCamera | THREE.Camera
  private cameraDistance: number

  private targetDepth = 0 // 0..1 from page scroll
  private depthPos = 0 // smoothed position 0..1
  private depthVel = 0 // smoothed velocity
  private xPos = 0 // lateral spring position (side-to-side)
  private xVel = 0 // lateral spring velocity
  private lastTime = 0 // for dt calculation
  private boundOnScroll: () => void

  constructor(camera: THREE.PerspectiveCamera | THREE.Camera, cameraDistance: number) {
    this.camera = camera
    this.cameraDistance = cameraDistance
    this.depthPos = this.targetDepth = params.cameraDepth

    this.boundOnScroll = () => {
      this.targetDepth = this.getScrollProgress()
    }
    window.addEventListener('scroll', this.boundOnScroll, { passive: true })
    this.targetDepth = this.getScrollProgress()
  }

  public destroy(): void {
    window.removeEventListener('scroll', this.boundOnScroll)
  }

  public update(elapsedTime: number): number {
    const dt = Math.max(0, Math.min(0.05, elapsedTime - this.lastTime))
    this.lastTime = elapsedTime

    // Calculate unified angular frequency from period (in seconds)
    const omega = (2 * Math.PI) / params.bobPeriod

    // Vertical spring (depth), forced by sinusoidal acceleration (water currents in Y)
    const yForce = Math.sin(elapsedTime * omega) * params.bobAmpY
    const accY =
      params.scrollStiffness * (this.targetDepth - this.depthPos) -
      params.scrollDamping * this.depthVel +
      yForce
    this.depthVel += accY * dt
    this.depthPos += this.depthVel * dt

    // Base Y from params window
    const yBase = params.cameraMaxY + this.depthPos * (params.cameraMinY - params.cameraMaxY)

    // Lateral X spring around 0, forced by sinusoidal acceleration with phase offset
    const xForce = Math.sin(elapsedTime * omega + params.bobPhaseOffset) * params.bobAmpX
    const accX = -params.scrollStiffness * this.xPos - params.scrollDamping * this.xVel + xForce
    this.xVel += accX * dt
    this.xPos += this.xVel * dt

    const x = this.xPos // X varies laterally (side to side)
    const y = yBase // Y bobbing applied via vertical spring forcing
    const z = -this.cameraDistance // Z is camera depth (negative, behind front edge at z=0)
    this.camera.position.set(x, y, z)
    this.camera.lookAt(x, y, z + 1) // Look forward down +Z axis

    return this.depthPos
  }

  private getScrollProgress(): number {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    return Math.min(1, Math.max(0, window.scrollY / max))
  }
}
