import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState, createContext, useContext } from 'react'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
  Box,
  Typography,
  Button,
  Container,
  Avatar,
} from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import LogoutIcon from '@mui/icons-material/Logout'
import { fetchUser } from '../utils/auth'

import appCss from '../styles.css?url'

const ColorModeContext = createContext({ toggleColorMode: () => {} })

export function useColorMode() {
  return useContext(ColorModeContext)
}

export const Route = createRootRoute({
  beforeLoad: async () => {
    const user = await fetchUser()
    return { user }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Golf Practice' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h3" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        The page you're looking for doesn't exist.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Go Home
      </Button>
    </Container>
  )
}

function RootComponent() {
  const { user } = Route.useRouteContext()

  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') setMode('dark')
  }, [])

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light'
          localStorage.setItem('theme', next)
          return next
        })
      },
    }),
    [],
  )

  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode])

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            position: 'fixed',
            right: 16,
            top: 16,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {user ? (
            <>
              <Avatar
                src={user.picture}
                alt={user.name}
                sx={{ width: 32, height: 32 }}
              />
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.name}
              </Typography>
              <IconButton component={Link} to="/logout" color="inherit" size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <Button component={Link} to="/login" variant="text" size="small">
              Sign In
            </Button>
          )}
          <IconButton onClick={colorMode.toggleColorMode} color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
        <Outlet />
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
