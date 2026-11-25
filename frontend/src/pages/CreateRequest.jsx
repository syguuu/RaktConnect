
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function CreateRequest() {
  const [requestData, setRequestData] = useState({
    patientName: '',
    bloodGroup: '',
    bloodComponent: '',
    units: '',
    hospitalName: '',
    hospitalLocation: '',
    requiredDate: '',
    urgency: ''
  })

  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const navigate = useNavigate()

  const today = new Date()
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function handleChange(e) {
    const { name, value } = e.target

    setRequestData((previousData) => ({
      ...previousData,
      [name]: value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    const token = sessionStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...requestData,
          units: Number(requestData.units)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Request submission failed.')
      }

      setSuccessMessage(data.message || 'Blood request submitted successfully.')

      setRequestData({
        patientName: '',
        bloodGroup: '',
        bloodComponent: '',
        units: '',
        hospitalName: '',
        hospitalLocation: '',
        requiredDate: '',
        urgency: ''
      })

    } catch (error) {
      setErrorMessage(error.message || 'Unable to connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="dashboard-page create-request-page">
      <header className="dashboard-header">
        <h1>RaktConnect<span>.</span></h1>

        <nav>
          <Link to="/requester-dashboard">Dashboard</Link>
          <Link to="/search-donors">Find Donors</Link>
          <Link to="/my-requests">My Requests</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <p className="section-label">REQUEST BLOOD</p>
          <h1>Create a Blood Request</h1>
          <p>Enter the required details to submit your blood request.</p>
        </section>

        <section className="create-request-panel">
          <div className="create-request-heading">
            <div>
              <p className="section-label">NEW REQUEST</p>
              <h2>Request Information</h2>
              <p>Fields marked with * are required.</p>
            </div>
            <div className="request-form-icon">＋</div>
          </div>

          <form onSubmit={handleSubmit} className="create-request-form">
            <div className="form-section-title">
              <span>01</span>
              Patient & Blood Details
            </div>

            <div className="request-form-grid">
              <div className="request-field">
                <label>Patient's Name *</label>
                <input
                  type="text"
                  name="patientName"
                  placeholder="Enter patient's name"
                  value={requestData.patientName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="request-field">
                <label>Required Blood Group *</label>
                <select
                  name="bloodGroup"
                  value={requestData.bloodGroup}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="request-field">
                <label>Blood Component *</label>
                <select
                  name="bloodComponent"
                  value={requestData.bloodComponent}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select component</option>
                  <option value="Whole Blood">Whole Blood</option>
                  <option value="Red Blood Cells">Red Blood Cells</option>
                  <option value="Platelets">Platelets</option>
                  <option value="Plasma">Plasma</option>
                </select>
              </div>

              <div className="request-field">
                <label>Units Required *</label>
                <input
                  type="number"
                  name="units"
                  min="1"
                  step="1"
                  placeholder="Enter number of units"
                  value={requestData.units}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-section-title">
              <span>02</span>
              Hospital Information
            </div>

            <div className="request-form-grid">
              <div className="request-field">
                <label>Hospital Name *</label>
                <input
                  type="text"
                  name="hospitalName"
                  placeholder="Enter hospital name"
                  value={requestData.hospitalName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="request-field">
                <label>Hospital Location *</label>
                <input
                  type="text"
                  name="hospitalLocation"
                  placeholder="Enter hospital location"
                  value={requestData.hospitalLocation}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-section-title">
              <span>03</span>
              Requirement & Urgency
            </div>

            <div className="request-form-grid">
              <div className="request-field">
                <label>Required Date *</label>
                <input
                  type="date"
                  name="requiredDate"
                  min={localToday}
                  value={requestData.requiredDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="request-field">
                <label>Urgency Level *</label>
                <select
                  name="urgency"
                  value={requestData.urgency}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select urgency</option>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>

            <div className="request-form-note">
              <strong>Important</strong>
              <p>
                Submitted requests may be reviewed by the administrator.
                Donor coordination through RaktConnect does not replace
                confirmation and guidance from a hospital or blood bank.
              </p>
            </div>

            {successMessage && (
              <p className="success-alert">{successMessage}</p>
            )}

            {errorMessage && (
              <p className="error-alert">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-request-button"
            >
              {loading ? 'Submitting...' : 'Submit Blood Request →'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default CreateRequest
