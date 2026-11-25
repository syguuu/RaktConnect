const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../models/User')
const BloodRequest = require('../models/BloodRequest')
const ChatMessage = require('../models/ChatMessage')

const MAX_MESSAGE_LENGTH = 2000

const MESSAGE_LIMIT = 20
const JOIN_LIMIT = 30
const LIMIT_WINDOW_MS = 10 * 1000

// Simple per-connection limiter: allows `limit` actions per time window
const createLimiter = (limit, windowMs) => {
  let times = []

  return () => {
    const now = Date.now()
    times = times.filter(time => now - time < windowMs)

    if (times.length >= limit) {
      return true
    }

    times.push(now)
    return false
  }
}

// Checks that the logged-in user may chat with the other user about this request.
// Allowed only between the requester and a donor who ACCEPTED the request.
// Returns the room ID if allowed, otherwise null.
const getAllowedRoomId = async (user, bloodRequestId, otherUserId) => {
  if (
    typeof bloodRequestId !== 'string' ||
    typeof otherUserId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(bloodRequestId) ||
    !mongoose.Types.ObjectId.isValid(otherUserId)
  ) {
    return null
  }

  const request = await BloodRequest.findById(bloodRequestId)

  if (!request) return null

  const currentUserId = user._id.toString()
  const requesterId = request.requester.toString()
  const otherId = otherUserId

  const currentIsRequester = currentUserId === requesterId

  const currentIsAcceptedDonor = request.donorResponses.some(
    item =>
      item.response === 'Accepted' &&
      item.donor.toString() === currentUserId
  )

  const otherIsAcceptedDonor = request.donorResponses.some(
    item =>
      item.response === 'Accepted' &&
      item.donor.toString() === otherId
  )

  const otherIsRequester = otherId === requesterId

  const allowed =
    (currentIsRequester && otherIsAcceptedDonor) ||
    (currentIsAcceptedDonor && otherIsRequester)

  if (!allowed) return null

  // Use the real database ID so both people always get the same room name
  return `${request._id.toString()}_${[currentUserId, otherId].sort().join('_')}`
}

function initializeChatSocket(io) {
  // Authenticate every socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication required.'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256']
      })

      if (!decoded.id || typeof decoded.id !== 'string') {
        return next(new Error('Invalid or expired token.'))
      }

      const user = await User.findById(decoded.id).select('-password')

      if (!user) {
        return next(new Error('User not found.'))
      }

      socket.user = user
      next()

    } catch (error) {
      next(new Error('Invalid or expired token.'))
    }
  })

  io.on('connection', (socket) => {
    console.log('Authenticated chat user connected:', socket.user._id)

    const isJoinLimited = createLimiter(JOIN_LIMIT, LIMIT_WINDOW_MS)
    const isMessageLimited = createLimiter(MESSAGE_LIMIT, LIMIT_WINDOW_MS)

    // Join a conversation after checking access
    socket.on('joinRoom', async (data) => {
      try {
        if (isJoinLimited()) return

        const { bloodRequestId, otherUserId } = data || {}

        const roomId = await getAllowedRoomId(
          socket.user,
          bloodRequestId,
          otherUserId
        )

        if (!roomId) return

        socket.join(roomId)

        socket.emit('roomJoined', { roomId })

      } catch (error) {
        console.error('Chat room error:', error.message)
      }
    })

    // Save and broadcast messages
    socket.on('sendMessage', async (data) => {
      try {
        if (isMessageLimited()) return

        const { bloodRequestId, otherUserId, message } = data || {}

        if (
          typeof message !== 'string' ||
          !message.trim() ||
          message.trim().length > MAX_MESSAGE_LENGTH
        ) {
          return
        }

        const roomId = await getAllowedRoomId(
          socket.user,
          bloodRequestId,
          otherUserId
        )

        if (!roomId) return

        // The user must have joined this room first
        if (!socket.rooms.has(roomId)) return

        const savedMessage = await ChatMessage.create({
          bloodRequest: bloodRequestId,
          sender: socket.user._id,
          recipient: otherUserId,
          message: message.trim()
        })

        await savedMessage.populate('sender', 'fullName')

        io.to(roomId).emit('receiveMessage', savedMessage)

      } catch (error) {
        console.error('Message error:', error.message)
      }
    })

    socket.on('disconnect', () => {
      console.log('Chat user disconnected:', socket.user._id)
    })
  })
}

module.exports = initializeChatSocket