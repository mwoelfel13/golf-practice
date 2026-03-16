import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

export const getGoogleAuthUrl = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { createServerSideClient } = await import('./supabase.server')
    const supabase = createServerSideClient()
    const redirectTo = `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error || !data.url) {
      throw new Error(error?.message || 'Failed to get Google auth URL')
    }

    return data.url
  },
)

export const handleAuthCallback = createServerFn({ method: 'GET' })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const { createServerSideClient } = await import('./supabase.server')
    const supabase = createServerSideClient()
    const { error } = await supabase.auth.exchangeCodeForSession(data.code)

    if (error) {
      throw new Error(error.message)
    }

    throw redirect({ href: '/' })
  })

export const fetchUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { createServerSideClient } = await import('./supabase.server')
    const supabase = createServerSideClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
      return null
    }

    return {
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name || data.user.email || '',
      picture: data.user.user_metadata?.avatar_url || '',
      id: data.user.id,
    }
  },
)

export const logoutFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { createServerSideClient } = await import('./supabase.server')
    const supabase = createServerSideClient()
    await supabase.auth.signOut()
    throw redirect({ href: '/' })
  },
)
