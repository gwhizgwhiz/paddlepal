// File: src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import RequireNoProfile from './components/RequireNoProfile'
import RequireProfile from './components/RequireProfile'
import AppLayout from './components/AppLayout'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CheckEmailPage from './pages/CheckEmailPage'
import DashboardPage from './pages/DashboardPage'
import CompleteProfilePage from './pages/CompleteProfilePage'
import ProfileEditPage from './pages/ProfileEditPage'

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <AppLayout>
              <HomePage />
            </AppLayout>
          }
        />
        <Route
          path="/login"
          element={
            <AppLayout>
              <LoginPage />
            </AppLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <AppLayout>
              <SignupPage />
            </AppLayout>
          }
        />
        <Route
          path="/check-email"
          element={
            <AppLayout>
              <CheckEmailPage />
            </AppLayout>
          }
        />

        {/* Protected Dashboard: requires auth + profile */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <RequireProfile>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </RequireProfile>
            </RequireAuth>
          }
        />

        {/* Complete Profile: signed-in users without a profile */}
        <Route
          path="/profile/complete"
          element={
            <RequireAuth>
              <RequireNoProfile>
                <AppLayout>
                  <CompleteProfilePage />
                </AppLayout>
              </RequireNoProfile>
            </RequireAuth>
          }
        />

        {/* Edit Profile: signed-in users with a profile */}
        <Route
          path="/profile/edit"
          element={
            <RequireAuth>
              <RequireProfile>
                <AppLayout>
                  <ProfileEditPage />
                </AppLayout>
              </RequireProfile>
            </RequireAuth>
          }
        />

        {/* Fallback: redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
