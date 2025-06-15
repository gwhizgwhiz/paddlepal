import React from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

export default function CheckEmailPage() {
  return (
    <div className="page-wrapper">
      <div className="page-container">
        <h2>📬 Check Your Email</h2>
        <p>
          A confirmation link has been sent to your email address. Please check
          your inbox and click the link to complete your signup.
        </p>
        <p>
          Once confirmed, you can return and{' '}
          <Link to="/profile/complete" className="link-inline">
            complete your profile
          </Link>
          .
        </p>
        <Link to="/" className="btn btn-small btn-outline">
          ⬅ Back to Home
        </Link>
      </div>
    </div>
  )
}
