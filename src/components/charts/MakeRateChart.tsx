import { Paper, Typography } from '@mui/material'
import type { PuttResult } from './index'

export function MakeRateChart({ results }: { results: PuttResult[] }) {
  const buckets = [
    { label: 'All Putts', min: 5, max: 30 },
    { label: '5–8 ft', min: 5, max: 8 },
    { label: '9–12 ft', min: 9, max: 12 },
    { label: '12–20 ft', min: 12, max: 20 },
    { label: '20–30 ft', min: 20, max: 30 },
  ]

  const rows = buckets.map((b) => {
    const inBucket = results.filter(
      (r) => r.distance >= b.min && r.distance <= b.max,
    )
    const madeCount = inBucket.filter((r) => r.made).length
    const pct =
      inBucket.length > 0 ? Math.round((madeCount / inBucket.length) * 100) : 0
    return { ...b, total: inBucket.length, made: madeCount, pct }
  })

  const chartW = 500
  const chartH = 40 * rows.length + 40
  const labelW = 80
  const pctLabelW = 50
  const padT = 30
  const padR = 12
  const barAreaW = chartW - labelW - pctLabelW - padR
  const barH = 24
  const rowH = 40

  function barColor(pct: number): string {
    if (pct >= 70) return '#2e7d32'
    if (pct >= 40) return '#1976d2'
    return '#d32f2f'
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 3, p: { xs: 2, sm: 3 }, mt: 2 }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', textAlign: 'center', mb: 1 }}
      >
        Make Rate
      </Typography>
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        style={{ width: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Vertical grid lines */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const x = labelW + (tick / 100) * barAreaW
          return (
            <g key={tick}>
              <line
                x1={x}
                x2={x}
                y1={padT - 4}
                y2={padT + rows.length * rowH}
                stroke="#ccc"
                strokeWidth={0.5}
              />
              <text
                x={x}
                y={padT - 8}
                textAnchor="middle"
                fontSize={9}
                fill="#999"
              >
                {tick}%
              </text>
            </g>
          )
        })}

        {rows.map((row, i) => {
          const y = padT + i * rowH
          const barW = (row.pct / 100) * barAreaW
          return (
            <g key={row.label}>
              {/* Row label */}
              <text
                x={labelW - 8}
                y={y + rowH / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fill="#666"
                fontWeight={i === 0 ? 700 : 400}
              >
                {row.label}
              </text>
              {/* Bar background */}
              <rect
                x={labelW}
                y={y + (rowH - barH) / 2}
                width={barAreaW}
                height={barH}
                fill="#eee"
                rx={4}
              />
              {/* Bar fill */}
              {barW > 0 && (
                <rect
                  x={labelW}
                  y={y + (rowH - barH) / 2}
                  width={barW}
                  height={barH}
                  fill={barColor(row.pct)}
                  rx={4}
                  opacity={i === 0 ? 1 : 0.85}
                />
              )}
              {/* Percentage + count */}
              <text
                x={labelW + barAreaW + 6}
                y={y + rowH / 2 + 4}
                fontSize={11}
                fill="#666"
                fontWeight={600}
              >
                {row.pct}%
              </text>
              {/* Count label */}
              {row.total > 0 && (
                <text
                  x={barW > 40 ? labelW + barW - 6 : labelW + 6}
                  y={y + rowH / 2 + 4}
                  textAnchor={barW > 40 ? 'end' : 'start'}
                  fontSize={9}
                  fill={barW > 40 ? '#fff' : '#666'}
                  fontWeight={600}
                >
                  {row.made}/{row.total}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </Paper>
  )
}
