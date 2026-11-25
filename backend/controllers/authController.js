const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const MAX_EMAIL_LENGTH = 254
const MAX_FULL_NAME_LENGTH = 100
const MAX_LOCATION_LENGTH = 200

const isString = (value) => typeof value === 'string'

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0

// Used so login takes the same time whether or not the email exists
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12)

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      role,
      location,
      pinCode,
      bloodGroup,
      availability
    } = req.body

    if (
      !isNonEmptyString(fullName) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(phone) ||
      !isString(password) ||
      password.length === 0 ||
      !isNonEmptyString(role) ||
      !isNonEmptyString(location) ||
      !isNonEmptyString(pinCode)
    ) {
      return res.status(400).json({
        message: 'Please fill in all required fields.'
      })
    }

    if (!['donor', 'requester'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid account role.'
      })
    }

    if (fullName.trim().length > MAX_FULL_NAME_LENGTH) {
      return res.status(400).json({
        message: `Full name must be ${MAX_FULL_NAME_LENGTH} characters or less.`
      })
    }

    if (location.trim().length > MAX_LOCATION_LENGTH) {
      return res.status(400).json({
        message: `Location must be ${MAX_LOCATION_LENGTH} characters or less.`
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedEmail.length > MAX_EMAIL_LENGTH) {
      return res.status(400).json({
        message: 'Please enter a valid email address.'
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Please enter a valid email address.'
      })
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({
        message: 'Phone number must contain exactly 10 digits.'
      })
    }

    if (!/^\d{6}$/.test(pinCode.trim())) {
      return res.status(400).json({
        message: 'PIN code must contain exactly 6 digits.'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters.'
      })
    }

    if (password.length > 128) {
      return res.status(400).json({
        message: 'Password is too long.'
      })
    }

    if (role === 'donor' && !bloodGroup) {
      return res.status(400).json({
        message: 'Please select your blood group.'
      })
    }

    const allowedBloodGroups = [
      'A+', 'A-', 'B+', 'B-',
      'AB+', 'AB-', 'O+', 'O-'
    ]

    if (role === 'donor' && !allowedBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        message: 'Invalid blood group.'
      })
    }

    const allowedAvailability = [
      'Active',
      'Inactive',
      'Temporarily Unavailable'
    ]

    if (
      role === 'donor' &&
      availability &&
      !allowedAvailability.includes(availability)
    ) {
      return res.status(400).json({
        message: 'Invalid availability status.'
      })
    }

    const existingUser = await User.findOne({
      email: normalizedEmail
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role,
      location: location.trim(),
      pinCode: pinCode.trim(),
      bloodGroup: role === 'donor' ? bloodGroup : '',
      availability: role === 'donor'
        ? (availability || 'Inactive')
        : 'Inactive'
    })

    return res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      }
    })
  } catch (error) {
    console.error('Registration error:', error.message)

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      })
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Please check your details and try again.'
      })
    }

    return res.status(500).json({
      message: 'Registration failed. Please try again.'
    })
  }
}

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!isNonEmptyString(email) || !isString(password) || password.length === 0) {
      return res.status(400).json({
        message: 'Please enter email and password.'
      })
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing')
      return res.status(500).json({
        message: 'Server authentication configuration error.'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const user = await User.findOne({
      email: normalizedEmail
    })

    // Always run the password check so response time does not reveal
    // whether the email exists
    const passwordMatch = await bcrypt.compare(
      password,
      user ? user.password : DUMMY_HASH
    )

    if (!user || !passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      })
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
        algorithm: 'HS256'
      }
    )

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error.message)

    return res.status(500).json({
      message: 'Login failed. Please try again.'
    })
  }
}

module.exports = { registerUser, loginUser }