
const express = require('express')
const router = express.Router()

const {
  createBloodRequest,
  getMyBloodRequests,
  getAllBloodRequests,
  updateBloodRequestStatus,
  getAllDonationConfirmations,
  updateDonationConfirmationStatus,
  getDonorBloodRequests,
  respondToBloodRequest,
  getAcceptedDonorRequests,
  submitDonorConfirmation,
  submitRequesterConfirmation
} = require('../controllers/bloodRequestController')

const { protect } = require('../middleware/authMiddleware')
const { authorizeRoles } = require('../middleware/roleMiddleware')

// Requester routes
router.post('/', protect, authorizeRoles('requester'), createBloodRequest)
router.get('/my-requests', protect, authorizeRoles('requester'), getMyBloodRequests)

// Donor routes
router.get('/donor/incoming', protect, authorizeRoles('donor'), getDonorBloodRequests)
router.get('/donor/accepted', protect, authorizeRoles('donor'), getAcceptedDonorRequests)

router.patch('/donor/:id/respond', protect, authorizeRoles('donor'), respondToBloodRequest)
router.patch('/donor/:id/confirmation', protect, authorizeRoles('donor'), submitDonorConfirmation)

// Requester confirmation
router.patch('/requester/:id/confirmation', protect, authorizeRoles('requester'), submitRequesterConfirmation)

// Admin routes
router.get('/admin/all', protect, authorizeRoles('admin'), getAllBloodRequests)
router.patch('/admin/:id/status', protect, authorizeRoles('admin'), updateBloodRequestStatus)

router.get('/admin/confirmations', protect, authorizeRoles('admin'), getAllDonationConfirmations)
router.patch('/admin/confirmations/:id/status', protect, authorizeRoles('admin'), updateDonationConfirmationStatus)

module.exports = router
