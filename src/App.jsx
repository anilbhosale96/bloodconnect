import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import HospitalDashboard from './pages/HospitalDashboard.jsx'
import CreateEmergencyRequest from './pages/CreateEmergencyRequest.jsx'
import BloodBankDashboard from './pages/BloodBankDashboard.jsx'
import DonorDashboard from './pages/DonorDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Portals */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute allowedRoles={['hospital', 'admin']}>
              <HospitalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/create-request"
          element={
            <ProtectedRoute allowedRoles={['hospital', 'admin']}>
              <CreateEmergencyRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blood-bank"
          element={
            <ProtectedRoute allowedRoles={['blood_bank', 'admin']}>
              <BloodBankDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor"
          element={
            <ProtectedRoute allowedRoles={['donor', 'admin']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
