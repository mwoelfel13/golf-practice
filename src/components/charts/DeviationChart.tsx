import { Paper, Typography, Box } from '@mui/material'

export interface ShotResult {
  target: number
  actual: number
  diff: number
}

export function DeviationChart({
  results,
  stdDev,
}: {
  results: ShotResult[]
  stdDev: number
}) {
  const maxDiff = Math.max(...results.map((r) => r.diff), stdDev, 1)
  const chartW = 600
  const chartH = 260
  const padL = 40
  const padR = 12
  const padT = 20
  const padB = 32
  const plotW = chartW - padL - padR
  const plotH = chartH - padT - padB

  const barW = plotW / results.length
  const barGap = barW * 0.2
  const barActual = barW - barGap

  const mean = results.reduce((s, r) => s + r.diff, 0) / results.length
  const meanY = padT + plotH - (mean / maxDiff) * plotH
  const sdTopY = padT + plotH - (Math.min(mean + stdDev, maxDiff) / maxDiff) * plotH
  const sdBotY =
    padT + plotH - (Math.max(mean - stdDev, 0) / maxDiff) * plotH

  const ticks = 4
  const yLabels = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((maxDiff / ticks) * i),
  )

  return (
    <Paper elevation={2} sx={{ borderRadius: 3, p: { xs: 2, sm: 3 } }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', textAlign: 'center', mb: 2 }}
      >
        Shot Deviation
      </Typography>
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        style={{ width: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <text
          x={14}
          y={padT + plotH / 2}
          textAnchor="middle"
          fontSize={10}
          fill="#999"
          transform={`rotate(-90, 14, ${padT + plotH / 2})`}
        >
          yards offline
        </text>

        {yLabels.map((val) => {
          const y = padT + plotH - (val / maxDiff) * plotH
          return (
            <g key={val}>
              <line
                x1={padL}
                x2={padL + plotW}
                y1={y}
                y2={y}
                stroke="#ccc"
                strokeWidth={0.5}
              />
              <text
                x={padL - 4}
                y={y + 3.5}
                textAnchor="end"
                fontSize={10}
                fill="#999"
              >
                {val}
              </text>
            </g>
          )
        })}

        <rect
          x={padL}
          y={sdTopY}
          width={plotW}
          height={sdBotY - sdTopY}
          fill="#1976d2"
          opacity={0.1}
          rx={3}
        />

        <line
          x1={padL}
          x2={padL + plotW}
          y1={meanY}
          y2={meanY}
          stroke="#1976d2"
          strokeWidth={1}
          strokeDasharray="6 3"
        />
        <text
          x={padL + plotW + 2}
          y={meanY + 3.5}
          fontSize={9}
          fill="#1976d2"
        >
          avg
        </text>

        {results.map((r, i) => {
          const barH = (r.diff / maxDiff) * plotH
          const x = padL + i * barW + barGap / 2
          const y = padT + plotH - barH
          const color =
            r.diff <= 3
              ? '#2e7d32'
              : r.diff <= 8
                ? '#1976d2'
                : '#d32f2f'
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barActual}
                height={barH}
                fill={color}
                rx={3}
                opacity={0.85}
              />
              <text
                x={x + barActual / 2}
                y={padT + plotH + 14}
                textAnchor="middle"
                fontSize={10}
                fill="#999"
              >
                {i + 1}
              </text>
              <text
                x={x + barActual / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize={10}
                fill="#999"
                fontWeight={600}
              >
                {r.diff}
              </text>
            </g>
          )
        })}

        <line
          x1={padL}
          x2={padL}
          y1={padT}
          y2={padT + plotH}
          stroke="#ccc"
          strokeWidth={1}
        />
        <line
          x1={padL}
          x2={padL + plotW}
          y1={padT + plotH}
          y2={padT + plotH}
          stroke="#ccc"
          strokeWidth={1}
        />
      </svg>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 3,
          mt: 1,
          fontSize: 10,
          color: 'text.secondary',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 8, borderRadius: 0.5, bgcolor: '#1976d2', opacity: 0.2 }} />
          &plusmn;1 std dev ({stdDev.toFixed(1)} yds)
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 0, borderTop: '1px dashed #1976d2' }} />
          mean
        </Box>
      </Box>
    </Paper>
  )
}
