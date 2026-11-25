
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import { API_URL } from '../config'

function DonorDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [incomingRequests, setIncomingRequests] = useState([])
  const [acceptedRequests, setAcceptedRequests] = useState([])
  const [requestLoading, setRequestLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()

  const token = sessionStorage.getItem('token')

  async function fetchAcceptedRequests() {
    try {
      const response = await fetch(
        `${API_URL}/requests/donor/accepted`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load accepted requests.')
      }

      setAcceptedRequests(data.requests || [])
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load profile.')
        }

        setUser(data.user)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (!token) {
      navigate('/login')
      return
    }

    fetchDashboard()
  }, [navigate, token])

  useEffect(() => {
    async function fetchRequests() {
      try {
        const response = await fetch(
          `${API_URL}/requests/donor/incoming`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load requests.')
        }

        setIncomingRequests(data.requests || [])
        await fetchAcceptedRequests()
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setRequestLoading(false)
      }
    }

    if (token) fetchRequests()
  }, [token])

  async function handleAvailabilityChange(e) {
    const newAvailability = e.target.value
    setUpdating(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(
        `${API_URL}/users/availability`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ availability: newAvailability })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update availability.')
      }

      setUser(previous => ({
        ...previous,
        availability: data.availability
      }))

      setSuccessMessage('Availability updated successfully!')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleRequestResponse(requestId, responseType) {
    try {
      const response = await fetch(
        `${API_URL}/requests/donor/${requestId}/respond`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ response: responseType })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to respond.')
      }

      setIncomingRequests(previous =>
        previous.filter(request => request._id !== requestId)
      )

      if (responseType === 'Accepted') {
        await fetchAcceptedRequests()
      }

      setSuccessMessage(data.message)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  async function handleDonationConfirmation(requestId, confirmation) {
    const confirmed = window.confirm(
      `Are you sure you want to submit "${confirmation}"?`
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `${API_URL}/requests/donor/${requestId}/confirmation`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ confirmation })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit confirmation.')
      }

      setSuccessMessage(data.message)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="dashboard-page donor-dashboard">
        <div className="donor-loading">
          <div className="donor-loading-icon">❤️</div>
          <p>Preparing your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="dashboard-page donor-dashboard">
        <div className="donor-loading">
          <p>{errorMessage || 'Unable to load your profile.'}</p>
          <button onClick={handleLogout}>Back to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page donor-dashboard">

      <header className="dashboard-header donor-header">
        <Link to="/" className="donor-brand">
          RaktConnect<span>.</span>
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/donor-profile">My Profile</Link>
          <Link to="/messages">Messages</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-content donor-main">

        <section className="donor-welcome-banner">
          <div className="donor-welcome-content">
            <p className="section-label">✦ DONOR DASHBOARD</p>
            <h1>
              Welcome back,
              <span> {user.fullName}!</span>
            </h1>
            <p>
              Your willingness to help can make a meaningful
              difference in someone's life.
            </p>
          </div>

          <div className="donor-welcome-decoration">
            <span>❤️</span>
            <p>Every drop counts</p>
          </div>
        </section>

        {successMessage && (
          <div className="dashboard-alert success-alert">
            ✓ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="dashboard-alert error-alert">
            {errorMessage}
          </div>
        )}

        <section className="donor-info-grid">

          <div className="donor-info-card blood-info">
            <div className="donor-card-icon">🩸</div>
            <span>YOUR BLOOD GROUP</span>
            <strong>{user.bloodGroup || 'Not Set'}</strong>
            <p>Your registered blood group</p>
          </div>

          <div className="donor-info-card location-info">
            <div className="donor-card-icon">⌖</div>
            <span>YOUR LOCATION</span>
            <strong>{user.location || 'Not Set'}</strong>
            <p>Your registered area</p>
          </div>

          <div className="donor-info-card availability-info">
            <div className="donor-card-icon">✦</div>
            <span>AVAILABILITY</span>
            <strong>{user.availability || 'Not Set'}</strong>
            <p>Your current donor status</p>
          </div>

        </section>

        <section className="donor-status availability-section donor-availability-panel">
          <div className="availability-copy">
            <p className="section-label">YOUR DONOR STATUS</p>
            <h2>Manage Availability</h2>
            <p>
              Keep your availability updated so requesters
              know whether you are currently available.
            </p>
          </div>

          <div className="availability-control">
            <label>Current Availability</label>
            <select
              value={user.availability}
              onChange={handleAvailabilityChange}
              disabled={updating}
            >
              <option value="Active">Active</option>
              <option value="Temporarily Unavailable">
                Temporarily Unavailable
              </option>
              <option value="Inactive">Inactive</option>
            </select>

            {updating && <p>Updating your status...</p>}
          </div>
        </section>

        <section className="donor-status donor-request-section">

          <div className="section-heading">
            <div>
              <p className="section-label">✦ ACTION REQUIRED</p>
              <h2>Incoming Blood Requests</h2>
              <p>Review requests that match your donor profile.</p>
            </div>

            <span className="request-count">
              {incomingRequests.length} requests
            </span>
          </div>

          {requestLoading && (
            <p className="donor-section-loading">Loading requests...</p>
          )}

          {!requestLoading && incomingRequests.length === 0 && (
            <div className="dashboard-empty donor-empty">
              <div className="donor-empty-icon">♡</div>
              <h3>No new requests</h3>
              <p>No matching approved requests are currently available.</p>
            </div>
          )}

          <div className="donor-request-grid">
            {incomingRequests.map(request => (
              <div key={request._id} className="dashboard-card donor-request-card">

                <div className="donor-request-card-heading">
                  <span className="request-urgency">{request.urgency}</span>
                  <span className="donor-request-type">New Request</span>
                </div>

                <h3>{request.bloodGroup} Blood Required</h3>

                <div className="donor-request-details">
                  <p><span>Patient</span><strong>{request.patientName}</strong></p>
                  <p><span>Component</span><strong>{request.bloodComponent}</strong></p>
                  <p><span>Units</span><strong>{request.units}</strong></p>
                  <p><span>Hospital</span><strong>{request.hospitalName}</strong></p>
                  <p><span>Location</span><strong>{request.hospitalLocation}</strong></p>
                  <p>
                    <span>Required Date</span>
                    <strong>{new Date(request.requiredDate).toLocaleDateString()}</strong>
                  </p>
                </div>

                <div className="request-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleRequestResponse(request._id, 'Accepted')}
                  >
                    ✓ Accept
                  </button>

                  <button
                    className="decline-btn"
                    onClick={() => handleRequestResponse(request._id, 'Declined')}
                  >
                    Decline
                  </button>
                </div>

              </div>
            ))}
          </div>
        </section>

        <section className="donor-status donor-request-section">

          <div className="section-heading">
            <div>
              <p className="section-label">✦ YOUR ACTIVITY</p>
              <h2>My Accepted Requests</h2>
              <p>Keep track of the requests you have accepted.</p>
            </div>

            <span className="request-count accepted-count">
              {acceptedRequests.length} accepted
            </span>
          </div>

          {requestLoading && (
            <p className="donor-section-loading">Loading accepted requests...</p>
          )}

          {!requestLoading && acceptedRequests.length === 0 && (
            <div className="dashboard-empty donor-empty">
              <div className="donor-empty-icon">♡</div>
              <h3>No accepted requests yet</h3>
              <p>Requests you accept will appear here.</p>
            </div>
          )}

          <div className="donor-request-grid">
            {acceptedRequests.map(request => (
              <div key={request._id} className="dashboard-card donor-request-card">

                <div className="donor-request-card-heading">
                  <span className="accepted-label">✓ Accepted Request</span>
                </div>

                <h3>{request.bloodGroup} Blood Request</h3>

                <div className="donor-request-details">
                  <p><span>Patient</span><strong>{request.patientName}</strong></p>
                  <p><span>Hospital</span><strong>{request.hospitalName}</strong></p>
                  <p><span>Location</span><strong>{request.hospitalLocation}</strong></p>
                  <p>
                    <span>Required Date</span>
                    <strong>{new Date(request.requiredDate).toLocaleDateString()}</strong>
                  </p>
                </div>

                <h4 className="confirmation-heading">Donation Confirmation</h4>

                <div className="request-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleDonationConfirmation(request._id, 'Donation Completed')}
                  >
                    ✓ Donation Completed
                  </button>

                  <button
                    className="decline-btn"
                    onClick={() => handleDonationConfirmation(request._id, 'Donation Did Not Occur')}
                  >
                    Did Not Occur
                  </button>
                </div>

              </div>
            ))}
          </div>
        </section>

        <section className="donor-quick-links">
          <div className="donor-quick-heading">
            <p className="section-label">✦ QUICK ACCESS</p>
            <h2>Your RaktConnect Space</h2>
          </div>

          <div className="dashboard-cards">
            <div className="dashboard-card donor-quick-card">
              <div className="quick-card-icon">♙</div>
              <h3>My Profile</h3>
              <p>Manage your donor information and personal details.</p>
              <Link to="/donor-profile">View Profile →</Link>
            </div>

            <div className="dashboard-card donor-quick-card">
              <div className="quick-card-icon">♡</div>
              <h3>Blood Requests</h3>
              <p>Keep track of your blood request activity.</p>
              <Link to="/my-requests">View Requests →</Link>
            </div>

            <div className="dashboard-card donor-quick-card">
              <div className="quick-card-icon">✉</div>
              <h3>Messages</h3>
              <p>Stay connected and communicate with requesters.</p>
              <Link to="/messages">Open Messages →</Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

export default DonorDashboard
