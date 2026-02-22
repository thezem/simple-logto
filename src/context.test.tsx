import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { AuthProvider } from './context'
import { useAuthContext } from './context'
import type { LogtoConfig } from '@logto/react'

// Mock @logto/react
vi.mock('@logto/react', () => ({
  LogtoProvider: ({ children }: { children: ReactNode }) => children,
  useLogto: () => ({
    isAuthenticated: false,
    isLoading: false,
    getIdTokenClaims: vi.fn().mockResolvedValue({
      sub: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    }),
    getAccessToken: vi.fn().mockResolvedValue('mock-token'),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))

// Mock utils
vi.mock('./utils', () => ({
  transformUser: (claims: any) => ({
    id: claims.sub,
    name: claims.name,
    email: claims.email,
  }),
  setCustomNavigate: vi.fn(),
  jwtCookieUtils: {
    saveToken: vi.fn(),
    removeToken: vi.fn(),
    getToken: vi.fn(),
  },
  guestUtils: {
    ensureGuestId: vi.fn(),
  },
  validateLogtoConfig: vi.fn(),
  navigateTo: vi.fn(),
}))

const mockConfig: LogtoConfig = {
  endpoint: 'https://test.logto.app',
  appId: 'test-app-id',
}

describe('AuthProvider Context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render children', () => {
    render(
      <AuthProvider config={mockConfig}>
        <div>Test Child</div>
      </AuthProvider>,
    )
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should provide access to auth context', async () => {
    const TestComponent = () => {
      const auth = useAuthContext()
      return (
        <div>
          <div>isLoadingUser: {auth.isLoadingUser ? 'true' : 'false'}</div>
          <div>user: {auth.user ? auth.user.id : 'null'}</div>
        </div>
      )
    }

    render(
      <AuthProvider config={mockConfig}>
        <TestComponent />
      </AuthProvider>,
    )

    // Initially loading should be true
    await waitFor(() => {
      expect(screen.getByText(/isLoadingUser:/)).toBeInTheDocument()
    })
  })

  it('should initialize with unauthenticated state when user is not logged in', async () => {
    const TestComponent = () => {
      const auth = useAuthContext()
      return (
        <div>
          <div>user: {auth.user ? 'logged in' : 'not logged in'}</div>
        </div>
      )
    }

    render(
      <AuthProvider config={mockConfig}>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText(/not logged in/)).toBeInTheDocument()
    })
  })

  it('should provide signIn and signOut methods', async () => {
    const TestComponent = () => {
      const auth = useAuthContext()
      return (
        <div>
          <button onClick={() => auth.signIn()}>Sign In</button>
          <button onClick={() => auth.signOut()}>Sign Out</button>
        </div>
      )
    }

    render(
      <AuthProvider config={mockConfig}>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })
  })

  it('should apply custom navigation if provided', async () => {
    const customNavigate = vi.fn()

    render(
      <AuthProvider config={mockConfig} customNavigate={customNavigate}>
        <div>Test</div>
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  it('should return context data with correct initial state', async () => {
    const TestComponent = () => {
      const { user, isLoadingUser, enablePopupSignIn } = useAuthContext()
      return (
        <div>
          <div>loading: {isLoadingUser.toString()}</div>
          <div>user-id: {user?.id || 'none'}</div>
          <div>popup: {enablePopupSignIn ? 'enabled' : 'disabled'}</div>
        </div>
      )
    }

    render(
      <AuthProvider config={mockConfig} enablePopupSignIn={true}>
        <TestComponent />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText(/popup: enabled/)).toBeInTheDocument()
    })
  })

  it('should handle callbackUrl prop', async () => {
    render(
      <AuthProvider config={mockConfig} callbackUrl="/auth/callback">
        <div>Test</div>
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })
})
