import { createFileRoute } from '@tanstack/react-router'
import { logoutFn } from '../utils/auth'

export const Route = createFileRoute('/logout')({
  preload: false,
  loader: () => logoutFn(),
})
