import * as THREE from 'three'
import { Pane } from 'tweakpane'
import { Ground } from './layers/ground'
import { Particles } from './layers/particles'
import { Skybox } from './layers/skybox'
import { Water } from './layers/water'
import { BackgroundWater } from './layers/waterfar'
import {
  copyToClipboard,
  exportPreset,
  importPreset,
  PARAMS,
  params,
  readFromClipboard,
  resetToDefaults,
} from './params'

interface SetupUIParams {
  water: Water
  backgroundWater: BackgroundWater
  ground: Ground
  skybox: Skybox
  particles: Particles
  fogUniforms: Record<string, any>
}

// Store bindings for refresh after preset import
const bindings: any[] = []

export function setupUI({
  water,
  backgroundWater,
  ground,
  skybox,
  particles,
  fogUniforms,
}: SetupUIParams): void {
  const pane = new Pane()
  // Fix pane to viewport and ensure it renders above page content
  const paneEl = (pane as any).element as HTMLElement | undefined
  if (paneEl) {
    paneEl.style.position = 'fixed'
    paneEl.style.top = '16px'
    paneEl.style.right = '16px'
    paneEl.style.zIndex = '10000'
    paneEl.style.pointerEvents = 'auto'
  }
  // Preset management section at the top
  const presetFolder = pane.addFolder({ title: 'Presets', expanded: true })

  presetFolder.addButton({ title: 'Export to Clipboard' }).on('click', async () => {
    const json = exportPreset()
    const success = await copyToClipboard(json)
    if (success) {
      console.log('Preset exported to clipboard')
    }
  })

  presetFolder.addButton({ title: 'Import from Clipboard' }).on('click', async () => {
    const json = await readFromClipboard()
    if (json) {
      const success = importPreset(json)
      if (success) {
        console.log('Preset imported successfully')
        // Refresh all bindings
        bindings.forEach((binding) => binding.refresh())
      }
    }
  })

  presetFolder.addButton({ title: 'Reset to Defaults' }).on('click', () => {
    resetToDefaults()
    console.log('Reset to defaults')
    // Refresh all bindings
    bindings.forEach((binding) => binding.refresh())
  })

  // New params system - flat list of controls
  // Will be populated incrementally during migration
  for (const [key, config] of Object.entries(PARAMS)) {
    if (!config.visible) continue

    const paramConfig = config as any
    const bindingOptions: any = {
      label: paramConfig.label,
    }

    // Add tweakpane-specific options
    if (paramConfig.min !== undefined) bindingOptions.min = paramConfig.min
    if (paramConfig.max !== undefined) bindingOptions.max = paramConfig.max
    if (paramConfig.step !== undefined) bindingOptions.step = paramConfig.step
    if (paramConfig.view !== undefined) bindingOptions.view = paramConfig.view
    if (paramConfig.color !== undefined) bindingOptions.color = paramConfig.color

    // Sky mode: force a list selector with two options
    // no skyMode list; skyplane removed

    const binding = pane.addBinding(params as any, key as any, bindingOptions)

    // Store binding for later refresh
    bindings.push(binding)

    // Add onChange handler if specified (from config)
    if (paramConfig.onChange) {
      binding.on('change', ({ value }: { value: any }) => {
        paramConfig.onChange(value, { water, ground, skybox, particles, fogUniforms })
      })
    }

    // Add specific onChange handlers for parameters
    if (key === 'skyRotation') {
      binding.on('change', (ev: any) => {
        const value = ev.value as number
        skybox.material.uniforms.uSkyRotation.value = value
        water.material.uniforms.uSkyRotation.value = value
      })
    } else if (key === 'horizonTint') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uHorizonTint.value = ev.value
        if (
          backgroundWater &&
          backgroundWater.material &&
          (backgroundWater.material as any).uniforms
        ) {
          ;(backgroundWater.material as any).uniforms.uColor.value = ev.value
        }
      })
    } else if (key === 'skyboxExposure') {
      binding.on('change', (ev: any) => {
        const value = ev.value as number
        skybox.material.uniforms.uExposure.value = value
        water.material.uniforms.uSkyExposure.value = value
      })
    } else if (key === 'skyboxContrast') {
      binding.on('change', (ev: any) => {
        skybox.material.uniforms.uContrast.value = ev.value
        water.material.uniforms.uSkyContrast.value = ev.value
      })
    } else if (key === 'backgroundSpecularStrength') {
      binding.on('change', (ev: any) => {
        if (backgroundWater && (backgroundWater.material as any).uniforms) {
          ;(backgroundWater.material as any).uniforms.uSpecularStrength.value = ev.value
        }
      })
    } else if (key === 'backgroundSpecularPower') {
      binding.on('change', (ev: any) => {
        if (backgroundWater && (backgroundWater.material as any).uniforms) {
          ;(backgroundWater.material as any).uniforms.uSpecularPower.value = ev.value
        }
      })
    } else if (key === 'backgroundSpecularNoiseAmount') {
      binding.on('change', (ev: any) => {
        if (backgroundWater && (backgroundWater.material as any).uniforms) {
          ;(backgroundWater.material as any).uniforms.uSpecularNoiseAmount.value = ev.value
        }
      })
    } else if (key === 'backgroundSpecularNoiseScale') {
      binding.on('change', (ev: any) => {
        if (backgroundWater && (backgroundWater.material as any).uniforms) {
          ;(backgroundWater.material as any).uniforms.uSpecularNoiseScale.value = ev.value
        }
      })
    } else if (key === 'skyboxSaturation') {
      binding.on('change', (ev: any) => {
        skybox.material.uniforms.uSaturation.value = ev.value
        water.material.uniforms.uSkySaturation.value = ev.value
      })
    } else if (key === 'skyboxTint') {
      binding.on('change', (ev: any) => {
        skybox.material.uniforms.uTint.value = ev.value
        water.material.uniforms.uSkyTint.value = ev.value
      })
    } else if (key === 'skyboxToneMapEnabled') {
      binding.on('change', (ev: any) => {
        skybox.material.uniforms.uToneMapEnabled.value = ev.value ? 1.0 : 0.0
      })
    } else if (key === 'skyboxWhitePoint') {
      binding.on('change', (ev: any) => {
        skybox.material.uniforms.uWhitePoint.value = ev.value
      })
    } else if (key === 'waterUseRawEnv') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uUseRawEnv.value = ev.value ? 1.0 : 0.0
      })
    } else if (key === 'waterResolution') {
      binding.on('change', (ev: any) => {
        const value = ev.value as number
        // Get the current water plane dimensions from the geometry
        const bounds = water.geometry.boundingBox
        if (!bounds) water.geometry.computeBoundingBox()
        const bbox = water.geometry.boundingBox!
        const width = bbox.max.x - bbox.min.x
        const depth = bbox.max.z - bbox.min.z

        // Create new geometry with updated resolution
        const newGeometry = new THREE.PlaneGeometry(width, depth, value, value)
        water.geometry.dispose()
        water.geometry = newGeometry
      })
    } else if (key === 'wavesAmplitude') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uWavesAmplitude.value = ev.value
      })
    } else if (key === 'wavesFrequency') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uWavesFrequency.value = ev.value
      })
    } else if (key === 'wavesPersistence') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uWavesPersistence.value = ev.value
      })
    } else if (key === 'wavesLacunarity') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uWavesLacunarity.value = ev.value
      })
    } else if (key === 'wavesIterations') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uWavesIterations.value = ev.value
      })
    } else if (key === 'wavesSpeed') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uWavesSpeed.value = ev.value
      })
    } else if (key === 'waterExposure') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uExposure.value = ev.value
      })
    } else if (key === 'undersideColor') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uUndersideColor.value = ev.value
      })
    } else if (key === 'refractionIOR') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uRefractionIOR.value = ev.value
      })
    } else if (key === 'undersideTransmissionStrength') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uUndersideTransmissionStrength.value = ev.value
      })
    } else if (key === 'waterEdgeFadeDistance') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uEdgeFadeDistance.value = ev.value
      })
    } else if (key === 'waterReflectionStrength') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uWaterReflectionStrength.value = ev.value
      })
    } else if (key === 'fresnelScale') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uFresnelScale.value = ev.value
      })
    } else if (key === 'fresnelPower') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uFresnelPower.value = ev.value
      })
    } else if (key === 'planarDebug') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uPlanarDebug.value = ev.value ? 1.0 : 0.0
      })
    } else if (key === 'planarBoost') {
      binding.on('change', (ev: any) => {
        water.material.uniforms.uPlanarBoost.value = ev.value
      })
    } else if (key === 'causticsColor') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uCausticsColor.value = ev.value
      })
    } else if (key === 'causticsIntensity') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uCausticsIntensity.value = ev.value
      })
    } else if (key === 'causticsScale') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uCausticsScale.value = ev.value
      })
    } else if (key === 'causticsSpeed') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uCausticsSpeed.value = ev.value
      })
    } else if (key === 'causticsThickness') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uCausticsThickness.value = ev.value
      })
    } else if (key === 'causticsOffset') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uCausticsOffset.value = ev.value
      })
    } else if (key === 'groundDisplacementScale') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uDisplacementScale.value = ev.value
      })
    } else if (key === 'groundTextureScale') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uTextureScale.value = ev.value
      })
    } else if (key === 'groundTextureRotation') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uTextureRotation.value = ev.value
      })
    } else if (key === 'groundBrightness') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uBrightness.value = ev.value
      })
    } else if (key === 'groundLightIntensity') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uLightIntensity.value = ev.value
      })
    } else if (key === 'groundAmbientIntensity') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uAmbientIntensity.value = ev.value
      })
    } else if (key === 'displacementFadeStart') {
      binding.on('change', (ev: any) => {
        ground.material.uniforms.uDisplacementFadeStart.value = ev.value
      })
    } else if (key === 'fogEnabled') {
      binding.on('change', (ev: any) => {
        fogUniforms.uPostEnabled.value = ev.value
      })
    } else if (key === 'fogColorShallow') {
      binding.on('change', (ev: any) => {
        fogUniforms.uFogColorShallow.value = ev.value
        water.material.uniforms.uFogColorShallow.value = ev.value
        particles.material.uniforms.uFogColorShallow.value = ev.value
      })
    } else if (key === 'fogColorDeep') {
      binding.on('change', (ev: any) => {
        fogUniforms.uFogColorDeep.value = ev.value
        water.material.uniforms.uFogColorDeep.value = ev.value
        particles.material.uniforms.uFogColorDeep.value = ev.value
      })
    } else if (key === 'fogDepthTop') {
      binding.on('change', (ev: any) => {
        fogUniforms.uFogDepthTop.value = ev.value
      })
    } else if (key === 'fogDepthBottom') {
      binding.on('change', (ev: any) => {
        fogUniforms.uFogDepthBottom.value = ev.value
      })
    } else if (key === 'fogDensityHeightFalloff') {
      binding.on('change', (ev: any) => {
        fogUniforms.uFogDensityHeightFalloff.value = ev.value
      })
    } else if (key === 'fogNear') {
      binding.on('change', (ev: any) => {
        fogUniforms.uNear.value = ev.value
      })
    } else if (key === 'fogFar') {
      binding.on('change', (ev: any) => {
        fogUniforms.uFar.value = ev.value
      })
    } else if (key === 'fogCurveType') {
      binding.on('change', (ev: any) => {
        fogUniforms.uCurveType.value = ev.value
      })
    } else if (key === 'fogExpK') {
      binding.on('change', (ev: any) => {
        fogUniforms.uExpK.value = ev.value
      })
    } else if (key === 'fogPreviewMode') {
      binding.on('change', (ev: any) => {
        fogUniforms.uPreviewMode.value = ev.value
      })
    } else if (key === 'fogDistanceDarkening') {
      binding.on('change', (ev: any) => {
        fogUniforms.uDistanceDarkening.value = ev.value
      })
    } else if (key === 'particlesEnabled') {
      binding.on('change', (ev: any) => {
        particles.visible = ev.value
      })
    } else if (key === 'particlesFogInfluence') {
      binding.on('change', (ev: any) => {
        particles.material.uniforms.uParticlesFogInfluence.value = ev.value
      })
    } else if (key === 'siltDriftSpeed') {
      binding.on('change', (ev: any) => {
        particles.material.uniforms.uSiltDriftSpeed.value = ev.value
      })
    } else if (key === 'siltNoiseScale') {
      binding.on('change', (ev: any) => {
        particles.material.uniforms.uSiltNoiseScale.value = ev.value
      })
    } else if (key === 'siltColor') {
      binding.on('change', (ev: any) => {
        particles.material.uniforms.uSiltColor.value = ev.value
      })
    } else if (key === 'siltOpacityMax') {
      binding.on('change', (ev: any) => {
        particles.material.uniforms.uSiltOpacityMax.value = ev.value
      })
    } else if (key === 'bubbleRiseSpeed') {
      binding.on('change', (ev: any) => {
        particles.material.uniforms.uBubbleRiseSpeed.value = ev.value
      })
    } else if (key === 'bubbleWobbleAmount') {
      binding.on('change', (ev: any) => {
        particles.material.uniforms.uBubbleWobbleAmount.value = ev.value
      })
    } else if (key === 'bubbleSpawnHeight') {
      binding.on('change', (ev: any) => {
        particles.material.uniforms.uBubbleSpawnHeight.value = ev.value
      })
    } else if (key === 'bubbleColor') {
      binding.on('change', (ev: any) => {
        particles.material.uniforms.uBubbleColor.value = ev.value
      })
    } else if (key === 'cameraMinY' || key === 'cameraMaxY') {
      // Camera parameters are used in scroll calculations
      // No real-time update needed - they take effect on next scroll or page refresh
    }
  }

  // All parameters migrated to new centralized system!
}
