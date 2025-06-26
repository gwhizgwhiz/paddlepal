// src/components/Card.jsx
import React from 'react'
import '../App.css' // Ensure this path is correct based on your project structure

export default function Card({ children }) {
  return <div className="card">{children}</div>
}
