import { Link, createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton as MuiToggleButton,
  Switch,
  FormControlLabel,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  savePuttingSession,
  getPuttingSessions,
  getPuttingSessionAttempts,
  type PuttingSessionRow,
  type PuttingAttemptRow,
} from '../db/putting-sessions'
import {
  savePuttingSessionLocal,
  getPuttingSessionsLocal,
  getPuttingSessionAttemptsLocal,
} from '../storage/putting-storage'
import { MakeRateChart, DirectionalBiasChart, SpeedBiasChart } from '../components/charts'

export const Route = createFileRoute('/stack-putting')({
  component: StackPutting,
})

const SLOPES = ['uphill', 'downhill', 'flat'] as const
const BREAKS = ['left to right', 'right to left', 'straight'] as const

interface Putt {
  distance: number
  slope: (typeof SLOPES)[number]
  breakDir: (typeof BREAKS)[number]
}

interface PuttResult extends Putt {
  made: boolean
  speedMiss: string | null
  directionMiss: string | null
  misread: boolean
  comebackMade: boolean | null
}

function generatePutts(): Putt[] {
  return Array.from({ length: 18 }, () => ({
    distance: Math.floor(Math.random() * 26) + 5,
    slope: SLOPES[Math.floor(Math.random() * SLOPES.length)],
    breakDir: BREAKS[Math.floor(Math.random() * BREAKS.length)],
  }))
}

function shortMissLabel(speed: string | null, direction: string | null): string {
  const s =
    speed === 'too fast' ? 'fast' : speed === 'too slow' ? 'slow' : ''
  const d =
    direction === 'too much left'
      ? 'left'
      : direction === 'too much right'
        ? 'right'
        : ''
  return [s, d].filter(Boolean).join(' and ') || 'good speed, good line'
}

function describePutt(putt: Putt): string {
  const parts = [`${putt.distance} foot`]
  if (putt.slope !== 'flat') parts.push(putt.slope)
  if (putt.breakDir !== 'straight') parts.push(putt.breakDir)
  if (putt.slope === 'flat' && putt.breakDir === 'straight') parts.push('flat, straight')
  return parts.join(', ')
}

