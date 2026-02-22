'use client'
import React, { useEffect, useRef } from 'react'
import { useHandleSignInCallback } from '@logto/react'

export interface CallbackPageProps {
  className?: string
  loadingComponent?: React.ReactNode
  successComponent?: React.ReactNode
  onSuccess?: () => void
  onError?: (error: Error) => void
}

// Define keyframes for spin animation
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

export const CallbackPage: React.FC<CallbackPageProps> = ({ className = '', loadingComponent, successComponent, onSuccess, onError }) => {
  const callbackHandled = useRef(false)

  useEffect(() => {
    if (!document.querySelector('#spin-keyframes')) {
      const style = document.createElement('style')
      style.id = 'spin-keyframes'
      style.textContent = spinKeyframes
      document.head.appendChild(style)
    }
  }, [])

  const { isLoading } = useHandleSignInCallback(() => {
    // Prevent executing callback multiple times
    if (callbackHandled.current) return
    callbackHandled.current = true

    try {
      // Detect if this window was opened by another window (popup flow)
      const isPopup = window.opener && window.opener !== window

      if (onSuccess) {
        onSuccess()
      } else {
        // If not a popup, redirect to the home page or a specific URL
        if (!isPopup) {
          window.location.href = '/'
        } else {
          // Send message to parent window before closing
          if (window.opener && window.opener !== window) {
            window.opener.postMessage({ type: 'SIGNIN_SUCCESS' }, window.location.origin)
          }
          // Small delay to ensure message is sent before closing
          setTimeout(() => {
            window.close()
          }, 100)
        }
      }
    } catch (error) {
      console.error('Authentication callback error:', error)
      if (onError) {
        onError(error as Error)
      }
    }
  })

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    minHeight: '100vh',
  }

  const flexStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }

  const spinnerStyle = {
    width: '1.25rem',
    height: '1.25rem',
    color: 'black',
    animation: 'spin 1s linear infinite',
  }

  const textStyle = {
    fontSize: '1.125rem',
    color: '#64748b',
  }

  if (isLoading) {
    return (
      <div style={containerStyle} className={className}>
        {loadingComponent || (
          <div style={flexStyle}>
            <svg style={spinnerStyle} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                style={{ opacity: 0.75 }}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div style={textStyle}>Signing you in...</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={containerStyle} className={className}>
      {successComponent || (
        <div style={{ ...flexStyle, textAlign: 'center' }}>
          <svg style={spinnerStyle} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <div style={textStyle}>Authentication complete! Redirecting...</div>
        </div>
      )}
    </div>
  )
}
