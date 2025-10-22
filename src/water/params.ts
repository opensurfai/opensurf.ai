import * as THREE from 'three'

// Type definitions for parameter configurations
export interface ParamConfig<T> {
  label: string
  default: T
  visible: boolean
  // Tweakpane-specific options
  min?: number
  max?: number
  step?: number
  view?: string
  color?: { type: string }
  // For special handling (syncing multiple uniforms, geometry recreation, etc.)
  onChange?: (value: T, context?: any) => void
}

// Helper type to extract the default value type from a ParamConfig
type ExtractDefault<T> = T extends ParamConfig<infer U> ? U : never

export const PARAMS = {
  horizonTint: {
    label: 'Horizon Tint',
    default: { r: 0.09, g: 0.34, b: 0.44 },
    visible: true,
    view: 'color',
    color: { type: 'float' },
  },
  // Background water specular (fake highlights)
  backgroundSpecularStrength: {
    label: 'Background Specular Strength',
    default: 0.12,
    visible: false,
    min: 0.0,
    max: 1.0,
    step: 0.01,
  },
  backgroundSpecularPower: {
    label: 'Background Specular Power',
    default: 8.0,
    visible: false,
    min: 1.0,
    max: 128.0,
    step: 1.0,
  },
  backgroundSpecularNoiseAmount: {
    label: 'Background Specular Noise',
    default: 0.77,
    visible: false,
    min: 0.0,
    max: 1.0,
    step: 0.01,
  },
  backgroundSpecularNoiseScale: {
    label: 'Background Specular Noise Scale',
    default: 1.0,
    visible: false,
    min: 0.02,
    max: 1.0,
    step: 0.01,
  },
  // Sky
  skyRotation: {
    label: 'Sky Rotation',
    default: 1.0,
    visible: false,
    min: -Math.PI,
    max: Math.PI,
    step: 0.001,
  },
  skyboxExposure: {
    label: 'Skybox Exposure',
    default: 2.96,
    visible: false,
    min: 0,
    max: 4,
    step: 0.01,
  },
  skyboxContrast: {
    label: 'Skybox Contrast',
    default: 0.83,
    visible: false,
    min: 0.0,
    max: 2.0,
    step: 0.01,
  },
  skyboxSaturation: {
    label: 'Skybox Saturation',
    default: 1.46,
    visible: false,
    min: 0.0,
    max: 2.0,
    step: 0.01,
  },
  skyboxTint: {
    label: 'Skybox Tint',
    default: { r: 1.0, g: 1.0, b: 1.0 },
    visible: false,
    view: 'color',
    color: { type: 'float' },
  },
  skyboxToneMapEnabled: {
    label: 'Skybox Filmic',
    default: true,
    visible: false,
  },
  skyboxWhitePoint: {
    label: 'Skybox White Point',
    default: 2.0,
    visible: false,
    min: 1.0,
    max: 32.0,
    step: 0.1,
  },
  // Water Geometry
  waterResolution: {
    label: 'Water Resolution',
    default: 512,
    visible: false,
    min: 2,
    max: 1024,
    step: 2,
  },

  // Waves
  wavesAmplitude: {
    label: 'Waves Amplitude',
    default: 0.025,
    visible: false,
    min: 0,
    max: 0.1,
  },
  wavesFrequency: {
    label: 'Waves Frequency',
    default: 1.07,
    visible: false,
    min: 0.1,
    max: 10,
  },
  wavesPersistence: {
    label: 'Waves Persistence',
    default: 0.3,
    visible: false,
    min: 0,
    max: 1,
  },
  wavesLacunarity: {
    label: 'Waves Lacunarity',
    default: 2.18,
    visible: false,
    min: 0,
    max: 3,
  },
  wavesIterations: {
    label: 'Waves Iterations',
    default: 8,
    visible: false,
    min: 1,
    max: 10,
    step: 1,
  },
  wavesSpeed: {
    label: 'Waves Speed',
    default: 0.4,
    visible: false,
    min: 0,
    max: 1,
  },
  // Water Color
  waterUseRawEnv: {
    label: 'Water Use Raw Env',
    default: true,
    visible: false,
  },
  waterExposure: {
    label: 'Water Exposure',
    default: 1.0,
    visible: false,
    min: 0,
    max: 4,
    step: 0.01,
  },
  undersideColor: {
    label: 'Underside Color',
    default: { r: 0.25, g: 0.49, b: 0.63 },
    visible: true,
    view: 'color',
    color: { type: 'float' },
  },
  refractionIOR: {
    label: 'Refraction IOR',
    default: 1.333,
    visible: false,
    min: 1.0,
    max: 2.0,
    step: 0.001,
  },
  undersideTransmissionStrength: {
    label: 'Underside Transmission',
    default: 0.8,
    visible: false,
    min: 0.0,
    max: 1.0,
    step: 0.01,
  },
  // Water color system using fog colors
  waterEdgeFadeDistance: {
    label: 'Water Edge Fade Distance',
    default: 0.4,
    visible: false,
    min: 0.0,
    max: 2.0,
    step: 0.01,
  },
  waterReflectionStrength: {
    label: 'Water Reflection Strength',
    default: 0.35,
    visible: false,
    min: 0,
    max: 1,
    step: 0.01,
  },

  // Planar debug controls
  planarDebug: {
    label: 'Planar Debug',
    default: 0,
    visible: true,
    min: 0,
    max: 1,
    step: 1,
  },
  planarBoost: {
    label: 'Planar Boost',
    default: 1.0,
    visible: false,
    min: 0.1,
    max: 5,
    step: 0.1,
  },

  // Fresnel
  fresnelScale: {
    label: 'Fresnel Scale',
    default: 0.8,
    visible: false,
    min: 0,
    max: 1,
  },
  fresnelPower: {
    label: 'Fresnel Power',
    default: 0.5,
    visible: false,
    min: 0,
    max: 3,
  },
  // Caustics
  causticsColor: {
    label: 'Caustics Color',
    default: '#ffffff',
    visible: false,
    view: 'color',
    color: { type: 'float' },
  },
  causticsIntensity: {
    label: 'Caustics Intensity',
    default: 0.15,
    visible: false,
    min: 0,
    max: 2,
  },
  causticsScale: {
    label: 'Caustics Scale',
    default: 6.0,
    visible: false,
    min: 0,
    max: 200,
  },
  causticsSpeed: {
    label: 'Caustics Speed',
    default: 0.5,
    visible: false,
    min: 0,
    max: 1,
  },
  causticsThickness: {
    label: 'Caustics Thickness',
    default: 0.4,
    visible: false,
    min: 0,
    max: 1,
  },
  causticsOffset: {
    label: 'Caustics Offset',
    default: 0.75,
    visible: false,
    min: 0,
    max: 2,
  },

  // Ground
  groundTextureScale: {
    label: 'Ground Texture Scale',
    default: 0.45,
    visible: false,
    min: 0.05,
    max: 5,
    step: 0.01,
  },
  groundTextureRotation: {
    label: 'Ground Texture Rotation',
    default: -1.161,
    visible: false,
    min: -Math.PI,
    max: Math.PI,
    step: 0.001,
  },
  groundDisplacementScale: {
    label: 'Ground Displacement',
    default: 0.7,
    visible: false,
    min: 0,
    max: 10,
    step: 0.005,
  },
  groundBrightness: {
    label: 'Ground Brightness',
    default: 0.8,
    visible: false,
    min: 0.1,
    max: 5,
    step: 0.01,
  },
  groundLightIntensity: {
    label: 'Ground Light Intensity',
    default: 0.3,
    visible: false,
    min: 0,
    max: 2,
    step: 0.01,
  },
  groundAmbientIntensity: {
    label: 'Ground Ambient Intensity',
    default: 0.7,
    visible: false,
    min: 0,
    max: 1,
    step: 0.01,
  },

  // Camera
  cameraDepth: {
    label: 'Camera Depth',
    default: 0.0,
    visible: false,
    min: 0,
    max: 1,
    step: 0.01,
  },
  cameraMinY: {
    label: 'Camera MinY',
    default: -2.8,
    visible: false,
    min: -10,
    max: 10,
    step: 0.1,
  },
  cameraMaxY: {
    label: 'Camera MaxY',
    default: 0.1,
    visible: false,
    min: -10,
    max: 10,
    step: 0.1,
  },

  // `Scroll` & Bobbing (drives ScrollController)
  scrollStiffness: {
    label: 'Scroll Stiffness',
    default: 15.0,
    visible: false,
    min: 0.1,
    max: 20.0,
    step: 0.1,
  },
  scrollDamping: {
    label: 'Scroll Damping',
    default: 10.0,
    visible: false,
    min: 0.1,
    max: 8.0,
    step: 0.1,
  },
  bobAmpY: {
    label: 'Bob Amplitude Y',
    default: 0.08,
    visible: false,
    min: 0.12,
    max: 0.5,
    step: 0.001,
  },
  bobAmpX: {
    label: 'Bob Amplitude X',
    default: 0.12,
    visible: false,
    min: 0.0,
    max: 0.5,
    step: 0.001,
  },
  bobPeriod: {
    label: 'Bob Period (seconds)',
    default: 8,
    visible: false,
    min: 1.0,
    max: 30.0,
    step: 0.1,
  },
  bobPhaseOffset: {
    label: 'Bob Phase Offset (rad)',
    default: 1.2,
    visible: false,
    min: 0.0,
    max: Math.PI * 2,
    step: 0.01,
  },

  // Underwater Fog
  fogEnabled: {
    label: 'Fog Enabled',
    default: 1.0,
    visible: false,
    min: 0,
    max: 1,
    step: 1,
  },
  fogColorShallow: {
    label: 'Fog Color (Shallow)',
    default: { r: 0.2, g: 0.67, b: 0.85 },
    visible: true,
    view: 'color',
    color: { type: 'float' },
  },
  fogColorDeep: {
    label: 'Fog Color (Deep)',
    default: { r: 0.0, g: 0.31, b: 0.45 },
    visible: true,
    view: 'color',
    color: { type: 'float' },
  },
  fogDepthTop: {
    label: 'Fog Depth Top',
    default: 0.0,
    visible: false,
    min: -10,
    max: 10,
    step: 0.1,
  },
  fogDepthBottom: {
    label: 'Fog Depth Bottom',
    default: -3.0,
    visible: false,
    min: -10,
    max: 10,
    step: 0.1,
  },
  fogDensityHeightFalloff: {
    label: 'Fog Density Falloff',
    default: 1.2,
    visible: false,
    min: 0.5,
    max: 3.0,
    step: 0.1,
  },
  fogNear: {
    label: 'Fog Near',
    default: 0.5,
    visible: false,
    min: 0.1,
    max: 6.0,
    step: 0.01,
  },
  fogFar: {
    label: 'Fog Far',
    default: 1.75,
    visible: false,
    min: 0.1,
    max: 7.0,
    step: 0.01,
  },
  fogCurveType: {
    label: 'Fog Curve Type',
    default: 1,
    visible: false,
    min: 0,
    max: 2,
    step: 1,
  },
  fogExpK: {
    label: 'Fog Exp K',
    default: 2.2,
    visible: false,
    min: 0.1,
    max: 5.0,
    step: 0.01,
  },
  fogPreviewMode: {
    label: 'Fog Preview',
    default: 0,
    visible: false,
    min: 0,
    max: 1,
    step: 1,
  },
  fogDistanceDarkening: {
    label: 'Fog Distance Darkening',
    default: 0.3,
    visible: false,
    min: 0.0,
    max: 1.0,
    step: 0.01,
  },

  // Particles
  particlesEnabled: {
    label: 'Particles Enabled',
    default: true,
    visible: false,
  },
  particlesFogInfluence: {
    label: 'Particles Fog Influence',
    default: 0.8,
    visible: false,
    min: 0.0,
    max: 1.0,
    step: 0.01,
  },

  // Silt
  siltCount: {
    label: 'Silt Count',
    default: 1000,
    visible: false,
    min: 0,
    max: 2000,
    step: 50,
  },
  siltSizeMin: {
    label: 'Silt Size Min',
    default: 0.004,
    visible: false,
    min: 0.0001,
    max: 1.0,
    step: 0.0001,
  },
  siltSizeMax: {
    label: 'Silt Size Max',
    default: 0.005,
    visible: false,
    min: 0.0001,
    max: 1.0,
    step: 0.0001,
  },
  siltColor: {
    label: 'Silt Color',
    default: { r: 1.0, g: 1.0, b: 1.0 },
    visible: false,
    view: 'color',
    color: { type: 'float' },
  },
  siltOpacityMax: {
    label: 'Silt Opacity Max',
    default: 0.2,
    visible: false,
    min: 0.0,
    max: 1.0,
    step: 0.01,
  },
  siltDriftSpeed: {
    label: 'Silt Drift Speed',
    default: 0.3,
    visible: false,
    min: 0.0,
    max: 2.0,
    step: 0.01,
  },
  siltNoiseScale: {
    label: 'Silt Noise Scale',
    default: 0.5,
    visible: false,
    min: 0.1,
    max: 2.0,
    step: 0.01,
  },

  // Bubbles
  bubbleCount: {
    label: 'Bubble Count',
    default: 100,
    visible: false,
    min: 0,
    max: 200,
    step: 5,
  },
  bubbleSizeMin: {
    label: 'Bubble Size Min',
    default: 0.006,
    visible: true,
    min: 0.001,
    max: 1.0,
    step: 0.0001,
  },
  bubbleSizeMax: {
    label: 'Bubble Size Max',
    default: 0.008,
    visible: true,
    min: 0.001,
    max: 1.0,
    step: 0.0001,
  },
  bubbleRiseSpeed: {
    label: 'Bubble Rise Speed',
    default: 0.1,
    visible: false,
    min: 0.01,
    max: 0.5,
    step: 0.01,
  },
  bubbleWobbleAmount: {
    label: 'Bubble Wobble',
    default: 0.02,
    visible: false,
    min: 0.0,
    max: 0.1,
    step: 0.001,
  },
  bubbleSpawnHeight: {
    label: 'Bubble Spawn Height',
    default: -3.0,
    visible: false,
    min: -3.0,
    max: -1.0,
    step: 0.1,
  },
  bubbleColor: {
    label: 'Bubble Color',
    default: { r: 0.9, g: 0.95, b: 1.0 },
    visible: false,
    view: 'color',
    color: { type: 'float' },
  },
} as const

