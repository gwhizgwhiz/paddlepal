// HomePage.jsx
// Clean hero-style landing page for PaddlePal

import { Link } from 'react-router-dom'
import CenteredPage from '../components/CenteredPage'
import '../App.css'

export default function HomePage() {
  return (
    <CenteredPage>
    <div className="home-container">
      <section className="hero-section">
        <h1 className="hero-title">PaddlePal 🏓</h1>
        <p className="hero-tagline">Your personal pickleball coach in your pocket.</p>
        <Link to="/signup" className="btn btn-primary">Get Started</Link>
      </section>
    </div>
    </CenteredPage>
  )
}