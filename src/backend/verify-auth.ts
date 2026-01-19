import { importJWK, jwtVerify } from 'jose'
import cookieParser from 'cookie-parser'
import type { AuthContext, AuthPayload, VerifyAuthOptions, ExpressRequest, ExpressResponse, ExpressNext, NextRequest } from './types'

// Cache for JWKs to avoid fetching on every request
const jwksCache = new Map<string, { keys: any[]; expires: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Extract guest token from cookie
 */
function extractGuestTokenFromCookies(cookies: any, cookieName: string = 'guest_logto_authtoken'): string | null {
  if (typeof cookies?.get === 'function') {
    // Next.js cookies
    const cookie = cookies.get(cookieName)
    return cookie?.value || generateUUID()
  } else if (cookies && typeof cookies === 'object') {
    // Express cookies
    return cookies[cookieName] || generateUUID()
  }
  return generateUUID()
}

/**
 * Extract token from cookie
 */
function extractTokenFromCookies(cookies: any, cookieName: string = 'logto_authtoken'): string | null {
  if (typeof cookies?.get === 'function') {
    // Next.js cookies
    const cookie = cookies.get(cookieName)
    return cookie?.value || null
  } else if (cookies && typeof cookies === 'object') {
    // Express cookies
    return cookies[cookieName] || null
  }
  return null
}

/**
 * Extract token from Authorization header (Bearer token)
 */
function extractBearerTokenFromHeaders(headers: any): string | null {
  const authorization = typeof headers.get === 'function' ? headers.get('authorization') : headers.authorization

  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice(7)
  }
  return null
}

/**
 * Base64URL decode helper
 */
function base64UrlDecode(str: string): string {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')

  // Pad with = if needed
  const pad = base64.length % 4
  if (pad) {
    base64 += '='.repeat(4 - pad)
  }

  // Decode from base64
  if (typeof atob !== 'undefined') {
    // Browser environment
    return atob(base64)
  } else {
    // Node.js environment
    return Buffer.from(base64, 'base64').toString()
  }
}

/**
 * Fetch JWKS from Logto server with caching
 */
