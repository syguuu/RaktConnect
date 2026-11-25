
const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    type: {
      type: String,
      enum: [
        'NEW_REQUEST',
        'DONOR_RESPONSE',
        'REQUEST_STATUS',
        'DONOR_CONFIRMATION',
        'REQUESTER_CONFIRMATION',
        'CONFIRMATION_REVIEW'
      ],
      required: true
    },

    title: {
      type: String,
      required: true,
      maxlength: 100
    },

    message: {
      type: String,
      required: true,
      maxlength: 300
    },

    relatedBloodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      default: null
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

notificationSchema.index({ recipient: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
