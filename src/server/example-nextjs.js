// Example Next.js API route using @ouim/logto-authkit/server
// app/api/protected/route.js

import { verifyNextAuth } from '@ouim/logto-authkit/server'

export async function GET(request) {
  const authResult = await verifyNextAuth(request, {
    logtoUrl: process.env.LOGTO_URL || 'https://your-logto-domain.com',
    audience: process.env.LOGTO_AUDIENCE || 'your-api-resource-identifier',
    cookieName: 'logto_authtoken',
    requiredScope: 'read:profile', // optional
  })

  if (!authResult.success) {
    return Response.json({ error: 'Unauthorized', message: authResult.error }, { status: 401 })
  }

  return Response.json({
    message: 'Hello authenticated user!',
    userId: authResult.auth.userId,
    isAuthenticated: authResult.auth.isAuthenticated,
    scopes: authResult.auth.payload.scope,
    fullPayload: authResult.auth.payload,
  })
}

export async function POST(request) {
  const authResult = await verifyNextAuth(request, {
    logtoUrl: process.env.LOGTO_URL || 'https://your-logto-domain.com',
    audience: process.env.LOGTO_AUDIENCE || 'your-api-resource-identifier',
    requiredScope: 'write:data',
  })

  if (!authResult.success) {
    return Response.json({ error: 'Unauthorized', message: authResult.error }, { status: 401 })
  }

  const body = await request.json()

  // Process the request with authenticated user
  return Response.json({
    message: 'Data created successfully',
    userId: authResult.auth.userId,
    data: body,
  })
}
