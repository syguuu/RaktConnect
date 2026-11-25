
import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000/api'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)

      const token = sessionStorage.getItem('token')

      const response = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load notifications.')
      }

      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Notifications error:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async id => {
    try {
      const token = sessionStorage.getItem('token')

      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) return

      setNotifications(previous =>
        previous.map(item =>
          item._id === id ? { ...item, isRead: true } : item
        )
      )

      setUnreadCount(previous => Math.max(0, previous - 1))
    } catch (error) {
      console.error('Mark notification error:', error.message)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem('token')

      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) return

      setNotifications(previous =>
        previous.map(item => ({ ...item, isRead: true }))
      )

      setUnreadCount(0)
    } catch (error) {
      console.error('Mark all notifications error:', error.message)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="notification-wrapper">
      <button
        className="notification-bell"
        onClick={() => {
          setIsOpen(previous => !previous)
          if (!isOpen) fetchNotifications()
        }}
        aria-label="Notifications"
      >
        🔔

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>

            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <p className="notification-empty">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="notification-empty">
              No notifications yet.
            </p>
          ) : (
            <div className="notification-list">
              {notifications.map(item => (
                <div
                  key={item._id}
                  className={`notification-item ${
                    item.isRead ? 'read' : 'unread'
                  }`}
                >
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <small>
                      {new Date(item.createdAt).toLocaleString()}
                    </small>
                  </div>

                  {!item.isRead && (
                    <button onClick={() => markAsRead(item._id)}>
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Notifications
