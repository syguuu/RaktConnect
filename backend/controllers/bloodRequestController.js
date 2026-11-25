
const mongoose = require('mongoose')
const BloodRequest = require('../models/BloodRequest')
const DonationConfirmation = require('../models/DonationConfirmation')
const {
  createNotification,
  notifyAdmins
} = require('../utils/createNotification')

const MAX_UNITS = 20
const MAX_PATIENT_NAME_LENGTH = 100
const MAX_HOSPITAL_NAME_LENGTH = 150
const MAX_HOSPITAL_LOCATION_LENGTH = 200

const isNonEmptyString = value =>
  typeof value === 'string' && value.trim().length > 0

const keepOnlyMyResponse = (requestDoc, userId) => {
  const plain = requestDoc.toJSON()

  plain.donorResponses = (plain.donorResponses || []).filter(item => {
    const donorId = item.donor && item.donor._id
      ? item.donor._id
      : item.donor

    return String(donorId) === String(userId)
  })

  return plain
}

const sendConfirmationError = (res, error, logLabel, fallbackMessage) => {
  console.error(logLabel, error)

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Please select a valid confirmation.'
    })
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: 'A confirmation for this request already exists. Please try again.'
    })
  }

  return res.status(500).json({
    message: fallbackMessage
  })
}


// CREATE BLOOD REQUEST
const createBloodRequest = async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      bloodComponent,
      units,
      hospitalName,
      hospitalLocation,
      requiredDate,
      urgency
    } = req.body

    if (
      !isNonEmptyString(patientName) ||
      !isNonEmptyString(bloodGroup) ||
      !isNonEmptyString(bloodComponent) ||
      units === undefined ||
      units === null ||
      units === '' ||
      !isNonEmptyString(hospitalName) ||
      !isNonEmptyString(hospitalLocation) ||
      !isNonEmptyString(requiredDate) ||
      !isNonEmptyString(urgency)
    ) {
      return res.status(400).json({
        message: 'Please fill in all required fields.'
      })
    }

    const cleanPatientName = patientName.trim()
    const cleanBloodGroup = bloodGroup.trim()
    const cleanBloodComponent = bloodComponent.trim()
    const cleanHospitalName = hospitalName.trim()
    const cleanHospitalLocation = hospitalLocation.trim()
    const cleanUrgency = urgency.trim()

    if (cleanPatientName.length > MAX_PATIENT_NAME_LENGTH) {
      return res.status(400).json({
        message: `Patient name must be ${MAX_PATIENT_NAME_LENGTH} characters or less.`
      })
    }

    if (cleanHospitalName.length > MAX_HOSPITAL_NAME_LENGTH) {
      return res.status(400).json({
        message: `Hospital name must be ${MAX_HOSPITAL_NAME_LENGTH} characters or less.`
      })
    }

    if (cleanHospitalLocation.length > MAX_HOSPITAL_LOCATION_LENGTH) {
      return res.status(400).json({
        message: `Hospital location must be ${MAX_HOSPITAL_LOCATION_LENGTH} characters or less.`
      })
    }

    const unitsNumber = Number(units)

    if (
      !Number.isInteger(unitsNumber) ||
      unitsNumber < 1 ||
      unitsNumber > MAX_UNITS
    ) {
      return res.status(400).json({
        message: `Units must be a whole number between 1 and ${MAX_UNITS}.`
      })
    }

    const parsedDate = new Date(requiredDate)

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: 'Please enter a valid required date.'
      })
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    if (parsedDate < oneDayAgo) {
      return res.status(400).json({
        message: 'Required date cannot be in the past.'
      })
    }

    const newRequest = await BloodRequest.create({
      requester: req.user._id,
      patientName: cleanPatientName,
      bloodGroup: cleanBloodGroup,
      bloodComponent: cleanBloodComponent,
      units: unitsNumber,
      hospitalName: cleanHospitalName,
      hospitalLocation: cleanHospitalLocation,
      requiredDate: parsedDate,
      urgency: cleanUrgency,
      status: 'Pending Review'
    })

    await notifyAdmins({
      actor: req.user._id,
      type: 'NEW_REQUEST',
      title: 'New blood request',
      message: 'A new blood request has been submitted for review.',
      relatedBloodRequest: newRequest._id
    })

    return res.status(201).json({
      message: 'Blood request submitted successfully!',
      request: newRequest
    })
  } catch (error) {
    console.error('CREATE REQUEST ERROR:', error)

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Please check the blood request details and try again.'
      })
    }

    return res.status(500).json({
      message: 'Unable to submit blood request.'
    })
  }
}


