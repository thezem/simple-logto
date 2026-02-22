'use client'
import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { LogtoConfig, LogtoProvider, useLogto } from '@logto/react'
import { transformUser, setCustomNavigate, jwtCookieUtils, guestUtils, validateLogtoConfig } from './utils'
import type { AuthContextType, AuthProviderProps, LogtoUser } from './types'

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Client-only wrapper to prevent SSR issues
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

  return <>{children}</>
}

// Internal provider that wraps Logto's context
const InternalAuthProvider = ({
  children,
  callbackUrl,
  enablePopupSignIn,
  logtoConfig,
}: {
  children: React.ReactNode
  callbackUrl?: string
  enablePopupSignIn?: boolean
  logtoConfig: LogtoConfig // Logto configuration object
}) => {
  const { isAuthenticated, isLoading, getIdTokenClaims, getAccessToken, signIn: logtoSignIn, signOut: logtoSignOut } = useLogto()
  const [user, setUser] = useState<LogtoUser | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true)

  // Rate limiting to prevent infinite calls
  const lastLoadTime = useRef<number>(0)
  const errorCount = useRef<number>(0)
  const MAX_ERROR_COUNT = 3
  const MIN_LOAD_INTERVAL = 1000 // 1 second between calls

  const loadUser = useCallback(async () => {
    if (isLoading) return

    // Rate limiting check
    const now = Date.now()
    if (now - lastLoadTime.current < MIN_LOAD_INTERVAL) {
      return
    }
    lastLoadTime.current = now

    setIsLoadingUser(true)

    if (isAuthenticated) {
      try {
        const claims = await getIdTokenClaims()
        const jwt = await getAccessToken(logtoConfig?.resources?.[0] || 'urn:logto:resource:default')

        // Save JWT token to cookie
        if (jwt) {
          jwtCookieUtils.saveToken(jwt)
        }

        setUser(transformUser(claims))
        // Reset error count on success
        errorCount.current = 0
      } catch (error: any) {
        console.error('Error fetching user claims:', error)
        errorCount.current += 1

        // Clear user state and remove token on any authentication error
        setUser(null)
        jwtCookieUtils.removeToken()

        // If we've hit max errors or it's clearly an auth error, force logout
        const isAuthError =
          error?.message?.includes('invalid') ||
          error?.message?.includes('expired') ||
          error?.message?.includes('Grant request is invalid') ||
          error?.code === 'invalid_grant' ||
          errorCount.current >= MAX_ERROR_COUNT

        if (isAuthError) {
          console.warn('Authentication error detected, forcing logout:', error.message)
          try {
            // Force a complete logout to clear all auth state
            await logtoSignOut()
          } catch (logoutError) {
            console.error('Error during forced logout:', logoutError)
            // Even if logout fails, dispatch event to notify other components
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth-state-changed'))
            }
          }
          // Reset error count after logout
          errorCount.current = 0
        }
      }
    } else {
      setUser(null)
      // Remove token cookie when not authenticated
      jwtCookieUtils.removeToken()
      // Reset error count when not authenticated
      errorCount.current = 0
    }

    setIsLoadingUser(false)
  }, [isLoading, isAuthenticated, getIdTokenClaims, getAccessToken, logtoSignOut])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Store the latest loadUser function in a ref to avoid recreating event listeners
  const loadUserRef = useRef(loadUser)
  loadUserRef.current = loadUser

  // Add effect to handle cross-window/tab authentication state changes
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    guestUtils.ensureGuestId() // Ensure guest ID is set

    let lastFocusTime = 0

    // Listen for storage changes (when auth state changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      // Logto typically stores auth state in localStorage
      if (e.key && (e.key.includes('logto') || e.key.includes('auth'))) {
        // Refresh auth state when storage changes
        setTimeout(() => {
          loadUserRef.current()
        }, 100) // Small delay to ensure storage is updated
      }
    }

    // Listen for window focus to refresh auth state
    const handleWindowFocus = () => {
      // Only refresh if it's been more than 1 second since last focus
      // to prevent excessive re-renders
      const now = Date.now()
      if (now - lastFocusTime > 1000) {
        lastFocusTime = now
        loadUserRef.current()
      }
    }

    // Listen for custom auth change events
    const handleAuthChange = () => {
      loadUserRef.current()
    }

    // Add event listeners
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('auth-state-changed', handleAuthChange)

    // Cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('auth-state-changed', handleAuthChange)
    }
  }, []) // Empty dependency array to prevent recreating listeners

  const signIn = useCallback(
    async (overrideCallbackUrl?: string, usePopup?: boolean) => {
      // Only run on client side
      if (typeof window === 'undefined') return

      // Check if we're already in a popup to prevent infinite loops
      const isInPopup = window.opener && window.opener !== window

      if (isInPopup) {
        // If we're already in a popup, just do direct sign-in without opening another popup
        const redirectUrl = overrideCallbackUrl || callbackUrl || window.location.href
        await logtoSignIn(redirectUrl)
        return
      }

      const shouldUsePopup = usePopup ?? enablePopupSignIn
      console.log(`SignIn called with usePopup=${shouldUsePopup}, enablePopupSignIn=${enablePopupSignIn}`)

      if (!shouldUsePopup) {
        const redirectUrl = overrideCallbackUrl || callbackUrl || window.location.href
        await logtoSignIn(redirectUrl)
      } else {
        // Use popup sign-in
        const popupWidth = 500
        const popupHeight = 770
        const left = window.innerWidth / 2 - popupWidth / 2
        const top = window.innerHeight / 2 - popupHeight / 2
        const popupFeatures = `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`

        // Use the signin page route - assume user has it at /signin
        const popup = window.open('/signin', 'SignInPopup', popupFeatures)

        // Listen for the popup to close or complete authentication
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            // Dispatch event to refresh auth state when popup closes
            window.dispatchEvent(new CustomEvent('auth-state-changed'))
          }
        }, 1000)

        // Listen for messages from the popup
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return

          if (event.data.type === 'SIGNIN_SUCCESS' || event.data.type === 'SIGNIN_COMPLETE') {
            loadUserRef.current()
            window.dispatchEvent(new CustomEvent('auth-state-changed'))
            popup?.close()
            clearInterval(checkClosed)
          }
        }

        window.addEventListener('message', handleMessage)

        // Cleanup listener when popup closes
        const cleanupListener = () => {
          window.removeEventListener('message', handleMessage)
          clearInterval(checkClosed)
        }

        setTimeout(cleanupListener, 300000) // 5 minutes timeout
      }
    },
    [enablePopupSignIn, callbackUrl, logtoSignIn],
  )

  const signOut = useCallback(
    async (options?: { callbackUrl?: string; global?: boolean }) => {
      // Only run on client side
      if (typeof window === 'undefined') return

      const { callbackUrl, global = true } = options || {}

      // Always remove the JWT token cookie on sign out
      jwtCookieUtils.removeToken()

      if (global) {
        // Global sign out - logs out from entire Logto ecosystem
        await logtoSignOut(callbackUrl)
      } else {
        // Local sign out - only clears local session
        setUser(null)
        setIsLoadingUser(false)

        // Optional: Clear any local storage or session storage if needed
        // localStorage.removeItem('logto_session')
        // sessionStorage.clear()

        if (callbackUrl) {
          window.location.href = callbackUrl
        }
      }

      // Dispatch custom event to notify other windows/tabs
      window.dispatchEvent(new CustomEvent('auth-state-changed'))
    },
    [logtoSignOut],
  )

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isLoadingUser,
      signIn,
      signOut,
      refreshAuth: () => loadUserRef.current(),
      enablePopupSignIn,
    }),
    [user, isLoadingUser, signIn, signOut, enablePopupSignIn],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// External provider that wraps Logto's provider
export const AuthProvider = ({ children, config, callbackUrl, customNavigate, enablePopupSignIn = false }: AuthProviderProps) => {
  // Validate configuration on mount
  useEffect(() => {
    validateLogtoConfig(config)
  }, [config])

  // Set the custom navigate function for the entire library
  useEffect(() => {
    setCustomNavigate(customNavigate || null)

    // Cleanup on unmount
    return () => setCustomNavigate(null)
  }, [customNavigate])

  return (
    <ClientOnly>
      <LogtoProvider config={config}>
        <InternalAuthProvider logtoConfig={config} callbackUrl={callbackUrl} enablePopupSignIn={enablePopupSignIn}>
          {children}
        </InternalAuthProvider>
      </LogtoProvider>
    </ClientOnly>
  )
}

// Hook to use the auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }

  return context
}
