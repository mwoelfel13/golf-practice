export { DeviationChart, type ShotResult } from './DeviationChart'
export { MakeRateChart } from './MakeRateChart'
export { DirectionalBiasChart } from './DirectionalBiasChart'
export { SpeedBiasChart } from './SpeedBiasChart'

export interface PuttResult {
  distance: number
  made: boolean
  speedMiss: string | null
  directionMiss: string | null
  misread: boolean
  comebackMade: boolean | null
}