// GET REQUESTS OF LOGGED-IN REQUESTER
const getMyBloodRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({
      requester: req.user._id
    })
      .populate('donorResponses.donor', 'fullName')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      count: requests.length,
      requests
    })
  } catch (error) {
    console.error('GET MY REQUESTS ERROR:', error)

    return res.status(500).json({
      message: 'Unable to fetch your blood requests.'
    })
  }
}


// ADMIN: GET ALL BLOOD REQUESTS
const getAllBloodRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate('requester', 'fullName email phone')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      count: requests.length,
      requests
    })
  } catch (error) {
    console.error('GET ALL REQUESTS ERROR:', error)

    return res.status(500).json({
      message: 'Unable to fetch all blood requests.'
    })
  }
}


// ADMIN: UPDATE BLOOD REQUEST STATUS
const updateBloodRequestStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowedStatuses = [
      'Pending Review',
      'Under Review',
      'Approved',
      'Rejected',
      'Fulfilled',
      'Cancelled',
      'Expired'
    ]

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid blood request ID.'
      })
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid request status.'
      })
    }

    const request = await BloodRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )

    if (!request) {
      return res.status(404).json({
        message: 'Blood request not found.'
      })
    }

    await createNotification({
      recipient: request.requester,
      actor: req.user._id,
      type: 'REQUEST_STATUS',
      title: 'Blood request status updated',
      message: `Your blood request status is now: ${status}.`,
      relatedBloodRequest: request._id
    })

    return res.status(200).json({
      message: 'Blood request status updated successfully!',
      request
    })
  } catch (error) {
    console.error('UPDATE REQUEST STATUS ERROR:', error)

    return res.status(500).json({
      message: 'Unable to update blood request status.'
    })
  }
}


// ADMIN: GET ALL DONATION CONFIRMATIONS
const getAllDonationConfirmations = async (req, res) => {
  try {
    const confirmations = await DonationConfirmation.find()
      .populate('donor', 'fullName email phone')
      .populate('requester', 'fullName email phone')
      .populate(
        'bloodRequest',
        'patientName bloodGroup hospitalName hospitalLocation requiredDate'
      )
      .sort({ createdAt: -1 })

    return res.status(200).json({
      count: confirmations.length,
      confirmations
    })
  } catch (error) {
    console.error('GET CONFIRMATIONS ERROR:', error)

    return res.status(500).json({
      message: 'Unable to fetch donation confirmations.'
    })
  }
}


// ADMIN: UPDATE DONATION CONFIRMATION REVIEW STATUS
const updateDonationConfirmationStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { adminStatus } = req.body

    const allowedStatuses = [
      'Pending Review',
      'Under Review',
      'Confirmed',
      'Discrepancy — Investigate'
    ]

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid confirmation ID.'
      })
    }

    if (!allowedStatuses.includes(adminStatus)) {
      return res.status(400).json({
        message: 'Invalid confirmation review status.'
      })
    }

    const confirmation = await DonationConfirmation.findByIdAndUpdate(
      id,
      { adminStatus },
      { new: true, runValidators: true }
    )
      .populate('donor', 'fullName')
      .populate('requester', 'fullName')
      .populate('bloodRequest', 'patientName bloodGroup hospitalName')

    if (!confirmation) {
      return res.status(404).json({
        message: 'Donation confirmation not found.'
      })
    }

    const reviewMessage = `The donation confirmation review status is now: ${adminStatus}.`

    await Promise.all([
      createNotification({
        recipient: confirmation.donor._id,
        actor: req.user._id,
        type: 'CONFIRMATION_REVIEW',
        title: 'Confirmation review updated',
        message: reviewMessage,
        relatedBloodRequest: confirmation.bloodRequest._id
      }),
      createNotification({
        recipient: confirmation.requester._id,
        actor: req.user._id,
        type: 'CONFIRMATION_REVIEW',
        title: 'Confirmation review updated',
        message: reviewMessage,
        relatedBloodRequest: confirmation.bloodRequest._id
      })
    ])

    return res.status(200).json({
      message: 'Donation confirmation status updated successfully!',
      confirmation
    })
  } catch (error) {
    console.error('UPDATE CONFIRMATION STATUS ERROR:', error)

    return res.status(500).json({
      message: 'Unable to update donation confirmation status.'
    })
  }
}


