import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, LogOut, Package, BellRing, CheckCircle2 } from 'lucide-react'
import { getCurrentUser, getUserProfile, signOut } from '../services/auth.js'

export default function BloodBankDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: user } = await getCurrentUser()
      if (user) {
        const { data: prof } = await getUserProfile(user.id)
        setProfile(prof || { full_name: user.user_metadata?.full_name, role: 'blood_bank' })
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
            <div className="p-2 bg-red-600 text-white rounded-xl">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg">LIFE-LINK</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                Blood Bank Portal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:inline">
              {profile?.full_name || 'Blood Bank Operator'}
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
          Blood Bank Inventory &amp; Emergency Fulfillment
        </h1>
        <p className="text-sm text-slate-600 mt-1 mb-8">
          Manage live stock and respond immediately to priority emergency matches
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Incoming Alerts</span>
              <BellRing className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Inventory Units</span>
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Fulfillments Complete</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
          </div>
        </div>
      </main>
    </div>
  )
}