function StackPutting() {
  const { user } = Route.useRouteContext()
  const [putts, setPutts] = useState<Putt[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<PuttResult[]>([])
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pastSessions, setPastSessions] = useState<PuttingSessionRow[]>([])

  const [made, setMade] = useState<boolean | null>(null)
  const [speedMiss, setSpeedMiss] = useState<string | null>(null)
  const [directionMiss, setDirectionMiss] = useState<string | null>(null)
  const [misread, setMisread] = useState(false)
  const [comebackMade, setComebackMade] = useState<boolean | null>(null)

  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null)
  const [viewingResults, setViewingResults] = useState<PuttResult[]>([])
  const [loadingSession, setLoadingSession] = useState(false)

  useEffect(() => {
    const load = user ? getPuttingSessions : getPuttingSessionsLocal
    load().then(setPastSessions).catch(console.error)
  }, [user])

  function openPastSession(sessionId: string) {
    if (viewingSessionId === sessionId) {
      setViewingSessionId(null)
      setViewingResults([])
      return
    }
    setLoadingSession(true)
    setViewingSessionId(sessionId)
    const loadAttempts = user ? getPuttingSessionAttempts : getPuttingSessionAttemptsLocal
    loadAttempts({ data: { sessionId } })
      .then((attempts: PuttingAttemptRow[]) => {
        setViewingResults(
          attempts.map((a) => ({
            distance: a.distance,
            slope: a.slope as Putt['slope'],
            breakDir: a.break_dir as Putt['breakDir'],
            made: a.made,
            speedMiss: a.speed_miss,
            directionMiss: a.direction_miss,
            misread: a.misread,
            comebackMade: a.comeback_made,
          })),
        )
      })
      .catch(console.error)
      .finally(() => setLoadingSession(false))
  }

  function startSession() {
    setPutts(generatePutts())
    setCurrentIndex(0)
    setResults([])
    setSessionActive(true)
    setSessionComplete(false)
    resetPuttInputs()
  }

  function resetPuttInputs() {
    setMade(null)
    setSpeedMiss(null)
    setDirectionMiss(null)
    setMisread(false)
    setComebackMade(null)
  }

  function canSubmit(): boolean {
    if (made === null) return false
    if (!made) {
      if (speedMiss === null || directionMiss === null) return false
      if (comebackMade === null) return false
    }
    return true
  }

  function submitPutt() {
    if (!canSubmit()) return

    const putt = putts[currentIndex]
    const result: PuttResult = {
      ...putt,
      made: made!,
      speedMiss: made ? null : speedMiss,
      directionMiss: made ? null : directionMiss,
      misread,
      comebackMade: made ? null : comebackMade,
    }

    const newResults = [...results, result]
    setResults(newResults)
    resetPuttInputs()

    if (currentIndex + 1 >= putts.length) {
      setSessionActive(false)
      setSessionComplete(true)

      const puttsMade = newResults.filter((r) => r.made).length
      const makePct = parseFloat(((puttsMade / newResults.length) * 100).toFixed(1))
      const threePuttCount = newResults.filter(
        (r) => !r.made && r.comebackMade === false,
      ).length

      setSaving(true)
      const save = user ? savePuttingSession : savePuttingSessionLocal
      const loadAll = user ? getPuttingSessions : getPuttingSessionsLocal
      save({
        data: {
          totalPutts: newResults.length,
          puttsMade,
          makePct,
          threePuttCount,
          attempts: newResults.map((r) => ({
            distance: r.distance,
            slope: r.slope,
            breakDir: r.breakDir,
            made: r.made,
            speedMiss: r.speedMiss,
            directionMiss: r.directionMiss,
            misread: r.misread,
            comebackMade: r.comebackMade,
          })),
        },
      })
        .then(() => loadAll())
        .then(setPastSessions)
        .catch(console.error)
        .finally(() => setSaving(false))
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  function resetSession() {
    setPutts([])
    setCurrentIndex(0)
    setResults([])
    setSessionActive(false)
    setSessionComplete(false)
    resetPuttInputs()
  }

  const puttsMadeCount = results.filter((r) => r.made).length
  const makePct =
    results.length > 0
      ? ((puttsMadeCount / results.length) * 100).toFixed(1)
      : '0'
  const threePuttCount = results.filter(
    (r) => !r.made && r.comebackMade === false,
  ).length

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        component={Link}
        to="/"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
      >
        Home
      </Button>

      <Paper elevation={3} sx={{ borderRadius: 4, p: { xs: 3, sm: 5 } }}>
        <Typography variant="overline">Putting</Typography>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Stack Putting
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
          18 random putts between 5 and 30 feet. Track makes, misses, and what
          went wrong to find patterns in your putting.
        </Typography>

        {/* Start button */}
        {!sessionActive && !sessionComplete && (
          <Button variant="contained" onClick={startSession}>
            Start Session
          </Button>
        )}

        {/* Active session */}
        {sessionActive && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Progress */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Putt {currentIndex + 1} of {putts.length}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(currentIndex / putts.length) * 100}
                sx={{ flex: 1, borderRadius: 1 }}
              />
            </Box>

            {/* Putt description */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="overline">Putt it</Typography>
              <Typography variant="h2" color="primary" fontWeight={700}>
                {putts[currentIndex].distance} ft
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {describePutt(putts[currentIndex])}
              </Typography>
            </Box>

            {/* Misread toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={misread}
                    onChange={(e) => setMisread(e.target.checked)}
                    size="small"
                  />
                }
                label="Misread"
              />
            </Box>

            {/* 3x3 Result Grid */}
            <Box sx={{ maxWidth: 360, mx: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="overline" sx={{ mb: 1, display: 'block', textAlign: 'center' }}>
                  What happened?
                </Typography>
                <ResultGrid
                  made={made}
                  speedMiss={speedMiss}
                  directionMiss={directionMiss}
                  onMade={() => {
                    setMade(true)
                    setSpeedMiss(null)
                    setDirectionMiss(null)
                  }}
                  onMiss={(speed, direction) => {
                    setMade(false)
                    setSpeedMiss(speed)
                    setDirectionMiss(direction)
                  }}
                />
              </Box>

              {/* Comeback — only when missed */}
              {made === false && (
                <>
                  <Box>
                    <Typography variant="overline" sx={{ mb: 1, display: 'block' }}>
                      Comeback putt?
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      value={comebackMade === null ? null : comebackMade ? 'made' : 'missed'}
                      onChange={(_, val) => {
                        if (val === 'made') setComebackMade(true)
                        else if (val === 'missed') setComebackMade(false)
                      }}
                    >
                      <MuiToggleButton value="made" color="success">
                        Made
                      </MuiToggleButton>
                      <MuiToggleButton value="missed" color="error">
                        Missed
                      </MuiToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </>
              )}

              {/* Submit */}
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                <Button
                  variant="contained"
                  onClick={submitPutt}
                  disabled={!canSubmit()}
                  size="large"
                >
                  {currentIndex + 1 < putts.length ? 'Next Putt' : 'Finish'}
                </Button>
              </Box>
            </Box>

            {/* Live results */}
            {results.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                {results.map((r, i) => (
                  <PuttResultRow key={i} result={r} index={i} />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Session complete — summary */}
        {sessionComplete && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'center' }}>
            <Box>
              <Typography variant="overline">Session Complete</Typography>
              <Typography variant="h3" fontWeight={700}>
                {puttsMadeCount} / {results.length} made
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                {makePct}% make rate
              </Typography>
              {threePuttCount > 0 && (
                <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                  {threePuttCount} three-putt{threePuttCount !== 1 ? 's' : ''} ({((threePuttCount / results.length) * 100).toFixed(1)}%)
                </Typography>
              )}
            </Box>

            <MakeRateChart results={results} />
            <DirectionalBiasChart results={results} />
            <SpeedBiasChart results={results} />
          </Box>
        )}
      </Paper>

      {/* Recent sessions — shown on setup screen */}
      {!sessionActive && !sessionComplete && pastSessions.length > 0 && (
        <Paper elevation={2} sx={{ mt: 3, borderRadius: 4, p: { xs: 3, sm: 5 } }}>
          <Typography variant="overline">Recent Sessions</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            {pastSessions.slice(0, 5).map((s) => (
              <Box key={s.id}>
                <Paper
                  variant="outlined"
                  onClick={() => openPastSession(s.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    ...(viewingSessionId === s.id
                      ? { borderColor: 'primary.main', borderWidth: 2 }
                      : {}),
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {new Date(s.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {s.putts_made}/{s.total_putts} ({s.make_pct}%)
                  </Typography>
                  {s.three_putt_count > 0 && (
                    <Typography variant="body2" color="error">
                      {s.three_putt_count} 3-putt{s.three_putt_count !== 1 ? 's' : ''}
                    </Typography>
                  )}
                </Paper>

                {viewingSessionId === s.id && !loadingSession && viewingResults.length > 0 && (
                  <PastSessionDetail results={viewingResults} session={s} />
                )}
                {viewingSessionId === s.id && loadingSession && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Loading...
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Full results list */}
      {sessionComplete && (
        <Paper elevation={2} sx={{ mt: 3, borderRadius: 4, p: { xs: 3, sm: 5 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {results.map((r, i) => (
              <PuttResultRow key={i} result={r} index={i} expanded />
            ))}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button variant="outlined" onClick={resetSession}>
              New Session
            </Button>
          </Box>
        </Paper>
      )}

      {/* Session history */}
      {pastSessions.length > 0 && (
        <Paper elevation={2} sx={{ mt: 3, borderRadius: 4, p: { xs: 3, sm: 5 } }}>
          <Typography variant="overline">History</Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
            Past Sessions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {pastSessions.map((s) => (
              <Box key={s.id}>
                <Paper
                  variant="outlined"
                  onClick={() => openPastSession(s.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    ...(viewingSessionId === s.id
                      ? { borderColor: 'primary.main', borderWidth: 2 }
                      : {}),
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {new Date(s.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {s.putts_made}/{s.total_putts} ({s.make_pct}%)
                  </Typography>
                  {s.three_putt_count > 0 && (
                    <Typography variant="body2" color="error">
                      {s.three_putt_count} 3-putt{s.three_putt_count !== 1 ? 's' : ''}
                    </Typography>
                  )}
                </Paper>

                {/* Expanded past session results */}
                {viewingSessionId === s.id && !loadingSession && viewingResults.length > 0 && (
                  <PastSessionDetail results={viewingResults} session={s} />
                )}
                {viewingSessionId === s.id && loadingSession && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Loading...
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {saving && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Saving session...
        </Typography>
      )}
    </Container>
  )
}

/* ── 3x3 Result Grid ───────────────────────────────────────────── */

const GRID_CELLS: { speed: string; direction: string; label: string }[] = [
  { speed: 'too fast', direction: 'too much left', label: 'Fast\nLeft' },
  { speed: 'too fast', direction: 'good line', label: 'Fast' },
  { speed: 'too fast', direction: 'too much right', label: 'Fast\nRight' },
  { speed: 'good speed', direction: 'too much left', label: 'Left' },
  { speed: '', direction: '', label: 'Made!' },
  { speed: 'good speed', direction: 'too much right', label: 'Right' },
  { speed: 'too slow', direction: 'too much left', label: 'Slow\nLeft' },
  { speed: 'too slow', direction: 'good line', label: 'Slow' },
  { speed: 'too slow', direction: 'too much right', label: 'Slow\nRight' },
]

function ResultGrid({
  made,
  speedMiss,
  directionMiss,
  onMade,
  onMiss,
}: {
  made: boolean | null
  speedMiss: string | null
  directionMiss: string | null
  onMade: () => void
  onMiss: (speed: string, direction: string) => void
}) {
  function isSelected(cell: (typeof GRID_CELLS)[number]): boolean {
    if (cell.label === 'Made!') return made === true
    return (
      made === false &&
      speedMiss === cell.speed &&
      directionMiss === cell.direction
    )
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
      }}
    >
      {GRID_CELLS.map((cell, i) => {
        const selected = isSelected(cell)
        const isMadeCell = cell.label === 'Made!'
        return (
          <Button
            key={i}
            variant={selected ? 'contained' : 'outlined'}
            color={
              selected
                ? isMadeCell
                  ? 'success'
                  : 'error'
                : 'inherit'
            }
            onClick={() => {
              if (isMadeCell) onMade()
              else onMiss(cell.speed, cell.direction)
            }}
            sx={{
              aspectRatio: '1',
              minHeight: 72,
              whiteSpace: 'pre-line',
              lineHeight: 1.3,
              fontSize: '0.8rem',
              fontWeight: selected ? 700 : 500,
              textTransform: 'none',
              ...(isMadeCell && !selected
                ? {
                    borderColor: 'success.main',
                    color: 'success.main',
                    borderWidth: 2,
                  }
                : {}),
            }}
          >
            {cell.label}
          </Button>
        )
      })}
    </Box>
  )
}

/* ── Putt Result Row ───────────────────────────────────────────── */

function PuttResultRow({
  result,
  index,
  expanded,
}: {
  result: PuttResult
  index: number
  expanded?: boolean
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        px: 2,
        py: 1.5,
        borderRadius: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        #{index + 1}
      </Typography>
      <Typography variant="body2">{describePutt(result)}</Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        color={result.made ? 'success.main' : 'error.main'}
      >
        {result.made ? 'Made' : 'Missed'}
      </Typography>
      {expanded && !result.made && (
        <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
          {shortMissLabel(result.speedMiss, result.directionMiss)}
          {result.misread ? ' · misread' : ''}
          {result.comebackMade !== null &&
            ` · comeback ${result.comebackMade ? 'made' : 'missed'}`}
        </Typography>
      )}
    </Paper>
  )
}

/* ── Past Session Detail ──────────────────────────────────────── */

function PastSessionDetail({
  results,
  session,
}: {
  results: PuttResult[]
  session: PuttingSessionRow
}) {
  const puttsMadeCount = results.filter((r) => r.made).length
  const makePct = ((puttsMadeCount / results.length) * 100).toFixed(1)
  const threePuttCount = results.filter(
    (r) => !r.made && r.comebackMade === false,
  ).length

  return (
    <Box sx={{ mt: 1, mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper elevation={1} sx={{ borderRadius: 3, p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Typography variant="overline">
          {new Date(session.created_at).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          {puttsMadeCount} / {results.length} made
        </Typography>
        <Typography variant="body1" color="primary" sx={{ mt: 0.5 }}>
          {makePct}% make rate
        </Typography>
        {threePuttCount > 0 && (
          <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
            {threePuttCount} three-putt{threePuttCount !== 1 ? 's' : ''} ({((threePuttCount / results.length) * 100).toFixed(1)}%)
          </Typography>
        )}
      </Paper>

      <MakeRateChart results={results} />
      <DirectionalBiasChart results={results} />
      <SpeedBiasChart results={results} />

      <Paper elevation={1} sx={{ borderRadius: 3, p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {results.map((r, i) => (
            <PuttResultRow key={i} result={r} index={i} expanded />
          ))}
        </Box>
      </Paper>
    </Box>
  )
}
