import { describe, expect, it } from 'vitest'
import { hasScopes, requireScopes } from './authorization'
import type { AuthContext, AuthPayload } from './types'

function buildPayload(overrides: Partial<AuthPayload> = {}): AuthPayload {
  return {
    sub: 'user-123',
    scope: 'read:profile write:profile admin:users',
    iss: 'https://tenant.logto.app/oidc',
    ...overrides,
  }
}

function buildAuthContext(payload: AuthPayload | null): AuthContext {
  return {
    userId: payload?.sub ?? null,
    isAuthenticated: Boolean(payload),
    payload,
    isGuest: false,
  }
}

describe('scope authorization helpers', () => {
  it('returns true when all required scopes are present by default', () => {
    expect(hasScopes(buildPayload(), ['read:profile', 'write:profile'])).toBe(true)
  })

  it('returns false when one of the required scopes is missing in all mode', () => {
    expect(hasScopes(buildPayload(), ['read:profile', 'billing:read'])).toBe(false)
  })

  it('supports any mode for partial scope matches', () => {
    expect(hasScopes(buildPayload(), ['billing:read', 'admin:users'], { mode: 'any' })).toBe(true)
  })

  it('accepts an AuthContext as the subject', () => {
    const auth = buildAuthContext(buildPayload())
    expect(hasScopes(auth, 'admin:users')).toBe(true)
  })

  it('splits whitespace-delimited required scope strings', () => {
    expect(hasScopes(buildPayload(), 'read:profile write:profile')).toBe(true)
  })

  it('returns false when the payload is missing', () => {
    expect(hasScopes(buildAuthContext(null), 'read:profile')).toBe(false)
  })

  it('requireScopes does not throw when all scopes are present', () => {
    expect(() => requireScopes(buildPayload(), ['read:profile', 'admin:users'])).not.toThrow()
  })

  it('requireScopes supports any mode', () => {
    expect(() => requireScopes(buildPayload(), ['billing:read', 'admin:users'], { mode: 'any' })).not.toThrow()
  })

  it('requireScopes throws a descriptive error when scopes are missing', () => {
    expect(() => requireScopes(buildPayload(), ['read:profile', 'billing:read'])).toThrow(
      /Missing required scopes/,
    )
  })

  it('treats an empty required scope list as a no-op', () => {
    expect(() => requireScopes(buildPayload(), [])).not.toThrow()
    expect(hasScopes(buildPayload(), [])).toBe(true)
  })
})
