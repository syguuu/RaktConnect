
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function AdminDonors() {
  const navigate = useNavigate()

  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchDonors()
  }, [])

  async function fetchDonors() {
    const token = sessionStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch(
        'http://localhost:5000/api/users/admin/donors',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch donors.')
      }

      setDonors(data.donors)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateVerification(donorId, verificationStatus) {
    const token = sessionStorage.getItem('token')

    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/admin/${donorId}/verification`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ verificationStatus })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update status.')
      }

      setDonors((previousDonors) =>
        previousDonors.map((donor) =>
          donor._id === donorId
            ? { ...donor, verificationStatus }
            : donor
        )
      )

      setSuccess('Donor review status updated successfully!')

    } catch (err) {
      setError(err.message)
    }
  }

  function handleLogout() {
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
          <h1>Donor Verification</h1>
          <p>Review registered donor account information.</p>
        </section>

        <section className="donor-status">

          <h2>Registered Donors ({donors.length})</h2>

          {loading && <p>Loading donor accounts...</p>}

          {error && (
            <p style={{ color: 'red', marginTop: '15px' }}>
              {error}
            </p>
          )}

          {success && (
            <p style={{ color: 'green', marginTop: '15px' }}>
              {success}
            </p>
          )}

          {!loading && !error && donors.length === 0 && (
            <p>No donor accounts have been registered yet.</p>
          )}

          {!loading && donors.map((donor) => (
            <div
              key={donor._id}
              className="dashboard-card"
              style={{ marginTop: '20px' }}
            >
              <h3>{donor.fullName}</h3>

              <p><strong>Email:</strong> {donor.email}</p>
              <p><strong>Phone:</strong> {donor.phone}</p>
              <p><strong>Blood Group:</strong> {donor.bloodGroup}</p>
              <p><strong>Location:</strong> {donor.location}</p>
              <p><strong>PIN Code:</strong> {donor.pinCode}</p>
              <p><strong>Availability:</strong> {donor.availability}</p>

              <p>
                <strong>Account Review Status:</strong>{' '}
                {donor.verificationStatus}
              </p>

              <p>
                <strong>Registered:</strong>{' '}
                {new Date(donor.createdAt).toLocaleDateString()}
              </p>

              <label>Update Review Status</label>

              <select
                value={donor.verificationStatus}
                onChange={(e) =>
                  updateVerification(donor._id, e.target.value)
                }
              >
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>

            </div>
          ))}

          <p style={{ marginTop: '20px', color: '#666' }}>
            Account review does not establish medical eligibility
            to donate blood. Hospitals and blood banks determine
            donor eligibility.
          </p>

        </section>

      </main>
    </div>
  )
}

export default AdminDonors
