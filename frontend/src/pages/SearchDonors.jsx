
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import '../App.css'

function SearchDonors() {
  const navigate = useNavigate()

  const [bloodGroup, setBloodGroup] = useState('')
  const [location, setLocation] = useState('')
  const [pinCode, setPinCode] = useState('')
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()

    const token = sessionStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    setLoading(true)
    setError('')
    setSearched(false)
    setDonors([])

    try {
      const params = new URLSearchParams()
      params.append('bloodGroup', bloodGroup)

      if (location.trim()) params.append('location', location.trim())
      if (pinCode.trim()) params.append('pinCode', pinCode.trim())

      const response = await fetch(
        `http://localhost:5000/api/users/search?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to search donors.')
      }

      setDonors(data.donors)
      setSearched(true)
    } catch (err) {
      setError(err.message)
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
    <div className="dashboard-page search-donors-page">

      <header className="dashboard-header search-header">
        <Link to="/requester-dashboard" className="search-brand">
          RaktConnect<span>.</span>
        </Link>

        <nav>
          <Link to="/requester-dashboard">Dashboard</Link>
          <Link to="/my-requests">My Requests</Link>
          <Link to="/messages">Messages</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-content search-main">

        <section className="search-hero">
          <div className="search-hero-content">
            <p className="section-label">❤️ THE DONOR COMMUNITY</p>
            <h1>
              Find a donor.
              <span> Make a connection.</span>
            </h1>
            <p>
              Search for potential blood donors by blood group
              and location. Every connection can make a difference.
            </p>
          </div>

          <div className="search-hero-decoration">
            <div className="search-hero-circle">+</div>
            <span>Every drop counts</span>
          </div>
        </section>

        <section className="donor-search-panel">

          <div className="search-heading">
            <div>
              <p className="section-label">DONOR DIRECTORY</p>
              <h2>Find potential donors</h2>
              <p>Enter the details of the blood group you need.</p>
            </div>

            <div className="search-symbol">⌕</div>
          </div>

          <form onSubmit={handleSearch} className="donor-search-form">

            <div className="search-field">
              <label>Required Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
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

            <div className="search-field">
              <label>City / Location</label>
              <input
                type="text"
                placeholder="Enter city or area"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="search-field">
              <label>PIN Code <span>(Optional)</span></label>
              <input
                type="text"
                placeholder="Enter 6-digit PIN code"
                pattern="[0-9]{6}"
                title="Enter a valid 6-digit PIN code"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="donor-search-button"
            >
              {loading ? 'Searching...' : '⌕  Search Donors'}
            </button>

          </form>

          {error && <p className="error-alert">{error}</p>}

        </section>

        {searched && (
          <section className="donor-results-section">

            <div className="results-heading">
              <div>
                <p className="section-label">MATCHING PROFILES</p>
                <h2>Search Results</h2>
                <p>Potential donors matching your search.</p>
              </div>

              <span className="results-count">
                {donors.length} Found
              </span>
            </div>

            {donors.length === 0 ? (
              <div className="dashboard-empty search-empty">
                <div className="search-empty-icon">⌕</div>
                <h3>No donors found</h3>
                <p>
                  Try changing the location or searching another blood group.
                </p>
              </div>
            ) : (
              <div className="donor-results-grid">

                {donors.map((donor) => (
                  <div key={donor._id} className="donor-result-card">

                    <div className="donor-result-top">
                      <div className="donor-avatar">
                        {donor.fullName?.charAt(0)?.toUpperCase()}
                      </div>

                      <div className="donor-result-identity">
                        <h3>{donor.fullName}</h3>
                        <p>
                          <span>⌖</span> {donor.location || 'Location not provided'}
                        </p>
                      </div>

                      <span className="blood-group-badge">
                        {donor.bloodGroup}
                      </span>
                    </div>

                    <div className="donor-result-details">
                      <p>
                        <span>PIN Code</span>
                        <strong>{donor.pinCode || 'Not provided'}</strong>
                      </p>

                      <p>
                        <span>Availability</span>
                        <strong>{donor.availability || 'Not specified'}</strong>
                      </p>

                      <p>
                        <span>Review Status</span>
                        <strong>{donor.verificationStatus || 'Pending'}</strong>
                      </p>
                    </div>

                  </div>
                ))}

              </div>
            )}

            <p className="search-disclaimer">
              Search results identify potential donors only. They do not
              confirm medical eligibility or guarantee availability.
              Donation arrangements and eligibility must be confirmed
              through the hospital or blood bank.
            </p>

          </section>
        )}

      </main>
    </div>
  )
}

export default SearchDonors
