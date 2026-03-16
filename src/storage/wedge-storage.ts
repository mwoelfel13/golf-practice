import type { SessionRow, ShotRow } from '../types/wedge'

const STORAGE_KEY = 'golf:wedge_sessions'

interface StoredSession {
  session: SessionRow
  shots: ShotRow[]
}

function readAll(): StoredSession[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(data: StoredSession[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export async function saveSessionLocal({
  data,
}: {
  data: {
    minYards: number
    maxYards: number
    avgDiff: number
    stdDev: number
    shots: { target: number; actual: number; diff: number }[]
  }
}): Promise<SessionRow> {
  const session: SessionRow = {
    id: crypto.randomUUID(),
    user_id: 'guest',
    min_yards: data.minYards,
    max_yards: data.maxYards,
    avg_diff: data.avgDiff,
    std_dev: data.stdDev,
    created_at: new Date().toISOString(),
  }

  const shots: ShotRow[] = data.shots.map((s, i) => ({
    id: crypto.randomUUID(),
    session_id: session.id,
    shot_number: i + 1,
    target: s.target,
    actual: s.actual,
    diff: s.diff,
  }))

  const all = readAll()
  all.unshift({ session, shots })
  writeAll(all)

  return session
}

export async function getSessionsLocal(): Promise<SessionRow[]> {
  return readAll()
    .map((s) => s.session)
    .slice(0, 20)
}

export async function getSessionWithShotsLocal({
  data,
}: {
  data: { sessionId: string }
}): Promise<{ session: SessionRow; shots: ShotRow[] } | null> {
  const entry = readAll().find((s) => s.session.id === data.sessionId)
  return entry ? { session: entry.session, shots: entry.shots } : null
}
