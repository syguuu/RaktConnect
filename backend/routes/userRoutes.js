
const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const { protect } = require('../middleware/authMiddleware')
const { authorizeRoles } = require('../middleware/roleMiddleware')
const User = require('../models/User')

const allowedBloodGroups = [
  'A+', 'A-', 'B+', 'B-',
  'AB+', 'AB-', 'O+', 'O-'
]

const allowedVerificationStatuses = [
  'Pending',
  'Under Review',
  'Verified',
  'Rejected'
]

const allowedAvailability = [
  'Active',
  'Inactive',
  'Temporarily Unavailable'
]

// Get logged-in user's information
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    message: 'User authenticated successfully!',
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      location: req.user.location,
      pinCode: req.user.pinCode,
      bloodGroup: req.user.bloodGroup,
      availability: req.user.availability,
      verificationStatus: req.user.verificationStatus
    }
  })
})

// Search available donors
router.get(
  '/search',
  protect,
  authorizeRoles('requester'),
  async (req, res) => {
    try {
      const { bloodGroup, location, pinCode } = req.query

      if (!bloodGroup && !location && !pinCode) {
        return res.status(400).json({
          message: 'Please enter at least one search filter.'
        })
      }

      if (bloodGroup && !allowedBloodGroups.includes(bloodGroup)) {
        return res.status(400).json({
          message: 'Invalid blood group.'
        })
      }

      if (location && (
        typeof location !== 'string' ||
        !location.trim() ||
        location.trim().length > 100
      )) {
        return res.status(400).json({
          message: 'Please enter a valid location.'
        })
      }

      if (pinCode && !/^[0-9]{6}$/.test(pinCode)) {
        return res.status(400).json({
          message: 'PIN code must contain exactly 6 digits.'
        })
      }

      const searchFilters = {
        role: 'donor',
        availability: 'Active'
      }

      if (bloodGroup) {
        searchFilters.bloodGroup = bloodGroup
      }

      if (location) {
        const escapedLocation = location.trim().replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )

        searchFilters.location = {
          $regex: escapedLocation,
          $options: 'i'
        }
      }

      if (pinCode) {
        searchFilters.pinCode = pinCode
      }

      const donors = await User.find(searchFilters)
        .select('fullName bloodGroup location availability verificationStatus lastActive')
        .sort({ lastActive: -1 })

      return res.status(200).json({
        count: donors.length,
        donors
      })

    } catch (error) {
      console.error('Donor search error:', error.message)

      return res.status(500).json({
        message: 'Unable to search for donors.'
      })
    }
  }
)

// ADMIN: Get all registered donors
router.get(
  '/admin/donors',
  protect,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const donors = await User.find({ role: 'donor' })
        .select('fullName email phone location pinCode bloodGroup availability verificationStatus lastActive createdAt')
        .sort({ createdAt: -1 })

      return res.status(200).json({
        count: donors.length,
        donors
      })

    } catch (error) {
      console.error('Fetch donors error:', error.message)

      return res.status(500).json({
        message: 'Unable to fetch donor accounts.'
      })
    }
  }
)

// ADMIN: Update donor verification status
router.patch(
  '/admin/:id/verification',
  protect,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const { id } = req.params
      const { verificationStatus } = req.body

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: 'Invalid donor ID.'
        })
      }

      if (!allowedVerificationStatuses.includes(verificationStatus)) {
        return res.status(400).json({
          message: 'Invalid verification status.'
        })
      }

      const donor = await User.findOneAndUpdate(
        { _id: id, role: 'donor' },
        { verificationStatus },
        { new: true, runValidators: true }
      ).select('-password')

      if (!donor) {
        return res.status(404).json({
          message: 'Donor not found.'
        })
      }

      return res.status(200).json({
        message: 'Donor review status updated successfully!',
        donor
      })

    } catch (error) {
      console.error('Donor verification error:', error.message)

      return res.status(500).json({
        message: 'Unable to update donor review status.'
      })
    }
  }
)

// ADMIN: Get all registered requesters
router.get(
  '/admin/requesters',
  protect,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const requesters = await User.find({ role: 'requester' })
        .select('fullName email phone location pinCode verificationStatus createdAt')
        .sort({ createdAt: -1 })

      return res.status(200).json({
        count: requesters.length,
        requesters
      })

    } catch (error) {
      console.error('Fetch requesters error:', error.message)

      return res.status(500).json({
        message: 'Unable to fetch requester accounts.'
      })
    }
  }
)

