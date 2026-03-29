import type { AuthContext, AuthPayload } from './types.js'

export type AuthorizationMode = 'all' | 'any'

export interface ScopeCheckOptions {
  mode?: AuthorizationMode
}

type AuthSubject = AuthContext | AuthPayload | null | undefined

function isAuthContext(subject: AuthSubject): subject is AuthContext {
  return typeof subject === 'object' && subject !== null && 'isAuthenticated' in subject
}

function getPayload(subject: AuthSubject): AuthPayload | null {
  if (!subject) return null
  return isAuthContext(subject) ? subject.payload : subject
}

function normalizeScopeInput(scopes: string | string[]): string[] {
  return (Array.isArray(scopes) ? scopes : [scopes])
    .flatMap(scope => scope.split(/\s+/))
    .map(scope => scope.trim())
    .filter(Boolean)
}

function readTokenScopes(subject: AuthSubject): string[] {
  const payload = getPayload(subject)
  if (!payload?.scope) return []
  return normalizeScopeInput(payload.scope)
}

/**
 * Return `true` when the token payload contains the requested scopes.
 *
 * Accepts either a raw `AuthPayload` or a full `AuthContext`. Scope comparison is
 * whitespace-delimited to match the standard OAuth `scope` claim shape used by Logto.
 *
 * @example
 * hasScopes(auth.payload, ['read:profile', 'write:profile'])
 * hasScopes(auth, ['read:profile', 'write:profile'], { mode: 'any' })
 */
export function hasScopes(subject: AuthSubject, scopes: string | string[], options: ScopeCheckOptions = {}): boolean {
  const requiredScopes = normalizeScopeInput(scopes)
  if (requiredScopes.length === 0) return true

  const grantedScopes = readTokenScopes(subject)
  const { mode = 'all' } = options

  return mode === 'any'
    ? requiredScopes.some(scope => grantedScopes.includes(scope))
    : requiredScopes.every(scope => grantedScopes.includes(scope))
}

/**
 * Assert that the token payload contains the requested scopes.
 *
 * Throws a descriptive error listing the missing scopes when the check fails.
 *
 * @example
 * requireScopes(auth, ['read:profile', 'write:profile'])
 * requireScopes(payload, ['admin:read', 'admin:write'], { mode: 'any' })
 */
export function requireScopes(subject: AuthSubject, scopes: string | string[], options: ScopeCheckOptions = {}): void {
  const requiredScopes = normalizeScopeInput(scopes)
  if (requiredScopes.length === 0) return

  const grantedScopes = readTokenScopes(subject)
  const { mode = 'all' } = options

  if (hasScopes(subject, requiredScopes, { mode })) {
    return
  }

  const missingScopes = requiredScopes.filter(scope => !grantedScopes.includes(scope))
  const expectation = mode === 'any' ? 'at least one of' : 'all of'
  throw new Error(
    `Missing required scopes (${expectation}: ${requiredScopes.join(', ')}). Token scopes: ${grantedScopes.join(', ') || '(none)'}. Missing: ${missingScopes.join(', ') || requiredScopes.join(', ')}`,
  )
}
