
import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

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

      <div className="register-left">
        <Link to="/" className="register-brand">
          RaktConnect<span>.</span>
        </Link>

        <div className="register-left-content">
          <div className="register-heart">❤️</div>
          <p className="register-eyebrow">BE PART OF SOMETHING MEANINGFUL</p>

          <h1>
            A small step from you.
            <span> A big difference for someone.</span>
          </h1>

          <p>
            Join a community that brings blood donors and
            people in need closer together.
          </p>

          <div className="register-feature">
            <span>✦</span>
            <div>
              <h3>Connect with people</h3>
              <p>Find potential donors and build meaningful connections.</p>
            </div>
          </div>

          <div className="register-feature">
            <span>✦</span>
            <div>
              <h3>Stay informed</h3>
              <p>Manage requests and keep track of your activity.</p>
            </div>
          </div>
        </div>

        <p className="register-left-footer">
          Every drop counts. Every connection matters.
        </p>
      </div>

      <div className="register-right">

        <div className="register-top-link">
          <Link to="/">← Back to Home</Link>
        </div>

        <div className="register-form-container">

          <div className="register-form-heading">
            <div className="register-form-icon">✦</div>
            <p className="register-form-label">JOIN THE COMMUNITY</p>
            <h2>Create your account</h2>
            <p>Fill in your details to get started with RaktConnect.</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="on">

            <div className="register-form-grid">

              <div className="register-field">
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
              </div>

              <div className="register-field">
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
              </div>

              <div className="register-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="10-digit mobile number"
                  pattern="[6-9][0-9]{9}"
                  title="Enter a valid 10-digit Indian mobile number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="register-field">
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
              </div>

              {role === 'donor' && (
                <>
                  <div className="register-field">
                    <label>Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={(e) =>
                        setFormData({ ...formData, bloodGroup: e.target.value })
                      }
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

                  <div className="register-field">
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
                  </div>
                </>
              )}

              <div className="register-field">
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
              </div>

              <div className="register-field">
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
              </div>

            </div>

            {confirmPassword && password !== confirmPassword && (
              <p className="register-password-warning">
                Passwords do not match!
              </p>
            )}

            <div className="register-field register-location-field">
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
            </div>

            <div className="register-field register-location-field">
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
            </div>

            {errorMessage && (
              <p className="register-error">{errorMessage}</p>
            )}

            {successMessage && (
              <p className="register-success">{successMessage}</p>
            )}

            <button
              type="submit"
              className="register-submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create My Account →'}
            </button>

            <p className="register-login-text">
              Already have an account? <Link to="/login">Login here</Link>
            </p>

          </form>
        </div>

        <p className="register-bottom-note">
          Made for connections that matter ❤️
        </p>

      </div>
    </div>
  )
}

export default Register
