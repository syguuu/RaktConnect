
const mongoose = require('mongoose')

const donationConfirmationSchema = new mongoose.Schema(
  {
    bloodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      required: true,
      unique: true
    },

    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    donorConfirmation: {
      type: String,
      enum: ['Pending', 'Donation Completed', 'Donation Did Not Occur'],
      default: 'Pending'
    },

    requesterConfirmation: {
      type: String,
      enum: ['Pending', 'Donation Completed', 'Donation Did Not Occur'],
      default: 'Pending'
    },

    adminStatus: {
      type: String,
      enum: ['Pending Review', 'Under Review', 'Confirmed', 'Discrepancy — Investigate'],
      default: 'Pending Review'
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model(
  'DonationConfirmation',
  donationConfirmationSchema
)
