import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import MyInfo from './pages/MyInfo'
import Projects from './pages/Projects'
import Participants from './pages/Participants'
import Sponsorships from './pages/Sponsorships'
import Expenses from './pages/Expenses'
import Approvals from './pages/Approvals'
import ExpenseRequest from './pages/ExpenseRequest'
import UserManagement from './pages/UserManagement'
import GolfTournaments from './pages/GolfTournaments'
import Login from './pages/Login'
import Register from './pages/Register'
import FindUserId from './pages/FindUserId'
import ResetPassword from './pages/ResetPassword'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/find-user-id" element={<FindUserId />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="my-info" element={<MyInfo />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="projects" element={<Projects />} />
        <Route path="participants" element={<Participants />} />
        <Route path="sponsorships" element={<Sponsorships />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/request" element={<ExpenseRequest />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="golf-tournaments" element={<GolfTournaments />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
