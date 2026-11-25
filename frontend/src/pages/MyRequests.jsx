
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

function MyRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [submittingRequestId, setSubmittingRequestId] = useState('')

  const navigate = useNavigate()

  async function fetchRequests() {
    const token = sessionStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/requests/my-requests`,
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

        throw new Error(data.message || 'Unable to fetch requests.')
      }

      setRequests(data.requests || [])

    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [navigate])

  async function handleRequesterConfirmation(requestId, confirmation) {
    const token = sessionStorage.getItem('token')

    setSubmittingRequestId(requestId)
    setConfirmationMessage('')
    setErrorMessage('')

    try {
      const response = await fetch(
        `${API_URL}/requests/requester/${requestId}/confirmation`,
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
        throw new Error(
          data.message || 'Unable to submit donation confirmation.'
        )
      }

      setConfirmationMessage(
        data.message || 'Your confirmation has been submitted successfully.'
      )
      await fetchRequests()

    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSubmittingRequestId('')
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
        <h1>RaktConnect</h1>

        <nav>
          <Link to="/requester-dashboard">Dashboard</Link>
          <Link to="/search-donors">Find Donors</Link>
          <Link to="/messages">Messages</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-content">

        <section className="welcome-section">
          <h1>My Blood Requests</h1>
          <p>Track your submitted requests and donor responses.</p>
        </section>

        <section className="donor-status">

          <h2>Request Tracking</h2>

          {loading && <p>Loading your requests...</p>}

          {errorMessage && (
            <p style={{ color: 'red' }}>{errorMessage}</p>
          )}

          {confirmationMessage && (
            <p style={{ color: 'green' }}>{confirmationMessage}</p>
          )}

          {!loading && !errorMessage && requests.length === 0 && (
            <>
              <p>You haven't submitted any requests yet.</p>
              <Link to="/create-request">Create a Blood Request</Link>
            </>
          )}

          {!loading && requests.map(request => {
            const hasAcceptedDonor = request.donorResponses?.some(
              item => item.response === 'Accepted'
            )

            return (
              <div
                key={request._id}
                className="dashboard-card"
                style={{ marginTop: '20px' }}
              >

                <h3>{request.patientName}</h3>

                <p><strong>Blood Group:</strong> {request.bloodGroup}</p>
                <p><strong>Component:</strong> {request.bloodComponent}</p>
                <p><strong>Units:</strong> {request.units}</p>
                <p><strong>Hospital:</strong> {request.hospitalName}</p>
                <p><strong>Location:</strong> {request.hospitalLocation}</p>
                <p>
                  <strong>Required Date:</strong>{' '}
                  {new Date(request.requiredDate).toLocaleDateString()}
                </p>
                <p><strong>Urgency:</strong> {request.urgency}</p>
                <p><strong>Admin Status:</strong> {request.status}</p>
                <p>
                  <strong>Submitted:</strong>{' '}
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>

                <div style={{ marginTop: '15px' }}>
                  <h3>Donor Responses</h3>

                  {!request.donorResponses?.length && (
                    <p>No donors have responded yet.</p>
                  )}

                  {request.donorResponses?.map((item, index) => (
                    <div
                      key={item._id || index}
                      style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#fff4f4',
                        borderRadius: '6px'
                      }}
                    >
                      <p>
                        <strong>Donor:</strong>{' '}
                        {item.donor?.fullName || 'Donor'}
                      </p>

                      <p>
                        <strong>Response:</strong>{' '}
                        <span style={{
                          color: item.response === 'Accepted' ? 'green' : '#a71930'
                        }}>
                          {item.response}
                        </span>
                      </p>

                      <p>
                        <strong>Responded:</strong>{' '}
                        {item.respondedAt
                          ? new Date(item.respondedAt).toLocaleString()
                          : 'Not available'}
                      </p>
                    </div>
                  ))}
                </div>

                {hasAcceptedDonor && (
                  <div style={{ marginTop: '20px' }}>
                    <h3>Donation Confirmation</h3>

                    <p>
                      Has the donation taken place?
                    </p>

                    <button
                      onClick={() => handleRequesterConfirmation(
                        request._id,
                        'Donation Completed'
                      )}
                      disabled={submittingRequestId === request._id}
                      style={{ marginRight: '10px', marginTop: '10px' }}
                    >
                      {submittingRequestId === request._id
                        ? 'Submitting...'
                        : 'Donation Completed'}
                    </button>

                    <button
                      onClick={() => handleRequesterConfirmation(
                        request._id,
                        'Donation Did Not Occur'
                      )}
                      disabled={submittingRequestId === request._id}
                      style={{ marginTop: '10px' }}
                    >
                      Donation Did Not Occur
                    </button>

                    <p style={{ fontSize: '13px', marginTop: '10px' }}>
                      Your confirmation is for coordination and record-keeping.
                      Actual donation verification is handled by the hospital
                      or blood bank.
                    </p>
                  </div>
                )}

              </div>
            )
          })}

          <div style={{ marginTop: '25px' }}>
            <Link to="/create-request">Create Another Blood Request</Link>
          </div>

        </section>
      </main>
    </div>
  )
}

export default MyRequests
