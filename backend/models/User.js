
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['donor', 'requester', 'admin'],
      required: true
    },

    location: {
      type: String,
      required: true
    },

    pinCode: {
      type: String,
      required: true
    },

    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: ''
    },

    availability: {
      type: String,
      enum: ['Active', 'Inactive', 'Temporarily Unavailable'],
      default: 'Inactive'
    },

    verificationStatus: {
      type: String,
      enum: ['Pending', 'Under Review', 'Verified', 'Rejected'],
      default: 'Pending'
    },

    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('User', userSchema)
