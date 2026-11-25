
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import { API_URL } from '../config'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()

    setErrorMessage('')
    setLoading(true)

    try {
         const response = await fetch(
           `${API_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.')
      }

      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('user', JSON.stringify(data.user))

      if (data.user.role === 'donor') {
        navigate('/donor-dashboard')
      } else if (data.user.role === 'requester') {
        navigate('/requester-dashboard')
      } else if (data.user.role === 'admin') {
        navigate('/admin-dashboard')
      }

    } catch (error) {
      setErrorMessage(
        error.message || 'Unable to connect to the server.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      <div className="login-left">
        <Link to="/" className="login-brand">
          RaktConnect<span>.</span>
        </Link>

        <div className="login-left-content">
          <div className="login-heart">❤️</div>

          <p className="login-eyebrow">EVERY DROP COUNTS</p>

          <h1>
            Welcome to a community that <span>cares.</span>
          </h1>

          <p>
            Connecting blood donors and people in need,
            one meaningful connection at a time.
          </p>

          <div className="login-quote">
            "Together, we can make every connection count."
          </div>
        </div>

        <p className="login-left-footer">
          Connecting people. Supporting communities.
        </p>
      </div>

      <div className="login-right">

        <div className="login-top-link">
          <Link to="/">← Back to Home</Link>
        </div>

        <div className="login-form-container">

          <div className="login-form-icon">✦</div>

          <p className="login-form-label">WELCOME BACK</p>

          <h2>Login to your account</h2>

          <p className="login-form-description">
            We're glad to have you back. Enter your details below.
          </p>

          <form onSubmit={handleSubmit} autoComplete="on">

            <div className="login-field">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label>Password</label>

              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <label className="login-show-password">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show Password
            </label>

            {errorMessage && (
              <p className="login-error">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login to RaktConnect →'}
            </button>

            <p className="login-register-text">
              Don't have an account?{' '}
              <Link to="/register">Create one</Link>
            </p>

          </form>
        </div>

        <p className="login-bottom-note">
          Made for connections that matter ❤️
        </p>

      </div>
    </div>
  )
}

export default Login
