import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Container, Box, Typography, Button, Paper } from '@mui/material'
import { getGoogleAuthUrl } from '../utils/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [loading, setLoading] = useState(false)
  const getAuthUrl = useServerFn(getGoogleAuthUrl)

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const url = await getAuthUrl()
      window.location.href = url
    } catch (error) {
      console.error('Failed to get auth URL:', error)
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center', width: '100%', maxWidth: 400 }}>
          <Typography variant="overline" sx={{ letterSpacing: 3 }}>
            Golf Practice
          </Typography>
          <Typography variant="h5" sx={{ mt: 2, mb: 3 }}>
            Sign In
          </Typography>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{ textTransform: 'none', py: 1.5 }}
          >
            {loading ? 'Redirecting...' : 'Sign in with Google'}
          </Button>
        </Paper>
      </Box>
    </Container>
  )
}
