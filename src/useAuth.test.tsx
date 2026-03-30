import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'
import { useAuthContext } from './context'

const mockNavigate = vi.fn()

// Mock useAuthContext
vi.mock('./context', async () => {
  const actual = await vi.importActual('./context')
  return {
    ...actual,
    useAuthContext: vi.fn(),
  }
})

vi.mock('./navigation', () => ({
  useNavigation: () => mockNavigate,
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Default behavior (no middleware)', () => {
    it('should return auth context without middleware', async () => {
      const mockAuth = {
        user: { id: 'user-123', name: 'Test User' },
        isLoadingUser: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        const auth = useAuth()
        return <div>User: {auth.user?.name}</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByText(/User: Test User/)).toBeInTheDocument()
      })
    })

    it('should not redirect when middleware is undefined', async () => {
      const mockAuth = {
        user: null,
        isLoadingUser: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        useAuth() // No options
        return <div>Test</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('Auth middleware (require authentication)', () => {
    it('should redirect to /signin when user not authenticated and middleware=auth (no redirectTo)', async () => {
      const mockAuth = {
        user: null,
        isLoadingUser: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        useAuth({ middleware: 'auth' })
        return <div>Protected Content</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        // Default fallback is '/signin' (not '/404') so unauthenticated users land at the sign-in page
        expect(mockNavigate).toHaveBeenCalledWith('/signin', undefined)
      })
    })

    it('should redirect to custom URL when user not authenticated', async () => {
      const mockAuth = {
        user: null,
        isLoadingUser: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        useAuth({ middleware: 'auth', redirectTo: '/login' })
        return <div>Protected Content</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', undefined)
      })
    })

    it('should not redirect when user is authenticated', async () => {
      const mockAuth = {
        user: { id: 'user-123', name: 'Test User' },
        isLoadingUser: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        const auth = useAuth({ middleware: 'auth' })
        return <div>User: {auth.user?.name}</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByText(/User: Test User/)).toBeInTheDocument()
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })

    it('should not redirect when still loading', async () => {
      const mockAuth = {
        user: null,
        isLoadingUser: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        useAuth({ middleware: 'auth' })
        return <div>Loading...</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('Guest middleware (require guest/no auth)', () => {
    it('should redirect when user is authenticated and middleware=guest', async () => {
      const mockAuth = {
        user: { id: 'user-123', name: 'Test User' },
        isLoadingUser: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        useAuth({
          middleware: 'guest',
          redirectIfAuthenticated: '/dashboard',
        })
        return <div>Login Page</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', undefined)
      })
    })

    it('should not redirect when user is not authenticated and middleware=guest', async () => {
      const mockAuth = {
        user: null,
        isLoadingUser: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        useAuth({ middleware: 'guest' })
        return <div>Login Page</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
        expect(screen.getByText(/Login Page/)).toBeInTheDocument()
      })
    })

    it('should not redirect guest users without redirectIfAuthenticated option', async () => {
      const mockAuth = {
        user: { id: 'user-123', name: 'Test User' },
        isLoadingUser: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        useAuth({ middleware: 'guest' })
        return <div>Page</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('Navigation options', () => {
    it('should pass navigation options to navigateTo', async () => {
      const mockAuth = {
        user: null,
        isLoadingUser: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const navOptions = { replace: true, force: false }

      const TestComponent = () => {
        useAuth({
          middleware: 'auth',
          redirectTo: '/login',
          navigationOptions: navOptions,
        })
        return <div>Test</div>
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', navOptions)
      })
    })
  })

  describe('Options memoization', () => {
    it('should memoize options to prevent unnecessary redirects', async () => {
      let renderCount = 0
      const mockAuth = {
        user: null,
        isLoadingUser: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshAuth: vi.fn(),
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        renderCount++
        useAuth({
          middleware: 'auth',
          redirectTo: '/login',
        })
        return <div>Render: {renderCount}</div>
      }

      const { rerender } = render(<TestComponent />)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledTimes(1)
      })

      // Additional renders with same options should not trigger more redirects
      rerender(<TestComponent />)

      // navigateTo should still only be called once
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Auth context methods', () => {
    it('should return signIn and signOut methods', async () => {
      const mockSignIn = vi.fn()
      const mockSignOut = vi.fn()
      const mockRefreshAuth = vi.fn()

      const mockAuth = {
        user: { id: 'user-123', name: 'Test User' },
        isLoadingUser: false,
        signIn: mockSignIn,
        signOut: mockSignOut,
        refreshAuth: mockRefreshAuth,
      }

      ;(useAuthContext as any).mockReturnValue(mockAuth)

      const TestComponent = () => {
        const auth = useAuth()
        return (
          <div>
            <button onClick={() => auth.signIn()}>Sign In</button>
            <button onClick={() => auth.signOut()}>Sign Out</button>
            <button onClick={() => auth.refreshAuth()}>Refresh</button>
          </div>
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
        expect(screen.getByText('Sign Out')).toBeInTheDocument()
        expect(screen.getByText('Refresh')).toBeInTheDocument()
      })
    })
  })
})
