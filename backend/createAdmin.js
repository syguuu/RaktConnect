const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const User = require('./models/User')

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    const existingAdmin = await User.findOne({
      role: 'admin'
    })

    if (existingAdmin) {
      console.log('An Admin account already exists.')
      return
    }

    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword || adminPassword.length < 12) {
      console.log('Please set a strong ADMIN_PASSWORD in your .env file.')
      return
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    await User.create({
      fullName: 'RaktConnect Admin',
      email: 'admin@raktconnect.com',
      phone: '0000000000',
      password: hashedPassword,
      role: 'admin',
      location: 'Admin Office',
      pinCode: '000000'
    })

    console.log('Admin account created successfully!')
  } catch (error) {
    console.log('Admin creation failed:', error.message)
  } finally {
    await mongoose.disconnect()
  }
}

createAdmin()
