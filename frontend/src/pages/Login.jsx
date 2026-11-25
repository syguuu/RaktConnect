
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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
        'http://localhost:5000/api/auth/login',
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

      // Save login information for this browser session
      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('user', JSON.stringify(data.user))

      // Redirect according to account role
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
      <h1>Welcome Back!</h1>
      <p>Login to your RaktConnect account.</p>

      <form onSubmit={handleSubmit} autoComplete="on">
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

        <label>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          Show Password
        </label>

        {errorMessage && (
          <p style={{ color: 'red', marginTop: '15px' }}>
            {errorMessage}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>

      <p style={{ marginTop: '20px' }}>
        <Link to="/">Back to Home</Link>
      </p>
    </div>
  )
}

export default Login
