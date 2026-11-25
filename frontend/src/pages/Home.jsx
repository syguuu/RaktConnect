
import '../App.css'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="website">

      <nav className="navbar">
        <h2 className="logo">RaktConnect<span>.</span></h2>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="nav-buttons">
          <Link to="/login" className="login-btn">Login</Link>
          <Link to="/register" className="register-btn">Get Started</Link>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="tagline">❤️ EVERY DROP COUNTS</p>

          <h1>
            Connecting Lives,
            <span> One Donation</span> at a Time.
          </h1>

          <p className="hero-description">
            Every second matters. RaktConnect brings blood donors
            and people in need closer through a simple platform
            for finding donors and coordinating requests.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="hero-btn">
              Join RaktConnect →
            </Link>
            <Link to="/login" className="hero-secondary-btn">
              Login to your account
            </Link>
          </div>

          <p className="hero-note">
            A community-driven platform for easier blood donation coordination.
          </p>
        </div>

        <div className="hero-image">
          <div className="blood-symbol">+</div>
          <h2>Be someone's hope.</h2>
          <p>A connection today can make a difference tomorrow.</p>
          <div className="hero-decoration">RAKTCONNECT</div>
        </div>
      </section>

      <section className="about" id="about">
        <p className="section-label">ABOUT RAKTCONNECT</p>
        <h2>Bringing donors and requesters together.</h2>
        <p>
          RaktConnect is a blood donor coordination platform that
          helps requesters find potential donors based on blood
          group and location. It also provides tools to manage
          requests, communicate and coordinate donation confirmations.
        </p>
      </section>

      <section className="how-it-works" id="how-it-works">
        <p className="section-label">SIMPLE. CONNECTED. ACCESSIBLE.</p>
        <h2>How RaktConnect works</h2>
        <p className="steps-description">
          A simple process designed to make donor coordination easier.
        </p>

        <div className="steps">
          <div className="step-card">
            <h3>01</h3>
            <h4>Create an account</h4>
            <p>Register as a donor or requester to access the platform.</p>
          </div>

          <div className="step-card">
            <h3>02</h3>
            <h4>Find and connect</h4>
            <p>Search for potential donors using blood group and location.</p>
          </div>

          <div className="step-card">
            <h3>03</h3>
            <h4>Coordinate requests</h4>
            <p>Manage requests, communicate and track confirmations.</p>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <h2>Be a part of the connection.</h2>
        <p>Join RaktConnect and help make donor coordination simpler.</p>
        <Link to="/register" className="hero-btn">
          Get Started →
        </Link>
      </section>

      <footer id="contact">
        <h2>RaktConnect<span>.</span></h2>
        <p>Connecting people. Supporting communities.</p>
        <p>© 2026 RaktConnect. All rights reserved.</p>
      </footer>

    </div>
  )
}

export default Home
