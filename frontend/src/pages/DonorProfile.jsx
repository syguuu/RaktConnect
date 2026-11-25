
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'

function DonorProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    async function fetchProfile() {
      const token = sessionStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await fetch(
          `${API_URL}/users/me`,
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

          throw new Error(data.message || 'Unable to load profile.')
        }

        setProfile(data.user)

      } catch (error) {
        setErrorMessage(error.message || 'Unable to connect to server.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  function handleLogout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  function handleChange(e) {
    const { name, value } = e.target

    setProfile((previousProfile) => ({
      ...previousProfile,
      [name]: value
    }))
  }

  async function handleSave(e) {
    e.preventDefault()

    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const token = sessionStorage.getItem('token')

    try {
      const response = await fetch(
        `${API_URL}/users/profile`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fullName: profile.fullName,
            phone: profile.phone,
            location: profile.location,
            pinCode: profile.pinCode,
            bloodGroup: profile.bloodGroup,
            availability: profile.availability
          })
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

        throw new Error(data.message || 'Unable to update profile.')
      }

      setProfile(data.user)

      setIsEditing(false)
      setSuccessMessage('Profile updated successfully!')

    } catch (error) {
      setErrorMessage(error.message || 'Unable to connect to server.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Loading your profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="dashboard-page">
        <p style={{ color: 'red' }}>
          {errorMessage || 'Unable to load your profile.'}
        </p>
        <button onClick={handleLogout}>Back to Login</button>
      </div>
    )
  }

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <h1>RaktConnect</h1>

        <nav>
          <Link to="/donor-dashboard">Dashboard</Link>
          <Link to="/messages">Messages</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-content">

        <section className="welcome-section">
          <h1>My Donor Profile</h1>
          <p>View and manage your donor information.</p>
        </section>

        <section className="donor-status">
          <h2>Personal Information</h2>

          {isEditing ? (

            <form onSubmit={handleSave}>

              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                required
              />

              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
              />

              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                pattern="[0-9]{10}"
                maxLength="10"
                value={profile.phone}
                onChange={handleChange}
                required
              />

              <label>Location</label>
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleChange}
                required
              />

              <label>PIN Code</label>
              <input
                type="text"
                name="pinCode"
                pattern="[0-9]{6}"
                maxLength="6"
                value={profile.pinCode}
                onChange={handleChange}
                required
              />

              <label>Blood Group</label>
              <select
                name="bloodGroup"
                value={profile.bloodGroup}
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

              <label>Availability</label>
              <select
                name="availability"
                value={profile.availability}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Temporarily Unavailable">
                  Temporarily Unavailable
                </option>
                <option value="Inactive">Inactive</option>
              </select>

              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setErrorMessage('')
                }}
              >
                Cancel
              </button>

            </form>

          ) : (

            <>
              <p><strong>Name:</strong> {profile.fullName || 'Not provided'}</p>
              <p><strong>Email:</strong> {profile.email || 'Not provided'}</p>
              <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
              <p><strong>Location:</strong> {profile.location || 'Not provided'}</p>
              <p><strong>PIN Code:</strong> {profile.pinCode || 'Not provided'}</p>
              <p><strong>Blood Group:</strong> {profile.bloodGroup || 'Not provided'}</p>
              <p><strong>Availability:</strong> {profile.availability}</p>

              <button onClick={() => {
                setErrorMessage('')
                setSuccessMessage('')
                setIsEditing(true)
              }}>
                Edit Profile
              </button>
            </>

          )}

          {successMessage && (
            <p style={{ color: 'green', marginTop: '12px' }}>
              {successMessage}
            </p>
          )}

          {errorMessage && (
            <p style={{ color: 'red', marginTop: '12px' }}>
              {errorMessage}
            </p>
          )}

        </section>

        <section className="donor-status">
          <h2>Verification Status</h2>
          <p>
            <strong>Status:</strong> {profile.verificationStatus || 'Pending'}
          </p>
          <p>Your contact and profile information will be reviewed by the admin.</p>
          <p>Verification does not determine medical eligibility to donate blood.</p>
        </section>

        <section className="donor-status">
          <h2>Activity Information</h2>
          <p><strong>Last Active:</strong> Will be tracked automatically</p>
          <p>Your availability should be updated regularly so requesters can see whether your information is recent.</p>
        </section>

      </main>
    </div>
  )
}

export default DonorProfile
