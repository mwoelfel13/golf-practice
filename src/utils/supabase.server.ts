import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { getRequest, setCookie } from '@tanstack/react-start/server'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function getAuthenticatedUserId(): Promise<string> {
  const supabase = createServerSideClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error('Not authenticated')
  }

  return data.user.id
}

export function createServerSideClient() {
  const request = getRequest()

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get('cookie') || ''
        return cookieHeader
          .split(';')
          .map((c) => {
            const [name, ...rest] = c.trim().split('=')
            return { name, value: rest.join('=') }
          })
          .filter((c) => c.name)
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          setCookie(name, value, options)
        })
      },
    },
  })
}