async function fetchJWKS(logtoUrl: string): Promise<any[]> {
  // Ensure logtoUrl has no trailing slash
  const normalizedLogtoUrl = logtoUrl.replace(/\/+$/, '')
  const jwksUrl = `${normalizedLogtoUrl}/oidc/jwks`
  const now = Date.now()

  // Check cache first
  const cached = jwksCache.get(jwksUrl)
  if (cached && cached.expires > now) {
    return cached.keys
  }

  try {
    const response = await fetch(jwksUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`)
    }

    const jwks = await response.json()
    const keys = jwks.keys || []

    // Cache the keys
    jwksCache.set(jwksUrl, {
      keys,
      expires: now + CACHE_DURATION,
    })

    return keys
  } catch (error) {
    throw new Error(`Failed to fetch JWKS from ${jwksUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Find the appropriate key from JWKS for token verification
 */
function findMatchingKey(keys: any[], kid?: string, alg?: string): any {
  if (!keys || keys.length === 0) {
    throw new Error('No keys found in JWKS')
  }

  // If kid is provided, find exact match
  if (kid) {
    const key = keys.find(k => k.kid === kid)
    if (key) return key
    throw new Error(`Key with kid "${kid}" not found in JWKS`)
  }

  // If alg is provided, find by algorithm
  if (alg) {
    const key = keys.find(k => k.alg === alg)
    if (key) return key
  }

  // Default to first key with RSA algorithm
  const rsaKey = keys.find(k => k.kty === 'RSA' && (k.use === 'sig' || !k.use))
  if (rsaKey) return rsaKey

  // Fallback to first key
  return keys[0]
}

/**
 * Manually verify JWT token claims
 */
function verifyTokenClaims(payload: any, options: VerifyAuthOptions): void {
  const { logtoUrl, audience, requiredScope } = options

  const expectedIssuer = new URL(`oidc`, logtoUrl).toString()

  // Verify issuer
  if (payload.iss !== expectedIssuer) {
    throw new Error(`Invalid issuer. Expected: ${expectedIssuer}, Got: ${payload.iss}`)
  }

  // Verify audience
  if (audience && payload.aud !== audience) {
    throw new Error(`Invalid audience. Expected: ${audience}, Got: ${payload.aud}`)
  }

  // Verify expiration
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired')
  }

  // Verify not before
  if (payload.nbf && payload.nbf > now) {
    throw new Error('Token is not yet valid')
  }

  // Verify required scope
  if (requiredScope && (!payload.scope || !payload.scope.includes(requiredScope))) {
    throw new Error(`Missing required scope: ${requiredScope}`)
  }
}

/**
 * Verify JWT token from Logto
 */
export async function verifyLogtoToken(token: string, options: VerifyAuthOptions): Promise<AuthContext> {
  const { logtoUrl } = options

  try {
    // Decode JWT header to get kid and alg
    const [headerBase64] = token.split('.')
    if (!headerBase64) {
      throw new Error('Invalid JWT format')
    }

    const headerJson = base64UrlDecode(headerBase64)
    const header = JSON.parse(headerJson)

    // Fetch JWKS from Logto
    const keys = await fetchJWKS(logtoUrl)

    // Find matching key
    const jwk = findMatchingKey(keys, header.kid, header.alg)

    // Import the JWK for verification
    const publicKey = await importJWK(jwk, header?.alg || 'RS256')

    // Verify the JWT signature and get payload
    const { payload } = (await jwtVerify(token, publicKey)) as { payload: AuthPayload }

    // Manually verify all claims
    verifyTokenClaims(payload, options)

    return {
      userId: payload.sub,
      isAuthenticated: true,
      payload,
      isGuest: false,
    }
  } catch (error) {
    throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const generateUUID = () => {
  // Generate a random UUID (v4)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Express middleware for Logto authentication
 */
export function createExpressAuthMiddleware(options: VerifyAuthOptions) {
  // Create cookie parser middleware once (not on every request)
  const parseCookies = cookieParser()
  
  return async (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
    // Parse cookies if not already parsed
    // cookie-parser is synchronous and will set req.cookies immediately
    if (req.cookies === undefined) {
      parseCookies(req as any, res as any, () => {
        // Cookie parsing is complete (synchronous operation)
      })
    }
    
    try {
      // Try to get token from cookie first, then from Authorization header
      let token = extractTokenFromCookies(req.cookies, options.cookieName)

      if (!token) {
        token = extractBearerTokenFromHeaders(req.headers)
      }

      if (!token) {
        // If allowGuest is enabled, check for guest cookie
        if (options.allowGuest) {
          const guestId = extractGuestTokenFromCookies(req.cookies)

          req.auth = {
            userId: null,
            isAuthenticated: false,
            payload: null,
            isGuest: true,
            guestId: guestId || undefined,
          }

          return next()
        }

        return res.status(401).json({
          error: 'Authentication required',
          message: 'No token found in cookies or Authorization header',
        })
      }

      const authContext = await verifyLogtoToken(token, options)
      req.auth = authContext

      return next()
    } catch (error) {
      // If allowGuest is enabled and token verification fails, fall back to guest
      if (options.allowGuest) {
        const guestId = extractGuestTokenFromCookies(req.cookies)

        req.auth = {
          userId: null,
          isAuthenticated: false,
          payload: null,
          isGuest: true,
          guestId: guestId || undefined,
        }

        return next()
      }

      return res.status(401).json({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

/**
 * Next.js middleware for Logto authentication
 */
export async function verifyNextAuth(
  request: NextRequest,
  options: VerifyAuthOptions,
): Promise<{ success: true; auth: AuthContext } | { success: false; error: string; auth?: AuthContext }> {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = extractTokenFromCookies(request.cookies, options.cookieName)

    if (!token) {
      token = extractBearerTokenFromHeaders(request.headers)
    }

    if (!token) {
      // If allowGuest is enabled, check for existing guest cookie
      if (options.allowGuest) {
        const guestId = extractGuestTokenFromCookies(request.cookies)

        const guestAuth: AuthContext = {
          userId: null,
          isAuthenticated: false,
          payload: null,
          isGuest: true,
          guestId: guestId || undefined,
        }

        return {
          success: false,
          error: 'No authentication token found',
          auth: guestAuth,
        }
      }

      return {
        success: false,
        error: 'No token found in cookies or Authorization header',
      }
    }

    const authContext = await verifyLogtoToken(token, options)

    return {
      success: true,
      auth: authContext,
    }
  } catch (error) {
    // If allowGuest is enabled and token verification fails, fall back to guest
    if (options.allowGuest) {
      const guestId = extractGuestTokenFromCookies(request.cookies)

      const guestAuth: AuthContext = {
        userId: null,
        isAuthenticated: false,
        payload: null,
        isGuest: true,
        guestId: guestId || undefined,
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        auth: guestAuth,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generic verification function that can be used in any Node.js environment
 */
export async function verifyAuth(
  tokenOrRequest: string | { cookies?: any; headers?: any },
  options: VerifyAuthOptions,
): Promise<AuthContext> {
  let token: string

  if (typeof tokenOrRequest === 'string') {
    token = tokenOrRequest
  } else {
    // Extract from request object
    const extractedToken =
      extractTokenFromCookies(tokenOrRequest.cookies, options.cookieName) || extractBearerTokenFromHeaders(tokenOrRequest.headers)

    if (!extractedToken) {
      // If allowGuest is enabled, check for guest cookie
      if (options.allowGuest) {
        const guestId = extractGuestTokenFromCookies(tokenOrRequest.cookies)

        return {
          userId: null,
          isAuthenticated: false,
          payload: null,
          isGuest: true,
          guestId: guestId || undefined,
        }
      }

      throw new Error('No token found in request')
    }

    token = extractedToken
  }

  try {
    return await verifyLogtoToken(token, options)
  } catch (error) {
    // If allowGuest is enabled and token verification fails, fall back to guest
    if (options.allowGuest && typeof tokenOrRequest === 'object') {
      const guestId = extractGuestTokenFromCookies(tokenOrRequest.cookies)

      return {
        userId: null,
        isAuthenticated: false,
        payload: null,
        isGuest: true,
        guestId: guestId || undefined,
      }
    }

    throw error
  }
}