// DONOR: GET MATCHING APPROVED BLOOD REQUESTS
const getDonorBloodRequests = async (req, res) => {
  try {
    const donor = req.user

    if (!donor.bloodGroup) {
      return res.status(200).json({
        count: 0,
        requests: []
      })
    }

    const requests = await BloodRequest.find({
      status: 'Approved',
      bloodGroup: donor.bloodGroup,
      'donorResponses.donor': { $ne: donor._id }
    })
      .populate('requester', 'fullName')
      .sort({ requiredDate: 1 })

    const safeRequests = requests.map(item =>
      keepOnlyMyResponse(item, donor._id)
    )

    return res.status(200).json({
      count: safeRequests.length,
      requests: safeRequests
    })
  } catch (error) {
    console.error('GET DONOR REQUESTS ERROR:', error)

    return res.status(500).json({
      message: 'Unable to fetch matching blood requests.'
    })
  }
}


// DONOR: ACCEPT OR DECLINE A BLOOD REQUEST
const respondToBloodRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { response } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid blood request ID.'
      })
    }

    if (!['Accepted', 'Declined'].includes(response)) {
      return res.status(400).json({
        message: 'Please select Accept or Decline.'
      })
    }

    if (!req.user.bloodGroup) {
      return res.status(400).json({
        message: 'Please add your blood group to your profile first.'
      })
    }

    const request = await BloodRequest.findOne({
      _id: id,
      status: 'Approved',
      bloodGroup: req.user.bloodGroup
    })

    if (!request) {
      return res.status(404).json({
        message: 'Approved blood request not found.'
      })
    }

    const existingResponse = request.donorResponses.find(
      item => item.donor.toString() === req.user._id.toString()
    )

    if (existingResponse) {
      return res.status(400).json({
        message: 'You have already responded to this request.'
      })
    }

    const updatedRequest = await BloodRequest.findOneAndUpdate(
      {
        _id: id,
        status: 'Approved',
        'donorResponses.donor': { $ne: req.user._id }
      },
      {
        $push: {
          donorResponses: {
            donor: req.user._id,
            response
          }
        }
      },
      { new: true }
    )

    if (!updatedRequest) {
      return res.status(400).json({
        message: 'You have already responded, or this request is no longer available.'
      })
    }

    await createNotification({
      recipient: updatedRequest.requester,
      actor: req.user._id,
      type: 'DONOR_RESPONSE',
      title: `Donor ${response.toLowerCase()} your request`,
      message: `A donor has ${response.toLowerCase()} your blood request.`,
      relatedBloodRequest: updatedRequest._id
    })

    return res.status(200).json({
      message: `Request ${response.toLowerCase()} successfully!`,
      response
    })
  } catch (error) {
    console.error('RESPOND TO REQUEST ERROR:', error)

    return res.status(500).json({
      message: 'Unable to submit your response.'
    })
  }
}


// DONOR: GET REQUESTS ACCEPTED BY LOGGED-IN DONOR
const getAcceptedDonorRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({
      donorResponses: {
        $elemMatch: {
          donor: req.user._id,
          response: 'Accepted'
        }
      }
    })
      .populate('requester', 'fullName')
      .sort({ updatedAt: -1 })

    const safeRequests = requests.map(item =>
      keepOnlyMyResponse(item, req.user._id)
    )

    return res.status(200).json({
      count: safeRequests.length,
      requests: safeRequests
    })
  } catch (error) {
    console.error('GET ACCEPTED REQUESTS ERROR:', error)

    return res.status(500).json({
      message: 'Unable to fetch your accepted requests.'
    })
  }
}


