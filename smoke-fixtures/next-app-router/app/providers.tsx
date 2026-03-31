'use client'

import { AuthProvider } from '@ouim/logto-authkit'
import { useRouter } from 'next/navigation'
import type { AuthProviderProps } from '@ouim/logto-authkit'

const logtoConfig: AuthProviderProps['config'] = {
  endpoint: 'https://example.logto.app',
  appId: 'next-app-router-smoke-app',
  resources: ['https://api.example.com'],
}

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <AuthProvider
      config={logtoConfig}
      callbackUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/callback`}
      customNavigate={url => router.push(url)}
    >
      {children}
    </AuthProvider>
  )
}
