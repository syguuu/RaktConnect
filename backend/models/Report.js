
const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    bloodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      default: null
    },

    reportType: {
      type: String,
      enum: [
        'Suspicious Account',
        'Fake Blood Request',
        'Inappropriate Messages',
        'Other'
      ],
      required: true
    },

    description: {
      type: String,
      required: true,
      maxlength: 2000
    },

    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Resolved', 'Dismissed'],
      default: 'Pending'
    },

    adminNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Report', reportSchema)
