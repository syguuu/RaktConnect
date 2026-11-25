
import { useState } from 'react'
import { Link } from 'react-router-dom'

function Register() {
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    pinCode: '',
    bloodGroup: '',
    availability: 'Active'
  })

  async function handleSubmit(e) {
    e.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match!')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            role,
            password
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.')
      }

      setSuccessMessage('Account created successfully! You can now log in.')

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        location: '',
        pinCode: '',
        bloodGroup: '',
        availability: 'Active'
      })

      setPassword('')
      setConfirmPassword('')
      setRole('')

    } catch (error) {
      setErrorMessage(
        error.message || 'Unable to connect to the server.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <h1>Create Your RaktConnect Account</h1>
      <p>Join RaktConnect and help connect lives.</p>

      <form onSubmit={handleSubmit} autoComplete="on">

        <label>Full Name</label>
        <input
          type="text"
          name="fullName"
          placeholder="Enter your full name"
          autoComplete="name"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          required
        />

        <label>Email Address</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
        />

        <label>Phone Number</label>
        <input
          type="tel"
          name="phone"
          placeholder="Enter your phone number"
          pattern="[6-9][0-9]{9}"
          title="Enter a valid 10-digit Indian mobile number"
          value={formData.phone}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Create a password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {confirmPassword && password !== confirmPassword && (
          <p style={{ color: 'red', marginBottom: '15px' }}>
            Passwords do not match!
          </p>
        )}

        <label>Register As</label>
        <select
          name="role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setFormData({ ...formData, bloodGroup: '' })
          }}
          required
        >
          <option value="">Select your role</option>
          <option value="donor">Blood Donor</option>
          <option value="requester">Blood Requester</option>
        </select>

        {role === 'donor' && (
          <>
            <label>Blood Group</label>
            <select
              required
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={(e) =>
                setFormData({ ...formData, bloodGroup: e.target.value })
              }
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

            <label>Initial Availability</label>
            <select
              name="availability"
              value={formData.availability}
              onChange={(e) =>
                setFormData({ ...formData, availability: e.target.value })
              }
            >
              <option value="Active">Active</option>
              <option value="Temporarily Unavailable">
                Temporarily Unavailable
              </option>
              <option value="Inactive">Inactive</option>
            </select>
          </>
        )}

        <label>City / Location</label>
        <input
          type="text"
          name="location"
          placeholder="Enter your city or area"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          required
        />

        <label>PIN Code</label>
        <input
          type="text"
          name="pinCode"
          placeholder="Enter your 6-digit PIN code"
          pattern="[0-9]{6}"
          title="Enter a valid 6-digit Indian PIN code"
          value={formData.pinCode}
          onChange={(e) =>
            setFormData({ ...formData, pinCode: e.target.value })
          }
          required
        />

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

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>

      <p style={{ marginTop: '20px' }}>
        <Link to="/">Back to Home</Link>
      </p>
    </div>
  )
}

export default Register