// DONOR: SUBMIT DONATION CONFIRMATION
const submitDonorConfirmation = async (req, res) => {
  try {
    const { id } = req.params
    const { confirmation } = req.body

    const allowedValues = [
      'Donation Completed',
      'Donation Did Not Occur'
    ]

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid blood request ID.'
      })
    }

    if (!allowedValues.includes(confirmation)) {
      return res.status(400).json({
        message: 'Please select a valid confirmation.'
      })
    }

    const request = await BloodRequest.findById(id)

    if (!request) {
      return res.status(404).json({
        message: 'Blood request not found.'
      })
    }

    const accepted = request.donorResponses.some(
      item =>
        item.donor.toString() === req.user._id.toString() &&
        item.response === 'Accepted'
    )

    if (!accepted) {
      return res.status(403).json({
        message: 'You must have accepted this request to confirm it.'
      })
    }

    let record = await DonationConfirmation.findOne({
      bloodRequest: id
    })

    if (record && record.donor.toString() !== req.user._id.toString()) {
      return res.status(409).json({
        message: 'A confirmation for another donor already exists.'
      })
    }

    if (record && record.adminStatus === 'Confirmed') {
      return res.status(409).json({
        message: 'This donation has already been confirmed by the admin and can no longer be changed.'
      })
    }

    if (!record) {
      record = await DonationConfirmation.create({
        bloodRequest: id,
        donor: req.user._id,
        requester: request.requester,
        donorConfirmation: confirmation
      })
    } else {
      record.donorConfirmation = confirmation
      record.adminStatus = 'Pending Review'
      await record.save()
    }

    await Promise.all([
      createNotification({
        recipient: request.requester,
        actor: req.user._id,
        type: 'DONOR_CONFIRMATION',
        title: 'Donor submitted confirmation',
        message: 'The donor has submitted a donation confirmation.',
        relatedBloodRequest: request._id
      }),
      notifyAdmins({
        actor: req.user._id,
        type: 'DONOR_CONFIRMATION',
        title: 'Donation confirmation submitted',
        message: 'A donor has submitted a donation confirmation for review.',
        relatedBloodRequest: request._id
      })
    ])

    return res.status(200).json({
      message: 'Donor confirmation submitted successfully!',
      confirmation: record
    })
  } catch (error) {
    return sendConfirmationError(
      res,
      error,
      'DONOR CONFIRMATION ERROR:',
      'Unable to submit donor confirmation.'
    )
  }
}


// REQUESTER: SUBMIT DONATION CONFIRMATION
const submitRequesterConfirmation = async (req, res) => {
  try {
    const { id } = req.params
    const { confirmation } = req.body

    const allowedValues = [
      'Donation Completed',
      'Donation Did Not Occur'
    ]

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid blood request ID.'
      })
    }

    if (!allowedValues.includes(confirmation)) {
      return res.status(400).json({
        message: 'Please select a valid confirmation.'
      })
    }

    const record = await DonationConfirmation.findOne({
      bloodRequest: id,
      requester: req.user._id
    })

    if (!record) {
      return res.status(404).json({
        message: 'The donor must submit their confirmation first.'
      })
    }

    if (record.adminStatus === 'Confirmed') {
      return res.status(409).json({
        message: 'This donation has already been confirmed by the admin and can no longer be changed.'
      })
    }

    record.requesterConfirmation = confirmation
    record.adminStatus = 'Pending Review'

    await record.save()

    await Promise.all([
      createNotification({
        recipient: record.donor,
        actor: req.user._id,
        type: 'REQUESTER_CONFIRMATION',
        title: 'Requester submitted confirmation',
        message: 'The requester has submitted a donation confirmation.',
        relatedBloodRequest: record.bloodRequest
      }),
      notifyAdmins({
        actor: req.user._id,
        type: 'REQUESTER_CONFIRMATION',
        title: 'Requester confirmation submitted',
        message: 'A requester has submitted a donation confirmation for review.',
        relatedBloodRequest: record.bloodRequest
      })
    ])

    return res.status(200).json({
      message: 'Requester confirmation submitted successfully!',
      confirmation: record
    })
  } catch (error) {
    return sendConfirmationError(
      res,
      error,
      'REQUESTER CONFIRMATION ERROR:',
      'Unable to submit requester confirmation.'
    )
  }
}


module.exports = {
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
}
