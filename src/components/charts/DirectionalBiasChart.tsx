import { Paper, Typography } from '@mui/material'
import type { PuttResult } from './index'

export function DirectionalBiasChart({ results }: { results: PuttResult[] }) {
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
    const leftMisses = inBucket.filter(
      (r) => !r.made && r.directionMiss === 'too much left',
    ).length
    const rightMisses = inBucket.filter(
      (r) => !r.made && r.directionMiss === 'too much right',
    ).length
    const total = inBucket.length
    // Positive = right bias, negative = left bias
    const bias =
      total > 0
        ? Math.round(((rightMisses - leftMisses) / total) * 100)
        : 0
    return { ...b, total, leftMisses, rightMisses, bias }
  })

  const maxBias = Math.max(...rows.map((r) => Math.abs(r.bias)), 20)
  // Round up to nearest nice tick value
  const tickStep = maxBias <= 20 ? 10 : maxBias <= 50 ? 25 : 50
  const axisMax = Math.ceil(maxBias / tickStep) * tickStep

  const chartW = 500
  const chartH = 40 * rows.length + 40
  const labelW = 80
  const padT = 30
  const padR = 12
  const barAreaW = chartW - labelW - padR
  const barH = 24
  const rowH = 40
  const centerX = labelW + barAreaW / 2

  return (
    <Paper elevation={2} sx={{ borderRadius: 3, p: { xs: 2, sm: 3 }, mt: 2 }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', textAlign: 'center', mb: 1 }}
      >
        Directional Bias
      </Typography>
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        style={{ width: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Tick marks and labels */}
        {Array.from(
          { length: Math.floor(axisMax / tickStep) * 2 + 1 },
          (_, i) => (i - Math.floor(axisMax / tickStep)) * tickStep,
        ).map((tick) => {
          const x = centerX + (tick / axisMax) * (barAreaW / 2)
          return (
            <g key={tick}>
              <line
                x1={x}
                x2={x}
                y1={padT - 4}
                y2={padT + rows.length * rowH}
                stroke={tick === 0 ? '#999' : '#ccc'}
                strokeWidth={tick === 0 ? 1 : 0.5}
              />
              <text
                x={x}
                y={padT - 8}
                textAnchor="middle"
                fontSize={9}
                fill="#999"
              >
                {tick === 0 ? '0' : `${tick > 0 ? '+' : ''}${tick}%`}
              </text>
            </g>
          )
        })}

        {rows.map((row, i) => {
          const y = padT + i * rowH
          const halfBar = barAreaW / 2
          const barW = (Math.abs(row.bias) / axisMax) * halfBar
          const barX = row.bias >= 0 ? centerX : centerX - barW
          const color = '#64b5f6'

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
                fill="#f5f5f5"
                rx={4}
              />
              {/* Bias bar */}
              {barW > 0 && (
                <rect
                  x={barX}
                  y={y + (rowH - barH) / 2}
                  width={barW}
                  height={barH}
                  fill={color}
                  rx={4}
                  opacity={0.8}
                />
              )}
              {/* Miss counts inside/beside bar */}
              {row.total > 0 && (
                <text
                  x={
                    barW > 30
                      ? row.bias >= 0
                        ? barX + barW - 6
                        : barX + 6
                      : row.bias >= 0
                        ? centerX + 6
                        : centerX - 6
                  }
                  y={y + rowH / 2 + 4}
                  textAnchor={
                    barW > 30
                      ? row.bias >= 0
                        ? 'end'
                        : 'start'
                      : row.bias >= 0
                        ? 'start'
                        : 'end'
                  }
                  fontSize={9}
                  fill="#333"
                  fontWeight={600}
                >
                  {Math.abs(row.bias)}%
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </Paper>
  )
}
