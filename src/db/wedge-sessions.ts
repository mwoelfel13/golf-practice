import { createServerFn } from '@tanstack/react-start'
import sql from '../db'
import { getAuthenticatedUserId } from '../utils/supabase.server'

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

export const saveSession = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      minYards: number
      maxYards: number
      avgDiff: number
      stdDev: number
      shots: { target: number; actual: number; diff: number }[]
    }) => d,
  )
  .handler(async ({ data }) => {
    const userId = await getAuthenticatedUserId()

    const [session] = await sql<SessionRow[]>`
      insert into wedge_sessions (user_id, min_yards, max_yards, avg_diff, std_dev)
      values (${userId}, ${data.minYards}, ${data.maxYards}, ${data.avgDiff}, ${data.stdDev})
      returning *
    `

    if (data.shots.length > 0) {
      await sql`
        insert into shots ${sql(
          data.shots.map((s, i) => ({
            session_id: session.id,
            shot_number: i + 1,
            target: s.target,
            actual: s.actual,
            diff: s.diff,
          })),
        )}
      `
    }

    return session
  })

export const getSessions = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await getAuthenticatedUserId()

    const sessions = await sql<SessionRow[]>`
      select * from wedge_sessions
      where user_id = ${userId}
      order by created_at desc limit 20
    `
    return sessions
  },
)

export const getSessionWithShots = createServerFn({ method: 'GET' })
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }) => {
    const userId = await getAuthenticatedUserId()

    const [session] = await sql<SessionRow[]>`
      select * from wedge_sessions
      where id = ${data.sessionId} and user_id = ${userId}
    `
    if (!session) return null

    const shots = await sql<ShotRow[]>`
      select * from shots where session_id = ${data.sessionId} order by shot_number
    `

    return { session, shots }
  })
