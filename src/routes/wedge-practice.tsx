import { Link, createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  LinearProgress,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  saveSession,
  getSessions,
  getSessionWithShots,
  type SessionRow,
  type ShotRow,
} from '../db/wedge-sessions'
import {
  saveSessionLocal,
  getSessionsLocal,
  getSessionWithShotsLocal,
} from '../storage/wedge-storage'
import { DeviationChart, type ShotResult } from '../components/charts'

export const Route = createFileRoute('/wedge-practice')({
  component: WedgePractice,
})

function WedgePractice() {
  const { user } = Route.useRouteContext()
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [targets, setTargets] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shotInput, setShotInput] = useState('')
  const [results, setResults] = useState<ShotResult[]>([])
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pastSessions, setPastSessions] = useState<SessionRow[]>([])
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null)
  const [viewingShots, setViewingShots] = useState<ShotResult[]>([])
  const [viewingSession, setViewingSession] = useState<SessionRow | null>(null)
  const [loadingSession, setLoadingSession] = useState(false)
  const shotInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = user ? getSessions : getSessionsLocal
    load().then(setPastSessions).catch(console.error)
  }, [user])

  function openPastSession(sessionId: string) {
    if (viewingSessionId === sessionId) {
      setViewingSessionId(null)
      setViewingShots([])
      setViewingSession(null)
      return
    }
    setLoadingSession(true)
    setViewingSessionId(sessionId)
    const loadDetail = user ? getSessionWithShots : getSessionWithShotsLocal
    loadDetail({ data: { sessionId } })
      .then((result) => {
        if (result) {
          setViewingSession(result.session)
          setViewingShots(
            result.shots.map((s: ShotRow) => ({
              target: s.target,
              actual: s.actual,
              diff: s.diff,
            })),
          )
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSession(false))
  }

  function startSession() {
    const minVal = parseInt(min, 10)
    const maxVal = parseInt(max, 10)
    if (isNaN(minVal) || isNaN(maxVal) || minVal >= maxVal) return

    const generated = Array.from({ length: 10 }, () =>
      Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal,
    )
    setTargets(generated)
    setCurrentIndex(0)
    setResults([])
    setShotInput('')
    setSessionActive(true)
    setSessionComplete(false)
  }

  function submitShot() {
    const actual = parseInt(shotInput, 10)
    if (isNaN(actual)) return

    const target = targets[currentIndex]
    const diff = Math.abs(actual - target)
    const newResults = [...results, { target, actual, diff }]
    setResults(newResults)
    setShotInput('')

    if (currentIndex + 1 >= targets.length) {
      setSessionActive(false)
      setSessionComplete(true)

      const allResults = newResults
      const mean =
        allResults.reduce((s, r) => s + r.diff, 0) / allResults.length
      const variance =
        allResults.reduce((s, r) => s + (r.diff - mean) ** 2, 0) /
        allResults.length
      const sd = Math.sqrt(variance)

      setSaving(true)
      const save = user ? saveSession : saveSessionLocal
      const loadAll = user ? getSessions : getSessionsLocal
      save({
        data: {
          minYards: parseInt(min, 10),
          maxYards: parseInt(max, 10),
          avgDiff: parseFloat(mean.toFixed(1)),
          stdDev: parseFloat(sd.toFixed(1)),
          shots: allResults,
        },
      })
        .then(() => loadAll())
        .then(setPastSessions)
        .catch(console.error)
        .finally(() => setSaving(false))
    } else {
      setCurrentIndex(currentIndex + 1)
      setTimeout(() => shotInputRef.current?.focus(), 0)
    }
  }

  function resetSession() {
    setMin('')
    setMax('')
    setTargets([])
    setCurrentIndex(0)
    setShotInput('')
    setResults([])
    setSessionActive(false)
    setSessionComplete(false)
  }

  const avgDiff =
    results.length > 0
      ? (results.reduce((sum, r) => sum + r.diff, 0) / results.length).toFixed(1)
      : null

  const stdDev =
    results.length > 0
      ? (() => {
          const mean =
            results.reduce((sum, r) => sum + r.diff, 0) / results.length
          const variance =
            results.reduce((sum, r) => sum + (r.diff - mean) ** 2, 0) /
            results.length
          return Math.sqrt(variance)
        })()
      : 0

  function diffColor(diff: number): string {
    if (diff <= 3) return 'success.main'
    if (diff <= 8) return 'primary.main'
    return 'error.main'
  }

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
        <Typography variant="overline">Short Game</Typography>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Wedge Practice
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
          Set a distance range, then dial in your wedges by hitting to random
          targets. Track how close each shot lands.
        </Typography>

        {/* Setup form */}
        {!sessionActive && !sessionComplete && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2 }}>
            <TextField
              label="Min (yards)"
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder="e.g. 40"
              size="small"
              sx={{ width: 120 }}
            />
            <TextField
              label="Max (yards)"
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="e.g. 120"
              size="small"
              sx={{ width: 120 }}
            />
            <Button
              variant="contained"
              onClick={startSession}
              disabled={!min || !max || parseInt(min, 10) >= parseInt(max, 10)}
            >
              Start Session
            </Button>
          </Box>
        )}

        {/* Active session */}
        {sessionActive && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Shot {currentIndex + 1} of {targets.length}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(currentIndex / targets.length) * 100}
                sx={{ flex: 1, borderRadius: 1 }}
              />
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="overline">Hit it to</Typography>
              <Typography variant="h1" color="primary" fontWeight={700}>
                {targets[currentIndex]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                yards
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <TextField
                type="number"
                value={shotInput}
                onChange={(e) => setShotInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitShot()}
                placeholder="Your distance"
                autoFocus
                size="small"
                sx={{ width: 150 }}
                inputRef={shotInputRef}
                inputProps={{ inputMode: 'numeric', style: { textAlign: 'center', fontWeight: 600 } }}
              />
              <Button
                variant="contained"
                onClick={submitShot}
                disabled={!shotInput}
              >
                Submit
              </Button>
            </Box>

            {/* Live results */}
            {results.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                {results.map((r, i) => (
                  <Paper
                    key={i}
                    variant="outlined"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Shot {i + 1}
                    </Typography>
                    <Typography variant="body2">
                      Target: {r.target} | Hit: {r.actual}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color={diffColor(r.diff)}>
                      {r.diff === 0 ? 'Perfect!' : `${r.diff} yds off`}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Session complete — summary */}
        {sessionComplete && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="overline">Session Complete</Typography>
            <Typography variant="h3" fontWeight={700}>
              Avg. {avgDiff} yds off
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Std Dev: {stdDev.toFixed(1)} yds
            </Typography>
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
                    ...(viewingSessionId === s.id && {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    }),
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
                  <Typography variant="body2">
                    {s.min_yards}–{s.max_yards} yds
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    Avg {s.avg_diff} yds off
                  </Typography>
                </Paper>

                {viewingSessionId === s.id && (
                  <Box sx={{ mt: 1 }}>
                    {loadingSession ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Loading...
                      </Typography>
                    ) : viewingShots.length > 0 && viewingSession ? (
                      <>
                        <Paper elevation={1} sx={{ borderRadius: 3, p: 3, mb: 1, textAlign: 'center' }}>
                          <Typography variant="overline" color="text.secondary">
                            {new Date(viewingSession.created_at).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                          <Typography variant="h4" fontWeight={700}>
                            Avg. {viewingSession.avg_diff} yds off
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Std Dev: {viewingSession.std_dev} yds &middot; {viewingSession.min_yards}–{viewingSession.max_yards} yd range
                          </Typography>
                        </Paper>

                        <DeviationChart
                          results={viewingShots}
                          stdDev={Number(viewingSession.std_dev)}
                        />

                        <Paper elevation={1} sx={{ borderRadius: 3, p: 2, mt: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {viewingShots.map((r, i) => (
                              <Paper
                                key={i}
                                variant="outlined"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  px: 2,
                                  py: 1,
                                  borderRadius: 2,
                                }}
                              >
                                <Typography variant="body2" color="text.secondary">
                                  #{i + 1}
                                </Typography>
                                <Typography variant="body2">
                                  Target: {r.target} | Hit: {r.actual}
                                </Typography>
                                <Typography variant="body2" fontWeight={600} color={diffColor(r.diff)}>
                                  {r.diff === 0 ? 'Perfect!' : `${r.diff} yds off`}
                                </Typography>
                              </Paper>
                            ))}
                          </Box>
                        </Paper>
                      </>
                    ) : null}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Deviation chart */}
      {sessionComplete && (
        <Box sx={{ mt: 3 }}>
          <DeviationChart results={results} stdDev={stdDev} />
        </Box>
      )}

      {/* Shot list & new session */}
      {sessionComplete && (
        <Paper elevation={2} sx={{ mt: 3, borderRadius: 4, p: { xs: 3, sm: 5 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {results.map((r, i) => (
              <Paper
                key={i}
                variant="outlined"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Shot {i + 1}
                </Typography>
                <Typography variant="body2">
                  Target: {r.target} | Hit: {r.actual}
                </Typography>
                <Typography variant="body2" fontWeight={600} color={diffColor(r.diff)}>
                  {r.diff === 0 ? 'Perfect!' : `${r.diff} yds off`}
                </Typography>
              </Paper>
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
                    ...(viewingSessionId === s.id && {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    }),
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
                  <Typography variant="body2">
                    {s.min_yards}–{s.max_yards} yds
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    Avg {s.avg_diff} yds off
                  </Typography>
                </Paper>

                {viewingSessionId === s.id && (
                  <Box sx={{ mt: 1 }}>
                    {loadingSession ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Loading...
                      </Typography>
                    ) : viewingShots.length > 0 && viewingSession ? (
                      <>
                        <Paper elevation={1} sx={{ borderRadius: 3, p: 3, mb: 1, textAlign: 'center' }}>
                          <Typography variant="overline" color="text.secondary">
                            {new Date(viewingSession.created_at).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                          <Typography variant="h4" fontWeight={700}>
                            Avg. {viewingSession.avg_diff} yds off
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Std Dev: {viewingSession.std_dev} yds &middot; {viewingSession.min_yards}–{viewingSession.max_yards} yd range
                          </Typography>
                        </Paper>

                        <DeviationChart
                          results={viewingShots}
                          stdDev={Number(viewingSession.std_dev)}
                        />

                        <Paper elevation={1} sx={{ borderRadius: 3, p: 2, mt: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {viewingShots.map((r, i) => (
                              <Paper
                                key={i}
                                variant="outlined"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  px: 2,
                                  py: 1,
                                  borderRadius: 2,
                                }}
                              >
                                <Typography variant="body2" color="text.secondary">
                                  #{i + 1}
                                </Typography>
                                <Typography variant="body2">
                                  Target: {r.target} | Hit: {r.actual}
                                </Typography>
                                <Typography variant="body2" fontWeight={600} color={diffColor(r.diff)}>
                                  {r.diff === 0 ? 'Perfect!' : `${r.diff} yds off`}
                                </Typography>
                              </Paper>
                            ))}
                          </Box>
                        </Paper>
                      </>
                    ) : null}
                  </Box>
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