// ADMIN: Update requester verification status
router.patch(
  '/admin/requesters/:id/verification',
  protect,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const { id } = req.params
      const { verificationStatus } = req.body

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: 'Invalid requester ID.'
        })
      }

      if (!allowedVerificationStatuses.includes(verificationStatus)) {
        return res.status(400).json({
          message: 'Invalid verification status.'
        })
      }

      const requester = await User.findOneAndUpdate(
        { _id: id, role: 'requester' },
        { verificationStatus },
        { new: true, runValidators: true }
      ).select('-password')

      if (!requester) {
        return res.status(404).json({
          message: 'Requester not found.'
        })
      }

      return res.status(200).json({
        message: 'Requester review status updated successfully!',
        requester
      })

    } catch (error) {
      console.error('Requester verification error:', error.message)

      return res.status(500).json({
        message: 'Unable to update requester review status.'
      })
    }
  }
)

// Update donor availability
router.patch(
  '/availability',
  protect,
  authorizeRoles('donor'),
  async (req, res) => {
    try {
      const { availability } = req.body

      if (!allowedAvailability.includes(availability)) {
        return res.status(400).json({
          message: 'Please select a valid availability status.'
        })
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { availability, lastActive: new Date() },
        { new: true, runValidators: true }
      )

      if (!updatedUser) {
        return res.status(404).json({
          message: 'User account not found.'
        })
      }

      return res.status(200).json({
        message: 'Availability updated successfully!',
        availability: updatedUser.availability
      })

    } catch (error) {
      console.error('Availability update error:', error.message)

      return res.status(500).json({
        message: 'Unable to update availability.'
      })
    }
  }
)

// Update donor profile
router.patch(
  '/profile',
  protect,
  authorizeRoles('donor'),
  async (req, res) => {
    try {
      const {
        fullName,
        phone,
        location,
        pinCode,
        bloodGroup,
        availability
      } = req.body

      if (
        typeof fullName !== 'string' ||
        !fullName.trim() ||
        typeof phone !== 'string' ||
        typeof location !== 'string' ||
        !location.trim() ||
        typeof pinCode !== 'string' ||
        typeof bloodGroup !== 'string'
      ) {
        return res.status(400).json({
          message: 'Please fill in all required profile fields.'
        })
      }

      if (fullName.trim().length > 100 || location.trim().length > 100) {
        return res.status(400).json({
          message: 'Name or location is too long.'
        })
      }

      if (!/^[0-9]{6}$/.test(pinCode)) {
        return res.status(400).json({
          message: 'PIN code must contain exactly 6 digits.'
        })
      }

      if (!/^[0-9]{10}$/.test(phone.trim())) {
        return res.status(400).json({
          message: 'Phone number must contain exactly 10 digits.'
        })
      }

      if (!allowedBloodGroups.includes(bloodGroup)) {
        return res.status(400).json({
          message: 'Please select a valid blood group.'
        })
      }

      if (
        availability !== undefined &&
        !allowedAvailability.includes(availability)
      ) {
        return res.status(400).json({
          message: 'Please select a valid availability status.'
        })
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          location: location.trim(),
          pinCode,
          bloodGroup,
          ...(availability ? { availability } : {})
        },
        {
          new: true,
          runValidators: true
        }
      )

      if (!updatedUser) {
        return res.status(404).json({
          message: 'User account not found.'
        })
      }

      return res.status(200).json({
        message: 'Donor profile updated successfully!',
        user: {
          id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          location: updatedUser.location,
          pinCode: updatedUser.pinCode,
          bloodGroup: updatedUser.bloodGroup,
          availability: updatedUser.availability,
          verificationStatus: updatedUser.verificationStatus
        }
      })

    } catch (error) {
      console.error('Profile update error:', error.message)

      return res.status(500).json({
        message: 'Unable to update donor profile.'
      })
    }
  }
)

// Admin-only test route
router.get(
  '/admin-test',
  protect,
  authorizeRoles('admin'),
  (req, res) => {
    return res.status(200).json({
      message: 'Admin access granted!'
    })
  }
)

module.exports = router
