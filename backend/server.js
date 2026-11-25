require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const http = require('http')
const { Server } = require('socket.io')

const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const bloodRequestRoutes = require('./routes/bloodRequestRoutes')
const chatRoutes = require('./routes/chatRoutes')
const initializeChatSocket = require('./socket/chatSocket')
const notificationRoutes = require('./routes/notificationRoutes')

// Stop immediately if the JWT secret is missing
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Server cannot start.')
  process.exit(1)
}

const app = express()
const server = http.createServer(app)

// Allowed frontend addresses (comma-separated list in CLIENT_URL for deployment)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    // No origin = tools like Postman or same-origin requests
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    const error = new Error('Origin not allowed')
    error.isCorsError = true
    return callback(error)
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e5
})

// Behind a hosting proxy (production), trust the first proxy so
// rate limiting sees the real visitor IP
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

app.disable('x-powered-by')
app.use(helmet())
app.use(cors(corsOptions))

// General limit for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' }
})

// Stricter limit for login and register (only failed attempts count)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' }
})

app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter)

app.use(express.json({ limit: '10kb' }))

app.get('/', (req, res) => {
  res.send('RaktConnect Backend is Running!')
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/requests', bloodRequestRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/notifications', notificationRoutes)

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' })
})

// Global error handler (must have 4 parameters)
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  if (err.isCorsError) {
    return res.status(403).json({ message: 'Origin not allowed.' })
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body.' })
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large.' })
  }

  console.error('UNHANDLED ERROR:', err.message)
  return res.status(500).json({
    message: 'Something went wrong. Please try again.'
  })
})

initializeChatSocket(io)

app.set('io', io)

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch(error => {
    console.error('Database connection failed:', error.message)
    process.exit(1)
  })