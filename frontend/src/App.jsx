import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { homePath, useAuth } from './context/AuthContext'
import VerifyOTPPage from './pages/VerifyOTPPage'

import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Notifications from './pages/Notifications'
import History from './pages/History'

import DonorDashboard from './pages/donor/DonorDashboard'
import BrowseHospitals from './pages/donor/BrowseHospitals'
import MyRequests from './pages/donor/MyRequests'
import DonorProfile from './pages/donor/DonorProfile'

import HospitalDashboard from './pages/hospital/HospitalDashboard'
import HospitalRequests from './pages/hospital/HospitalRequests'
import SendRequest from './pages/hospital/SendRequest'

import AdminDashboard from './pages/admin/AdminDashboard'
import VerifyHospitals from './pages/admin/VerifyHospitals'
import ManageUsers from './pages/admin/ManageUsers'
import AllRequests from './pages/admin/AllRequests'

export default function App() {
  const { user } = useAuth()

  const only = (roles, page) => <ProtectedRoute roles={roles}>{page}</ProtectedRoute>

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTPPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Donor */}
        <Route path="/donor" element={only(['donor'], <DonorDashboard />)} />
        <Route path="/donor/hospitals" element={only(['donor'], <BrowseHospitals />)} />
        <Route path="/donor/requests" element={only(['donor'], <MyRequests />)} />
        <Route path="/donor/profile" element={only(['donor'], <DonorProfile />)} />

        {/* Hospital manager */}
        <Route path="/hospital" element={only(['hospital_manager'], <HospitalDashboard />)} />
        <Route path="/hospital/requests" element={only(['hospital_manager'], <HospitalRequests />)} />
        <Route path="/hospital/send" element={only(['hospital_manager'], <SendRequest />)} />

        {/* Admin */}
        <Route path="/admin" element={only(['admin'], <AdminDashboard />)} />
        <Route path="/admin/hospitals" element={only(['admin'], <VerifyHospitals />)} />
        <Route path="/admin/users" element={only(['admin'], <ManageUsers />)} />
        <Route path="/admin/requests" element={only(['admin'], <AllRequests />)} />

        {/* Shared */}
        <Route path="/history" element={only(['donor', 'hospital_manager'], <History />)} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? homePath(user.role) : '/login'} replace />} />
    </Routes>
  )
}
