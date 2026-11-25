
const mongoose = require('mongoose')
const ChatMessage = require('../models/ChatMessage')
const BloodRequest = require('../models/BloodRequest')

async function checkChatAccess(bloodRequestId, userId, otherUserId) {
  if (
    !mongoose.Types.ObjectId.isValid(bloodRequestId) ||
    !mongoose.Types.ObjectId.isValid(otherUserId)
  ) {
    return null
  }

  const request = await BloodRequest.findById(bloodRequestId)

  if (!request || !request.requester) return null

  const currentId = userId.toString()
  const requesterId = request.requester.toString()
  const otherId = otherUserId.toString()

  if (currentId === otherId) return null

  const currentIsRequester = currentId === requesterId
  const otherIsRequester = otherId === requesterId

  const currentIsAcceptedDonor = request.donorResponses.some(
    item =>
      item.response === 'Accepted' &&
      item.donor &&
      item.donor.toString() === currentId
  )

  const otherIsAcceptedDonor = request.donorResponses.some(
    item =>
      item.response === 'Accepted' &&
      item.donor &&
      item.donor.toString() === otherId
  )

  if (
    (currentIsRequester && otherIsAcceptedDonor) ||
    (currentIsAcceptedDonor && otherIsRequester)
  ) {
    return request
  }

  return null
}

function getRoomId(bloodRequestId, userId, otherUserId) {
  const users = [userId.toString(), otherUserId.toString()].sort()
  return `${bloodRequestId}_${users.join('_')}`
}


// GET AVAILABLE CONVERSATIONS
const getMyChatConversations = async (req, res) => {
  try {
    let requests

    if (req.user.role === 'requester') {
      requests = await BloodRequest.find({
        requester: req.user._id,
        'donorResponses.response': 'Accepted'
      })
        .populate('donorResponses.donor', 'fullName')
        .sort({ updatedAt: -1 })

    } else if (req.user.role === 'donor') {
      requests = await BloodRequest.find({
        'donorResponses.donor': req.user._id,
        'donorResponses.response': 'Accepted'
      })
        .populate('requester', 'fullName')
        .populate('donorResponses.donor', 'fullName')
        .sort({ updatedAt: -1 })

    } else {
      return res.status(403).json({
        message: 'Admins cannot access user conversations.'
      })
    }

    const conversations = []

    for (const request of requests) {
      if (!request.requester) continue

      const acceptedDonors = request.donorResponses.filter(
        item => item.response === 'Accepted' && item.donor
      )

      for (const item of acceptedDonors) {
        if (
          req.user.role === 'donor' &&
          item.donor._id.toString() !== req.user._id.toString()
        ) {
          continue
        }

        const otherUser = req.user.role === 'requester'
          ? item.donor
          : request.requester

        if (!otherUser) continue

        conversations.push({
          bloodRequestId: request._id,
          otherUserId: otherUser._id,
          otherUserName: otherUser.fullName,
          patientName: request.patientName,
          bloodGroup: request.bloodGroup,
          hospitalName: request.hospitalName
        })
      }
    }

    return res.status(200).json({
      count: conversations.length,
      conversations
    })

  } catch (error) {
    console.error('Get conversations error:', error.message)

    return res.status(500).json({
      message: 'Unable to fetch conversations.'
    })
  }
}


// GET CHAT MESSAGES
const getChatMessages = async (req, res) => {
  try {
    const { bloodRequestId, otherUserId } = req.params

    const request = await checkChatAccess(
      bloodRequestId,
      req.user._id,
      otherUserId
    )

    if (!request) {
      return res.status(403).json({
        message: 'You are not allowed to access this conversation.'
      })
    }

    const messages = await ChatMessage.find({
      bloodRequest: bloodRequestId,
      $or: [
        { sender: req.user._id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user._id }
      ]
    })
      .populate('sender', 'fullName')
      .sort({ createdAt: 1 })

    return res.status(200).json({
      count: messages.length,
      messages
    })

  } catch (error) {
    console.error('Get chat messages error:', error.message)

    return res.status(500).json({
      message: 'Unable to fetch messages.'
    })
  }
}


// SEND AND BROADCAST MESSAGE
const sendChatMessage = async (req, res) => {
  try {
    const { bloodRequestId, otherUserId } = req.params
    const { message } = req.body

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        message: 'Message cannot be empty.'
      })
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        message: 'Message cannot exceed 2000 characters.'
      })
    }

    const request = await checkChatAccess(
      bloodRequestId,
      req.user._id,
      otherUserId
    )

    if (!request) {
      return res.status(403).json({
        message: 'You are not allowed to message this user.'
      })
    }

    const newMessage = await ChatMessage.create({
      bloodRequest: bloodRequestId,
      sender: req.user._id,
      recipient: otherUserId,
      message: message.trim()
    })

    await newMessage.populate('sender', 'fullName')

    const roomId = getRoomId(
      bloodRequestId,
      req.user._id,
      otherUserId
    )

    const io = req.app.get('io')

    if (io) {
      io.to(roomId).emit('receiveMessage', newMessage)
    }

    return res.status(201).json({
      message: 'Message sent successfully!',
      chatMessage: newMessage
    })

  } catch (error) {
    console.error('Send chat message error:', error.message)

    return res.status(500).json({
      message: 'Unable to send message.'
    })
  }
}


module.exports = {
  getMyChatConversations,
  getChatMessages,
  sendChatMessage
}
