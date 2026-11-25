
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    async function fetchRequests() {
      const token = sessionStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await fetch(
          'http://localhost:5000/api/requests/admin/all',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('user')
            navigate('/login')
            return
          }

          throw new Error(
            data.message || 'Unable to load blood requests.'
          )
        }

        setRequests(data.requests)

      } catch (error) {
        setErrorMessage(
          error.message || 'Unable to connect to the server.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [navigate])

  async function handleStatusChange(requestId, newStatus) {
    const token = sessionStorage.getItem('token')

    setErrorMessage('')
    setSuccessMessage('')
    setUpdatingId(requestId)

    try {
      const response = await fetch(
        `http://localhost:5000/api/requests/admin/${requestId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to update request status.'
        )
      }

      setRequests((previousRequests) =>
        previousRequests.map((request) =>
          request._id === requestId
            ? { ...request, status: data.request.status }
            : request
        )
      )

      setSuccessMessage('Request status updated successfully!')

    } catch (error) {
      setErrorMessage(
        error.message || 'Unable to update request status.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
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
          <h1>Blood Request Review</h1>
          <p>Review submitted requests and update their status.</p>
        </section>

        <section className="donor-status">

          <h2>All Blood Requests</h2>

          {loading && (
            <p>Loading blood requests...</p>
          )}

          {errorMessage && (
            <p style={{ color: 'red', marginTop: '15px' }}>
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p style={{ color: 'green', marginTop: '15px' }}>
              {successMessage}
            </p>
          )}

          {!loading && !errorMessage && requests.length === 0 && (
            <p>No blood requests have been submitted yet.</p>
          )}

          {!loading && requests.length > 0 && (
            <div>

              <p style={{ marginTop: '15px' }}>
                <strong>Total Requests:</strong> {requests.length}
              </p>

              {requests.map((request) => (
                <div
                  key={request._id}
                  className="dashboard-card"
                  style={{ marginTop: '20px' }}
                >

                  <h3>{request.patientName}</h3>

                  <p>
                    <strong>Requester:</strong>{' '}
                    {request.requester?.fullName || 'Unavailable'}
                  </p>

                  <p>
                    <strong>Requester Email:</strong>{' '}
                    {request.requester?.email || 'Unavailable'}
                  </p>

                  <p>
                    <strong>Blood Group:</strong> {request.bloodGroup}
                  </p>

                  <p>
                    <strong>Component:</strong> {request.bloodComponent}
                  </p>

                  <p>
                    <strong>Units Required:</strong> {request.units}
                  </p>

                  <p>
                    <strong>Hospital:</strong> {request.hospitalName}
                  </p>

                  <p>
                    <strong>Hospital Location:</strong> {request.hospitalLocation}
                  </p>

                  <p>
                    <strong>Required Date:</strong>{' '}
                    {new Date(request.requiredDate).toLocaleDateString()}
                  </p>

                  <p>
                    <strong>Urgency:</strong> {request.urgency}
                  </p>

                  <p>
                    <strong>Submitted On:</strong>{' '}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>

                  <p>
                    <strong>Review Status:</strong> {request.status}
                  </p>

                  <label>Update Review Status</label>

                  <select
                    value={request.status}
                    disabled={updatingId === request._id}
                    onChange={(e) =>
                      handleStatusChange(request._id, e.target.value)
                    }
                  >
                    <option value="Pending Review">Pending Review</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Fulfilled">Fulfilled</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Expired">Expired</option>
                  </select>

                  {updatingId === request._id && (
                    <p>Updating status...</p>
                  )}

                  <p style={{ marginTop: '15px', color: '#777' }}>
                    Platform review does not establish medical
                    eligibility or guarantee blood availability.
                    Hospital and blood bank decisions remain essential.
                  </p>

                </div>
              ))}

            </div>
          )}

        </section>

      </main>
    </div>
  )
}

export default AdminRequests
