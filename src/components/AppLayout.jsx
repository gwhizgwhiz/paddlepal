// AppLayout.jsx
import Header from './Header'
import Footer from './Footer'
import '../App.css'

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  )
}
