
const mongoose = require('mongoose')

const bloodRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    patientName: {
      type: String,
      required: true
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },

    bloodComponent: {
      type: String,
      required: true
    },

    units: {
      type: Number,
      required: true,
      min: 1
    },

    hospitalName: {
      type: String,
      required: true
    },

    hospitalLocation: {
      type: String,
      required: true
    },

    requiredDate: {
      type: Date,
      required: true
    },

    urgency: {
      type: String,
      enum: ['Normal', 'Urgent', 'Emergency'],
      required: true
    },

    hospitalDocument: {
      type: String,
      default: ''
    },

    status: {
      type: String,
      enum: [
        'Submitted',
        'Pending Review',
        'Under Review',
        'Approved',
        'Rejected',
        'Fulfilled',
        'Cancelled',
        'Expired'
      ],
      default: 'Pending Review'
    },

    donorResponses: [
      {
        donor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        response: {
          type: String,
          enum: ['Accepted', 'Declined'],
          required: true
        },
        respondedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('BloodRequest', bloodRequestSchema)