// Infer the runtime values type from PARAMS
export type ParamsValues = {
  [K in keyof typeof PARAMS]: ExtractDefault<(typeof PARAMS)[K]>
}

// Helper function to convert color defaults to THREE.Color
function convertColorDefault(value: any): any {
  if (typeof value === 'object' && value !== null && 'r' in value && 'g' in value && 'b' in value) {
    return new THREE.Color(value.r, value.g, value.b)
  } else if (typeof value === 'string' && value.startsWith('#')) {
    return new THREE.Color(value)
  }
  return value
}

// Runtime values object - holds the current state of all parameters
export const params: ParamsValues = Object.fromEntries(
  Object.entries(PARAMS).map(([key, config]) => [
    key,
    convertColorDefault((config as any).default),
  ]),
) as ParamsValues

// Preset management utilities

/**
 * Export current parameter values as JSON string
 */
export function exportPreset(): string {
  return JSON.stringify(params, null, 2)
}

/**
 * Import parameter values from JSON string
 * Returns true if successful, false otherwise
 */
export function importPreset(json: string): boolean {
  try {
    const loaded = JSON.parse(json)
    // Validate that loaded keys exist in params
    for (const key of Object.keys(loaded)) {
      if (!(key in params)) {
        console.warn(`Unknown parameter key: ${key}`)
      }
    }
    // Update params with loaded values
    Object.assign(params, loaded)
    return true
  } catch (error) {
    console.error('Failed to import preset:', error)
    return false
  }
}

/**
 * Reset all parameters to their default values
 */
export function resetToDefaults(): void {
  for (const [key, config] of Object.entries(PARAMS)) {
    ;(params as any)[key] = convertColorDefault((config as any).default)
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Read text from clipboard
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText()
  } catch (error) {
    console.error('Failed to read from clipboard:', error)
    return null
  }
}
