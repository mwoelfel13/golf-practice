import type {
  PuttingSessionRow,
  PuttingAttemptRow,
  PuttingAttemptInput,
} from '../db/putting-sessions'

const STORAGE_KEY = 'golf:putting_sessions'

interface StoredSession {
  session: PuttingSessionRow
  attempts: PuttingAttemptRow[]
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

export async function savePuttingSessionLocal({
  data,
}: {
  data: {
    totalPutts: number
    puttsMade: number
    makePct: number
    threePuttCount: number
    attempts: PuttingAttemptInput[]
  }
}): Promise<PuttingSessionRow> {
  const session: PuttingSessionRow = {
    id: crypto.randomUUID(),
    user_id: 'guest',
    total_putts: data.totalPutts,
    putts_made: data.puttsMade,
    make_pct: data.makePct,
    three_putt_count: data.threePuttCount,
    created_at: new Date().toISOString(),
  }

  const attempts: PuttingAttemptRow[] = data.attempts.map((a, i) => ({
    id: crypto.randomUUID(),
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
  }))

  const all = readAll()
  all.unshift({ session, attempts })
  writeAll(all)

  return session
}

export async function getPuttingSessionsLocal(): Promise<PuttingSessionRow[]> {
  return readAll()
    .map((s) => s.session)
    .slice(0, 20)
}

export async function getPuttingSessionAttemptsLocal({
  data,
}: {
  data: { sessionId: string }
}): Promise<PuttingAttemptRow[]> {
  const entry = readAll().find((s) => s.session.id === data.sessionId)
  return entry ? entry.attempts : []
}
