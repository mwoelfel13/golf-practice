import { createServerFn } from '@tanstack/react-start'
import sql from '../db'
import { getAuthenticatedUserId } from '../utils/supabase.server'

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

export const savePuttingSession = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      totalPutts: number
      puttsMade: number
      makePct: number
      threePuttCount: number
      attempts: PuttingAttemptInput[]
    }) => d,
  )
  .handler(async ({ data }) => {
    const userId = await getAuthenticatedUserId()

    const [session] = await sql<PuttingSessionRow[]>`
      insert into putting_sessions (user_id, total_putts, putts_made, make_pct, three_putt_count)
      values (${userId}, ${data.totalPutts}, ${data.puttsMade}, ${data.makePct}, ${data.threePuttCount})
      returning *
    `

    if (data.attempts.length > 0) {
      await sql`
        insert into putting_attempts ${sql(
          data.attempts.map((a, i) => ({
            session_id: session.id,
            putt_number: i + 1,
            distance: a.distance,
            slope: a.slope,
            break_dir: a.breakDir,
            made: a.made,
            speed_miss: a.speedMiss,
            direction_miss: a.directionMiss,
            misread: a.misread,
            comeback_made: a.comebackMade,
          })),
        )}
      `
    }

    return session
  })

export const getPuttingSessions = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await getAuthenticatedUserId()

    const sessions = await sql<PuttingSessionRow[]>`
      select * from putting_sessions
      where user_id = ${userId}
      order by created_at desc limit 20
    `
    return sessions
  },
)

export const getPuttingSessionAttempts = createServerFn({ method: 'GET' })
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }) => {
    const userId = await getAuthenticatedUserId()

    const attempts = await sql<PuttingAttemptRow[]>`
      select pa.* from putting_attempts pa
      join putting_sessions ps on ps.id = pa.session_id
      where pa.session_id = ${data.sessionId}
        and ps.user_id = ${userId}
      order by pa.putt_number asc
    `
    return attempts
  })
