
const express = require('express')
const router = express.Router()

const {
  getMyChatConversations,
  getChatMessages,
  sendChatMessage
} = require('../controllers/chatController')

const { protect } = require('../middleware/authMiddleware')

// GET USER CONVERSATIONS
router.get(
  '/conversations',
  protect,
  getMyChatConversations
)

// GET CHAT HISTORY
router.get(
  '/:bloodRequestId/:otherUserId',
  protect,
  getChatMessages
)

// SEND MESSAGE
router.post(
  '/:bloodRequestId/:otherUserId',
  protect,
  sendChatMessage
)

module.exports = router
