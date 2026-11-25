
import { Link, useNavigate } from 'react-router-dom'

function AdminDashboard() {
  const navigate = useNavigate()

  function handleLogout() {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="dashboard-page admin-dashboard">
      <header className="dashboard-header">
        <h1>RaktConnect<span>.</span></h1>

        <nav>
          <Link to="/">Home</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <p className="section-label">ADMIN CONTROL PANEL</p>
          <h1>Welcome, Administrator!</h1>
          <p>
            Manage platform users, review blood requests and
            monitor donation confirmations.
          </p>
        </section>

        <section className="admin-overview">
          <div>
            <span>PLATFORM</span>
            <h2>Management Overview</h2>
            <p>Choose a section to review and manage.</p>
          </div>
          <div className="admin-overview-icon">✚</div>
        </section>

        <section className="admin-management">
          <p className="section-label">MANAGEMENT SECTIONS</p>
          <h2>Manage RaktConnect</h2>

          <div className="dashboard-cards admin-cards">
            <div className="dashboard-card admin-card">
              <div className="admin-card-icon">♥</div>
              <h3>Donor Verification</h3>
              <p>
                Review donor accounts and their submitted
                verification information.
              </p>
              <Link to="/admin-donors">Review Donors →</Link>
            </div>

            <div className="dashboard-card admin-card">
              <div className="admin-card-icon">♙</div>
              <h3>Requester Verification</h3>
              <p>
                Review requester accounts and their
                verification details.
              </p>
              <Link to="/admin-requesters">Review Requesters →</Link>
            </div>

            <div className="dashboard-card admin-card">
              <div className="admin-card-icon">＋</div>
              <h3>Blood Request Review</h3>
              <p>
                Check blood request details and submitted
                hospital documents.
              </p>
              <Link to="/admin-requests">Review Requests →</Link>
            </div>

            <div className="dashboard-card admin-card">
              <div className="admin-card-icon">✓</div>
              <h3>Donation Confirmations</h3>
              <p>
                Review donation completion records and
                confirmation submissions.
              </p>
              <Link to="/admin-confirmations">Review Confirmations →</Link>
            </div>
          </div>
        </section>

        <section className="admin-footer-note">
          <strong>RaktConnect Administration</strong>
          <p>
            Responsible management helps maintain a reliable
            donor coordination platform.
          </p>
        </section>
      </main>
    </div>
  )
}

export default AdminDashboard
