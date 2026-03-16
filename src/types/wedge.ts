export interface SessionRow {
  id: string
  user_id: string
  min_yards: number
  max_yards: number
  avg_diff: number
  std_dev: number
  created_at: string
}

export interface ShotRow {
  id: string
  session_id: string
  shot_number: number
  target: number
  actual: number
  diff: number
}
