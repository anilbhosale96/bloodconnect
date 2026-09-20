import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import HospitalDashboard from './pages/HospitalDashboard.jsx'
import CreateEmergencyRequest from './pages/CreateEmergencyRequest.jsx'
import MatchingResults from './pages/MatchingResults.jsx'
import RequestDetail from './pages/RequestDetail.jsx'
import BloodBankDashboard from './pages/BloodBankDashboard.jsx'
import EmergencyRequestDetail from './pages/EmergencyRequestDetail.jsx'
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
          path="/hospital/matching-results"
          element={
            <ProtectedRoute allowedRoles={['hospital', 'admin']}>
              <MatchingResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matching-results"
          element={
            <ProtectedRoute allowedRoles={['hospital', 'admin']}>
              <MatchingResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/requests/:id"
          element={
            <ProtectedRoute allowedRoles={['hospital', 'admin']}>
              <RequestDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/:id"
          element={
            <ProtectedRoute allowedRoles={['hospital', 'admin']}>
              <RequestDetail />
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
          path="/blood-bank/requests/:id"
          element={
            <ProtectedRoute allowedRoles={['blood_bank', 'admin']}>
              <EmergencyRequestDetail />
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
