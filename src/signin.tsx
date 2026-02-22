'use client'
import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import LoadingSpinner from './components/ui/loading-spinner'

export function SignInPage() {
  const { user, signIn, isLoadingUser } = useAuth()
  const signInInProgress = useRef(false)

  useEffect(() => {
    if (isLoadingUser) return

    // Detect if this window was opened by another window (popup flow).
    // Also check the URL param set by the opener and persist it to sessionStorage
    // so it survives the cross-origin round-trip through Logto.
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('popup') === 'true') {
      sessionStorage.setItem('simple_logto_popup_flow', 'true')
    }

    const isPopup = (window.opener && window.opener !== window) || sessionStorage.getItem('simple_logto_popup_flow') === 'true'

    if (user) {
      // User is already authenticated - redirect or close popup
      if (isPopup) {
        // Try to notify parent window, but handle case where opener is gone
        if (window.opener && window.opener !== window) {
          try {
            window.opener.postMessage({ type: 'SIGNIN_COMPLETE' }, window.location.origin)
          } catch (e) {
            console.error('Failed to post message to opener:', e)
            // Use fallback method
            localStorage.setItem('simple_logto_signin_complete', Date.now().toString())
          }
        } else {
          // Fallback: opener is gone, use localStorage broadcast
          localStorage.setItem('simple_logto_signin_complete', Date.now().toString())
        }
        // Clean up and close
        sessionStorage.removeItem('simple_logto_popup_flow')
        console.log('[SignInPage] Closing popup')
        setTimeout(() => window.close(), 100)
      } else {
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        } else {
          window.location.reload() // Ensure the app state is updated for the authenticated user
        }
      }
      return
    }

    // Initiate sign-in if not already in progress
    if (!signInInProgress.current) {
      signInInProgress.current = true
      // Pass false to prevent nested popups when already in a popup
      signIn(undefined, false)
    }
  }, [user, isLoadingUser, signIn])

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return null
}
