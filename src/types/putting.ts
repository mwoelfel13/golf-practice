export interface PuttingSessionRow {
  id: string
  user_id: string
  total_putts: number
  putts_made: number
  make_pct: number
  three_putt_count: number
  created_at: string
}

export interface PuttingAttemptRow {
  id: string
  session_id: string
  putt_number: number
  distance: number
  slope: string
  break_dir: string
  made: boolean
  speed_miss: string | null
  direction_miss: string | null
  misread: boolean
  comeback_made: boolean | null
}

export interface PuttingAttemptInput {
  distance: number
  slope: string
  breakDir: string
  made: boolean
  speedMiss: string | null
  directionMiss: string | null
  misread: boolean
  comebackMade: boolean | null
}
