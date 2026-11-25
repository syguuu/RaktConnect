
const User = require('../models/User')
const Notification = require('../models/Notification')

const createNotification = async ({
  recipient,
  actor = null,
  type,
  title,
  message,
  relatedBloodRequest = null
}) => {
  if (!recipient) return null

  return Notification.create({
    recipient,
    actor,
    type,
    title,
    message,
    relatedBloodRequest
  })
}

const notifyAdmins = async ({
  actor = null,
  type,
  title,
  message,
  relatedBloodRequest = null
}) => {
  const admins = await User.find({ role: 'admin' }).select('_id')

  if (!admins.length) return

  await Notification.insertMany(
    admins.map(admin => ({
      recipient: admin._id,
      actor,
      type,
      title,
      message,
      relatedBloodRequest
    }))
  )
}

module.exports = {
  createNotification,
  notifyAdmins
}
