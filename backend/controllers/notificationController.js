
const mongoose = require('mongoose')
const Notification = require('../models/Notification')

// GET MY NOTIFICATIONS
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
      .populate('actor', 'fullName')
      .sort({ createdAt: -1 })
      .limit(50)

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    })

    return res.status(200).json({
      count: notifications.length,
      unreadCount,
      notifications
    })
  } catch (error) {
    console.error('GET NOTIFICATIONS ERROR:', error.message)

    return res.status(500).json({
      message: 'Unable to fetch notifications.'
    })
  }
}

// MARK ONE NOTIFICATION AS READ
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid notification ID.'
      })
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: req.user._id
      },
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found.'
      })
    }

    return res.status(200).json({
      message: 'Notification marked as read.',
      notification
    })
  } catch (error) {
    console.error('MARK NOTIFICATION ERROR:', error.message)

    return res.status(500).json({
      message: 'Unable to update notification.'
    })
  }
}

// MARK ALL NOTIFICATIONS AS READ
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      { isRead: true }
    )

    return res.status(200).json({
      message: 'All notifications marked as read.'
    })
  } catch (error) {
    console.error('MARK ALL NOTIFICATIONS ERROR:', error.message)

    return res.status(500).json({
      message: 'Unable to update notifications.'
    })
  }
}

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
}
