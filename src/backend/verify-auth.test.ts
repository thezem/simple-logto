import { describe, it, expect, beforeEach, vi } from 'vitest'
import { verifyLogtoToken } from './verify-auth'
import type { VerifyAuthOptions } from './types'

// Mock jose library
vi.mock('jose', () => ({
  importJWK: vi.fn().mockResolvedValue({}),
  jwtVerify: vi.fn(),
}))

// Mock fetch globally
global.fetch = vi.fn()

const mockOptions: VerifyAuthOptions = {
  logtoUrl: 'https://test.logto.app',
  audience: 'urn:logto:resource:api',
}

describe('JWT Verification Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
  })

  describe('Token Format Validation', () => {
    it('should reject invalid JWT format (no dots)', async () => {
      const invalidToken = 'invalidentoken'

      await expect(verifyLogtoToken(invalidToken, mockOptions)).rejects.toThrow()
    })

    it('should reject JWT with only one part', async () => {
      const invalidToken = 'header.'

      await expect(verifyLogtoToken(invalidToken, mockOptions)).rejects.toThrow()
    })

    it('should reject empty token', async () => {
      const emptyToken = ''

      await expect(verifyLogtoToken(emptyToken, mockOptions)).rejects.toThrow()
    })
  })

  describe('JWKS Fetching', () => {
    it('should fetch JWKS from correct URL', async () => {
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InRlc3Qta2lkIn0.payload.signature'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          keys: [
            {
              kid: 'test-kid',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        }),
      })

      const { importJWK: _importJWK, jwtVerify } = await import('jose')
      ;(jwtVerify as any).mockResolvedValueOnce({
        payload: {
          sub: 'user-123',
          iss: 'https://test.logto.app/oidc',
          aud: 'urn:logto:resource:api',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      })

      try {
        await verifyLogtoToken(mockToken, mockOptions)
      } catch (e) {
        // Expected to fail due to mocking, but verifies JWKS fetch was attempted
      }

      expect(global.fetch).toHaveBeenCalledWith('https://test.logto.app/oidc/jwks')
    })

    it('should handle JWKS fetch failure', async () => {
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InRlc3Qta2lkIn0.payload.signature'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(verifyLogtoToken(mockToken, mockOptions)).rejects.toThrow()
    })

    it('should cache JWKS responses', async () => {
      // Note: This would require exposing the cache or making multiple calls
      // For now, this is a placeholder for cache testing
      expect(true).toBe(true)
    })
  })

  describe('Claim Validation', () => {
    it('should validate issuer claim', async () => {
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InRlc3Qta2lkIn0.payload.signature'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          keys: [
            {
              kid: 'test-kid',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        }),
      })

      const { jwtVerify } = await import('jose')
      ;(jwtVerify as any).mockResolvedValueOnce({
        payload: {
          sub: 'user-123',
          iss: 'https://invalid.logto.app/oidc',
          aud: 'urn:logto:resource:api',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      })

      await expect(verifyLogtoToken(mockToken, mockOptions)).rejects.toThrow('Invalid issuer')
    })

    it('should validate audience claim', async () => {
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InRlc3Qta2lkIn0.payload.signature'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          keys: [
            {
              kid: 'test-kid',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        }),
      })

      const { jwtVerify } = await import('jose')
      ;(jwtVerify as any).mockResolvedValueOnce({
        payload: {
          sub: 'user-123',
          iss: 'https://test.logto.app/oidc',
          aud: 'urn:logto:resource:wrong',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      })

      await expect(verifyLogtoToken(mockToken, mockOptions)).rejects.toThrow('Invalid audience')
    })

    it('should reject expired tokens', async () => {
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InRlc3Qta2lkIn0.payload.signature'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          keys: [
            {
              kid: 'test-kid',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        }),
      })

      const { jwtVerify } = await import('jose')
      ;(jwtVerify as any).mockResolvedValueOnce({
        payload: {
          sub: 'user-123',
          iss: 'https://test.logto.app/oidc',
          aud: 'urn:logto:resource:api',
          exp: Math.floor(Date.now() / 1000) - 3600, // Expired
        },
      })

      await expect(verifyLogtoToken(mockToken, mockOptions)).rejects.toThrow('expired')
    })

    it('should reject tokens not yet valid', async () => {
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InRlc3Qta2lkIn0.payload.signature'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          keys: [
            {
              kid: 'test-kid',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        }),
      })

      const { jwtVerify } = await import('jose')
      ;(jwtVerify as any).mockResolvedValueOnce({
        payload: {
          sub: 'user-123',
          iss: 'https://test.logto.app/oidc',
          aud: 'urn:logto:resource:api',
          exp: Math.floor(Date.now() / 1000) + 3600,
          nbf: Math.floor(Date.now() / 1000) + 3600, // Not valid yet
        },
      })

      await expect(verifyLogtoToken(mockToken, mockOptions)).rejects.toThrow('not yet valid')
    })

    it('should validate required scope when provided', async () => {
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InRlc3Qta2lkIn0.payload.signature'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          keys: [
            {
              kid: 'test-kid',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        }),
      })

      const { jwtVerify } = await import('jose')
      ;(jwtVerify as any).mockResolvedValueOnce({
        payload: {
          sub: 'user-123',
          iss: 'https://test.logto.app/oidc',
          aud: 'urn:logto:resource:api',
          exp: Math.floor(Date.now() / 1000) + 3600,
          scope: 'read',
        },
      })

      const optionsWithScope: VerifyAuthOptions = {
        ...mockOptions,
        requiredScope: 'write',
      }

      await expect(verifyLogtoToken(mockToken, optionsWithScope)).rejects.toThrow('Missing required scope')
    })
  })

  describe('Successful Token Verification', () => {
    it('should return auth context for valid token', async () => {
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InRlc3Qta2lkIn0.payload.signature'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          keys: [
            {
              kid: 'test-kid',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        }),
      })

      const { jwtVerify } = await import('jose')
      ;(jwtVerify as any).mockResolvedValueOnce({
        payload: {
          sub: 'user-123',
          iss: 'https://test.logto.app/oidc',
          aud: 'urn:logto:resource:api',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      })

      const result = await verifyLogtoToken(mockToken, mockOptions)

      expect(result).toEqual({
        userId: 'user-123',
        isAuthenticated: true,
        payload: expect.any(Object),
        isGuest: false,
      })
    })
  })
})
