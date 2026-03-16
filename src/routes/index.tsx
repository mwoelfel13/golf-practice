import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Container,
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 8,
          gap: 3,
        }}
      >
        <Typography variant="overline" sx={{ fontSize: '0.75rem', letterSpacing: 3 }}>
          Golf Practice
        </Typography>

        <Card sx={{ width: '100%' }}>
          <CardActionArea component={Link} to="/wedge-practice">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Wedge Practice
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set a distance range and hit to random targets. Track how close
                each shot lands.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, color: 'primary.main' }}>
                <Typography variant="body2" fontWeight={600}>
                  Start
                </Typography>
                <ArrowForwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>

        <Card sx={{ width: '100%' }}>
          <CardActionArea component={Link} to="/stack-putting">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stack Putting
              </Typography>
              <Typography variant="body2" color="text.secondary">
                18 random putts from 5–30 feet. Track makes, misses, and
                diagnose what went wrong.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, color: 'primary.main' }}>
                <Typography variant="body2" fontWeight={600}>
                  Start
                </Typography>
                <ArrowForwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Container>
  )
}
