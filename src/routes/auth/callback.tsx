import { createFileRoute } from '@tanstack/react-router'
import { Container, Typography, CircularProgress, Box } from '@mui/material'
import { handleAuthCallback } from '../../utils/auth'

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: (search.code as string) || '',
  }),
  loaderDeps: ({ search }) => ({ code: search.code }),
  loader: async ({ deps }) => {
    if (!deps.code) {
      throw new Error('Missing authorization code')
    }
    await handleAuthCallback({ data: { code: deps.code } })
  },
  component: CallbackPage,
  pendingComponent: () => (
    <Container maxWidth="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography>Signing you in...</Typography>
      </Box>
    </Container>
  ),
})

function CallbackPage() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography>Redirecting...</Typography>
      </Box>
    </Container>
  )
}
