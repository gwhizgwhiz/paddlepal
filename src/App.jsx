import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import supabase from './supabaseClient'
import RequireAuth from './components/RequireAuth'
import AppLayout from './components/AppLayout'


import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import CompleteProfilePage from './pages/CompleteProfilePage'
import CheckEmailPage from './pages/CheckEmailPage'

import ProfileEditPage from './pages/ProfileEditPage'
import RequireProfile from './components/RequireProfile'
import RequireNoProfile from './components/RequireNoProfile'


function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session:', session)
    })
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
        <Route path="/login" element={<AppLayout><LoginPage /></AppLayout>} />
        <Route path="/signup" element={<AppLayout><SignupPage /></AppLayout>} />
        <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/check-email" element={<AppLayout><CheckEmailPage /></AppLayout>} />

        <Route path="/profile/complete" element={
          <RequireAuth>
            <RequireNoProfile>
              <AppLayout><CompleteProfilePage /></AppLayout>
            </RequireNoProfile>
          </RequireAuth>
        } />

        <Route path="/profile/edit" element={
          <RequireAuth>
            <RequireProfile>
              <AppLayout><ProfileEditPage /></AppLayout>
            </RequireProfile>
          </RequireAuth>
        } />

      </Routes>
    </Router>
  )
}

export default App
