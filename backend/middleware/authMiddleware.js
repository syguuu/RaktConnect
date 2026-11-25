const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing')
      return res.status(500).json({ message: 'Server configuration error.' })
    }

    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized. Please log in.' })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is missing.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    })

    if (!decoded.id || typeof decoded.id !== 'string') {
      return res.status(401).json({ message: 'Invalid authentication token.' })
    }

    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({ message: 'User account not found.' })
    }

    req.user = user
    next()
  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({ message: 'Invalid or expired authentication token.' })
    }

    console.error('Authentication error:', error.message)
    return res.status(500).json({ message: 'Authentication failed.' })
  }
}

const authorizeRoles = (...roles) => {
  const allowedRoles = roles.flat()

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Please log in first.' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' })
    }

    next()
  }
}

module.exports = { protect, authorizeRoles }