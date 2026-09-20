import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import { getCurrentUser, getUserProfile } from '../services/auth.js'

/**
 * ProtectedRoute Component
 * Guards routes based on authentication status and allowed user roles.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string|string[]} [props.allowedRoles]
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const { data: currentUser } = await getCurrentUser()

        if (!currentUser) {
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        const { data: profile } = await getUserProfile(currentUser.id)
        const role = profile?.role || currentUser.user_metadata?.role || 'donor'

        if (isMounted) {
          setUser(currentUser)
          setUserRole(role)

          if (allowedRoles) {
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
            if (!roles.includes(role)) {
              setUnauthorized(true)
            }
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Error verifying route protection:', err)
        if (isMounted) setLoading(false)
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [allowedRoles])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Verifying security credentials...</p>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Logged in but not the required role
  if (unauthorized) {
    const roleRoutes = {
      hospital: '/hospital',
      blood_bank: '/blood-bank',
      donor: '/donor',
      admin: '/admin',
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600 mt-2">
            This portal is restricted to{' '}
            <strong className="text-slate-800">
              {Array.isArray(allowedRoles) ? allowedRoles.join(' / ') : allowedRoles}
            </strong>{' '}
            personnel only. Your current role is{' '}
            <strong className="text-blue-600">{userRole}</strong>.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={roleRoutes[userRole] || '/'}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              Go to Your Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return children
}

