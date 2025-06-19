import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useUser } from './context/UserContext'
import AppLayout from './components/AppLayout'
import LoadingSpinner from './components/LoadingSpinner'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CheckEmailPage from './pages/CheckEmailPage'
import DashboardPage from './pages/DashboardPage'
import CompleteProfilePage from './pages/CompleteProfilePage'
import ProfileEditPage from './pages/ProfileEditPage'

export default function App() {
  const { loading, profile } = useUser()

  return (
    <Router>
      {loading ? (
        <div className="full-screen-loader">
          <LoadingSpinner />
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<AppLayout><HomePage/></AppLayout>} />
          <Route path="/login" element={<AppLayout><LoginPage/></AppLayout>} />
          <Route path="/signup" element={<AppLayout><SignupPage/></AppLayout>} />
          <Route path="/check-email" element={<AppLayout><CheckEmailPage/></AppLayout>} />

          <Route
            path="/dashboard"
            element={
              profile
                ? <AppLayout><DashboardPage/></AppLayout>
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/profile/complete"
            element={
              profile
                ? <Navigate to="/dashboard" replace />
                : <AppLayout><CompleteProfilePage/></AppLayout>
            }
          />

          <Route
            path="/profile/edit"
            element={
              profile
                ? <AppLayout><ProfileEditPage/></AppLayout>
                : <Navigate to="/profile/complete" replace />
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Router>
  )
}
