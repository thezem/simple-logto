'use client'
import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import LoadingSpinner from './components/ui/loading-spinner'

export function SignInPage() {
  const { user, signIn, isLoadingUser } = useAuth()
  const signInInProgress = useRef(false)

  useEffect(() => {
    if (isLoadingUser) return

    // Detect if this window was opened by another window (popup flow)
    const isPopup = window.opener && window.opener !== window

    if (user) {
      // User is already authenticated - redirect or close popup
      if (isPopup) {
        window.opener.postMessage({ type: 'SIGNIN_COMPLETE' }, window.location.origin)
        setTimeout(() => window.close(), 100)
      } else {
        window.location.href = '/'
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
