// Example Express.js server using @ouim/simple-logto/backend
// Cookies are parsed automatically by the middleware; you no longer need to
// install or provide `cookie-parser` separately.
const express = require('express')
const { createExpressAuthMiddleware } = require('@ouim/simple-logto/backend')

const app = express()
app.use(express.json())

// Create the auth middleware
const authMiddleware = createExpressAuthMiddleware({
  logtoUrl: 'https://your-logto-domain.com',
  audience: 'your-api-resource-identifier',
  cookieName: 'logto_authtoken', // optional
  requiredScope: 'read:profile', // optional
})

// Public route
app.get('/api/public', (req, res) => {
  res.json({ message: 'This is a public endpoint' })
})

// Protected route
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({
    message: 'Hello authenticated user!',
    userId: req.auth.userId,
    isAuthenticated: req.auth.isAuthenticated,
    scopes: req.auth.payload.scope,
  })
})

// Protected route with specific scope
app.get(
  '/api/admin',
  createExpressAuthMiddleware({
    logtoUrl: 'https://your-logto-domain.com',
    audience: 'your-api-resource-identifier',
    requiredScope: 'admin:access',
  }),
  (req, res) => {
    res.json({
      message: 'Admin access granted!',
      userId: req.auth.userId,
    })
  },
)

app.listen(3001, () => {
  console.log('Server running on port 3001')
})
