
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

function RequesterDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    async function fetchUser() {
      const token = sessionStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('user')
            navigate('/login')
            return
          }

          throw new Error(data.message || 'Unable to load your dashboard.')
        }

        setUser(data.user)
      } catch (error) {
        setErrorMessage(error.message || 'Unable to connect to the server.')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  function handleLogout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return <div className="dashboard-page"><p>Loading your dashboard...</p></div>
  }

  if (errorMessage) {
    return (
      <div className="dashboard-page">
        <p className="error-alert">{errorMessage}</p>
        <button onClick={handleLogout}>Back to Login</button>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="dashboard-page requester-dashboard">
      <header className="dashboard-header">
        <h1>RaktConnect<span>.</span></h1>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/search-donors">Find Donors</Link>
          <Link to="/messages">Messages</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <p className="section-label">REQUESTER DASHBOARD</p>
          <h1>Welcome, {user.fullName}!</h1>
          <p>Find potential donors and coordinate blood requests.</p>
        </section>

        <section className="requester-profile-panel">
          <div className="requester-profile-heading">
            <div>
              <p className="section-label">YOUR ACCOUNT</p>
              <h2>Account Information</h2>
            </div>
            <span className="account-status">
              {user.verificationStatus || 'Pending'}
            </span>
          </div>

          <div className="requester-details-grid">
            <div>
              <span>FULL NAME</span>
              <strong>{user.fullName}</strong>
            </div>

            <div>
              <span>EMAIL ADDRESS</span>
              <strong>{user.email}</strong>
            </div>

            <div>
              <span>LOCATION</span>
              <strong>{user.location || 'Not provided'}</strong>
            </div>

            <div>
              <span>ACCOUNT STATUS</span>
              <strong>{user.verificationStatus || 'Pending'}</strong>
            </div>
          </div>

          <p className="requester-note">
            Keep your contact information accurate and provide
            genuine hospital requisition documents when requested.
            Requests may be reviewed by the administrator.
          </p>
        </section>

        <section className="requester-actions-section">
          <p className="section-label">GET STARTED</p>
          <h2>What would you like to do?</h2>

          <div className="dashboard-cards requester-cards">
            <div className="dashboard-card requester-action-card">
              <div className="action-icon">⌕</div>
              <h3>Find Blood Donors</h3>
              <p>Search for potential donors by blood group and location.</p>
              <Link to="/search-donors">Search Donors →</Link>
            </div>

            <div className="dashboard-card requester-action-card">
              <div className="action-icon">＋</div>
              <h3>Create Blood Request</h3>
              <p>Submit a new blood requirement for administrative review.</p>
              <Link to="/create-request">Create Request →</Link>
            </div>

            <div className="dashboard-card requester-action-card">
              <div className="action-icon">▤</div>
              <h3>My Requests</h3>
              <p>Track the status of your submitted blood requests.</p>
              <Link to="/my-requests">View Requests →</Link>
            </div>

            <div className="dashboard-card requester-action-card">
              <div className="action-icon">✉</div>
              <h3>Messages</h3>
              <p>Communicate with donors who respond to your requests.</p>
              <Link to="/messages">Open Messages →</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default RequesterDashboard
