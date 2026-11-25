
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

function AdminRequesters() {
  const [requesters, setRequesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const navigate = useNavigate()

  const token = sessionStorage.getItem('token')

  useEffect(() => {
    const fetchRequesters = async () => {
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await fetch(
          `${API_URL}/users/admin/requesters`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (response.status === 401 || response.status === 403) {
          setError(data.message || 'Access denied.')
          return
        }

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load requesters.')
        }

        setRequesters(data.requesters || [])

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRequesters()
  }, [token, navigate])

  const updateVerification = async (requesterId, newStatus) => {
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${API_URL}/users/admin/requesters/${requesterId}/verification`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            verificationStatus: newStatus
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update status.')
      }

      setRequesters((previousRequesters) =>
        previousRequesters.map((requester) =>
          requester._id === requesterId
            ? { ...requester, verificationStatus: newStatus }
            : requester
        )
      )

      setSuccess('Requester verification status updated successfully!')

    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    sessionStorage.clear()
    navigate('/login')
  }

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <h1>RaktConnect Admin</h1>

        <nav>
          <Link to="/admin-dashboard">Dashboard</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-content">

        <section className="welcome-section">
          <h1>Requester Verification</h1>
          <p>Review registered requester accounts and their information.</p>
        </section>

        {loading && <p>Loading requester accounts...</p>}

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {success && <p style={{ color: 'green' }}>{success}</p>}

        {!loading && !error && (
          <section className="donor-status">

            <h2>Registered Requesters ({requesters.length})</h2>

            {requesters.length === 0 ? (
              <p>No requester accounts found.</p>
            ) : (
              requesters.map((requester) => (
                <div
                  key={requester._id}
                  style={{
                    borderBottom: '1px solid #ddd',
                    padding: '20px 0',
                    marginBottom: '15px'
                  }}
                >

                  <h3>{requester.fullName}</h3>

                  <p><strong>Email:</strong> {requester.email}</p>
                  <p><strong>Phone:</strong> {requester.phone}</p>
                  <p><strong>Location:</strong> {requester.location}</p>
                  <p><strong>PIN Code:</strong> {requester.pinCode}</p>

                  <p>
                    <strong>Verification Status:</strong>{' '}
                    {requester.verificationStatus}
                  </p>

                  <label>Update Verification Status</label>

                  <select
                    value={requester.verificationStatus}
                    onChange={(e) =>
                      updateVerification(requester._id, e.target.value)
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  <p style={{ marginTop: '12px', color: '#666' }}>
                    Account verification confirms reviewed account
                    information only. It does not automatically validate
                    individual blood requests.
                  </p>

                </div>
              ))
            )}

          </section>
        )}

      </main>
    </div>
  )
}

export default AdminRequesters
