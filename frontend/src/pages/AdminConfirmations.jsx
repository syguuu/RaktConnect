
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function AdminConfirmations() {
  const [confirmations, setConfirmations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const navigate = useNavigate()
  const token = sessionStorage.getItem('token')

  useEffect(() => {
    const fetchConfirmations = async () => {
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await fetch(
          'http://localhost:5000/api/requests/admin/confirmations',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load confirmations.')
        }

        setConfirmations(data.confirmations || [])

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchConfirmations()
  }, [token, navigate])

  const updateStatus = async (id, newStatus) => {
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `http://localhost:5000/api/requests/admin/confirmations/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ adminStatus: newStatus })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update status.')
      }

      setConfirmations(previous =>
        previous.map(item =>
          item._id === id
            ? { ...item, adminStatus: newStatus }
            : item
        )
      )

      setSuccess('Confirmation status updated successfully!')

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
          <h1>Donation Confirmations</h1>
          <p>Review donation outcomes reported by both parties.</p>
        </section>

        {loading && <p>Loading confirmations...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        {!loading && !error && (
          <section className="donor-status">

            <h2>Donation Records ({confirmations.length})</h2>

            {confirmations.length === 0 ? (
              <p>No donation confirmations have been submitted yet.</p>
            ) : (
              confirmations.map(item => (
                <div
                  key={item._id}
                  style={{
                    borderBottom: '1px solid #ddd',
                    padding: '20px 0',
                    marginBottom: '15px'
                  }}
                >

                  <h3>
                    {item.bloodRequest?.patientName || 'Blood Request'}
                  </h3>

                  <p>
                    <strong>Donor:</strong>{' '}
                    {item.donor?.fullName || 'Not available'}
                  </p>

                  <p>
                    <strong>Requester:</strong>{' '}
                    {item.requester?.fullName || 'Not available'}
                  </p>

                  <p>
                    <strong>Blood Group:</strong>{' '}
                    {item.bloodRequest?.bloodGroup || 'Not available'}
                  </p>

                  <p>
                    <strong>Donor Confirmation:</strong>{' '}
                    {item.donorConfirmation}
                  </p>

                  <p>
                    <strong>Requester Confirmation:</strong>{' '}
                    {item.requesterConfirmation}
                  </p>

                  <p>
                    <strong>Admin Review:</strong>{' '}
                    {item.adminStatus}
                  </p>

                  <label>Update Review Status</label>

                  <select
                    value={item.adminStatus}
                    onChange={e => updateStatus(item._id, e.target.value)}
                  >
                    <option value="Pending Review">Pending Review</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Discrepancy — Investigate">
                      Discrepancy — Investigate
                    </option>
                  </select>

                  <p style={{ marginTop: '12px', color: '#666' }}>
                    Admin confirmation records reported outcomes only.
                    It does not independently certify a donation or
                    establish medical eligibility.
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

export default AdminConfirmations
