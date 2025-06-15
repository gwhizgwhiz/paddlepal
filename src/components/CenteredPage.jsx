// CenteredPage.jsx
// Reusable layout wrapper for centered page content (login, signup, dashboard cards)

import React from 'react'
import '../App.css' // ensure this includes .page-wrapper and .page-container styles

export default function CenteredPage({ children }) {
  return (
    <div className="page-wrapper">
      <div className="page-container">
        {children}
      </div>
    </div>
  )
}
