import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartHandshake, LogOut, Activity } from 'lucide-react'
import { getCurrentUser, getUserProfile, signOut } from '../services/auth.js'

export default function DonorDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: user } = await getCurrentUser()
      if (user) {
        const { data: prof } = await getUserProfile(user.id)
        setProfile(prof || { full_name: user.user_metadata?.full_name, role: 'donor' })
      }
    }
    load()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg">LIFE-LINK</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Donor Portal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:inline">
              {profile?.full_name || 'Donor'}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Emergency Donor Response
        </h1>
        <p className="text-sm text-slate-600 mt-1 mb-8">
          Nearby compatible emergency calls requiring immediate donor support
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Ready for Emergency Calls</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            You will receive instant location-based notifications when a patient matches your blood profile within your radius.
          </p>
        </div>
      </main>
    </div>
  )
}
