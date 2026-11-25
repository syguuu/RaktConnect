
const mongoose = require('mongoose')

const chatMessageSchema = new mongoose.Schema(
  {
    bloodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      required: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('ChatMessage', chatMessageSchema)
