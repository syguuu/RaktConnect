
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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
        'http://localhost:5000/api/requests/donor/accepted',
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
        const response = await fetch('http://localhost:5000/api/users/me', {
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
          'http://localhost:5000/api/requests/donor/incoming',
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
        'http://localhost:5000/api/users/availability',
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
        `http://localhost:5000/api/requests/donor/${requestId}/respond`,
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
        `http://localhost:5000/api/requests/donor/${requestId}/confirmation`,
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
    return <div className="dashboard-page"><p>Loading dashboard...</p></div>
  }

  if (!user) {
    return (
      <div className="dashboard-page">
        <p>{errorMessage || 'Unable to load your profile.'}</p>
        <button onClick={handleLogout}>Back to Login</button>
      </div>
    )
  }

  return (
    <div className="dashboard-page donor-dashboard">
      <header className="dashboard-header">
        <h1>RaktConnect<span>.</span></h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/donor-profile">My Profile</Link>
          <Link to="/messages">Messages</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <p className="section-label">DONOR DASHBOARD</p>
          <h1>Welcome, {user.fullName}!</h1>
          <p>Your willingness to help can make a difference.</p>
        </section>

        {successMessage && (
          <div className="dashboard-alert success-alert">{successMessage}</div>
        )}

        {errorMessage && (
          <div className="dashboard-alert error-alert">{errorMessage}</div>
        )}

        <section className="donor-info-grid">
          <div className="donor-info-card blood-info">
            <span>YOUR BLOOD GROUP</span>
            <strong>{user.bloodGroup || 'Not Set'}</strong>
          </div>

          <div className="donor-info-card">
            <span>YOUR LOCATION</span>
            <strong>{user.location || 'Not Set'}</strong>
          </div>

          <div className="donor-info-card">
            <span>AVAILABILITY</span>
            <strong>{user.availability || 'Not Set'}</strong>
          </div>
        </section>

        <section className="donor-status availability-section">
          <div>
            <h2>Manage Availability</h2>
            <p>Update your status so requesters know whether you are available.</p>
          </div>

          <select
            value={user.availability}
            onChange={handleAvailabilityChange}
            disabled={updating}
          >
            <option value="Active">Active</option>
            <option value="Temporarily Unavailable">Temporarily Unavailable</option>
            <option value="Inactive">Inactive</option>
          </select>

          {updating && <p>Updating...</p>}
        </section>

        <section className="donor-status">
          <div className="section-heading">
            <div>
              <p className="section-label">ACTION REQUIRED</p>
              <h2>Incoming Blood Requests</h2>
            </div>
            <span className="request-count">{incomingRequests.length} requests</span>
          </div>

          {requestLoading && <p>Loading requests...</p>}

          {!requestLoading && incomingRequests.length === 0 && (
            <div className="dashboard-empty">
              <h3>No new requests</h3>
              <p>No matching approved requests are currently available.</p>
            </div>
          )}

          <div className="donor-request-grid">
            {incomingRequests.map(request => (
              <div key={request._id} className="dashboard-card donor-request-card">
                <span className="request-urgency">{request.urgency}</span>
                <h3>{request.bloodGroup} Blood Required</h3>
                <p><strong>Patient:</strong> {request.patientName}</p>
                <p><strong>Component:</strong> {request.bloodComponent}</p>
                <p><strong>Units:</strong> {request.units}</p>
                <p><strong>Hospital:</strong> {request.hospitalName}</p>
                <p><strong>Location:</strong> {request.hospitalLocation}</p>
                <p><strong>Required Date:</strong> {new Date(request.requiredDate).toLocaleDateString()}</p>

                <div className="request-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleRequestResponse(request._id, 'Accepted')}
                  >
                    Accept
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

        <section className="donor-status">
          <div className="section-heading">
            <div>
              <p className="section-label">YOUR ACTIVITY</p>
              <h2>My Accepted Requests</h2>
            </div>
            <span className="request-count">{acceptedRequests.length} accepted</span>
          </div>

          {requestLoading && <p>Loading accepted requests...</p>}

          {!requestLoading && acceptedRequests.length === 0 && (
            <div className="dashboard-empty">
              <h3>No accepted requests yet</h3>
              <p>Requests you accept will appear here.</p>
            </div>
          )}

          <div className="donor-request-grid">
            {acceptedRequests.map(request => (
              <div key={request._id} className="dashboard-card donor-request-card">
                <span className="accepted-label">Accepted Request</span>
                <h3>{request.bloodGroup} Blood Request</h3>
                <p><strong>Patient:</strong> {request.patientName}</p>
                <p><strong>Hospital:</strong> {request.hospitalName}</p>
                <p><strong>Location:</strong> {request.hospitalLocation}</p>
                <p><strong>Required Date:</strong> {new Date(request.requiredDate).toLocaleDateString()}</p>

                <h4>Donation Confirmation</h4>

                <div className="request-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleDonationConfirmation(request._id, 'Donation Completed')}
                  >
                    Donation Completed
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

        <section className="dashboard-cards">
          <div className="dashboard-card">
            <h3>My Profile</h3>
            <p>Manage your donor information.</p>
            <Link to="/donor-profile">View Profile →</Link>
          </div>

          <div className="dashboard-card">
            <h3>Blood Requests</h3>
            <p>Check your request activity.</p>
            <Link to="/my-requests">View Requests →</Link>
          </div>

          <div className="dashboard-card">
            <h3>Messages</h3>
            <p>Communicate with requesters.</p>
            <Link to="/messages">Open Messages →</Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DonorDashboard
