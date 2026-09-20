import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, AlertTriangle, Clock, Plus, ShieldCheck, RefreshCw } from 'lucide-react'
import Header from '../components/Header.jsx'
import HospitalInformation from '../features/hospital/HospitalInformation.jsx'
import ActiveEmergencyRequests from '../features/hospital/ActiveEmergencyRequests.jsx'
import BloodAvailabilityOverview from '../features/hospital/BloodAvailabilityOverview.jsx'
import EmergencyRequestModal from '../features/hospital/EmergencyRequestModal.jsx'
import NotificationsPanel from '../features/hospital/NotificationsPanel.jsx'
import { getCurrentUser, getUserProfile } from '../services/auth.js'
import { getEmergencyRequests } from '../services/emergencyService.js'
import { supabase } from '../lib/supabase.js'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates.js'

export default function HospitalDashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [hospital, setHospital] = useState(null)
  const [requests, setRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const { data: currentUser, error: userError } = await getCurrentUser()
        if (userError || !currentUser) {
          if (!ignore) setLoading(false)
          return
        }
        if (ignore) return

        setUser(currentUser)

        // 1. Fetch user profile
        const { data: prof } = await getUserProfile(currentUser.id)
        if (!ignore) {
          setProfile(prof || { full_name: currentUser.user_metadata?.full_name, role: 'hospital' })
        }

        // 2. Fetch hospital record for this user
        const { data: hospData } = await supabase
          .from('hospitals')
          .select('*')
          .eq('profile_id', currentUser.id)
          .maybeSingle()

        if (!ignore) {
          if (hospData) {
            setHospital(hospData)
          } else {
            setHospital({
              id: currentUser.id,
              hospital_name: prof?.full_name || currentUser.user_metadata?.full_name || 'City General Hospital',
              city: 'Central District',
              address: 'Main Health Corridor, Sector 4',
              latitude: 18.5204,
              longitude: 73.8567,
            })
          }
        }

        // 3. Fetch emergency requests
        const { data: reqData } = await getEmergencyRequests(currentUser?.id)
        let localReqs = []
        try {
          localReqs = JSON.parse(localStorage.getItem('lifelink_demo_requests') || '[]')
        } catch {}

        const merged = [
          ...localReqs,
          ...(reqData || []).filter((r) => !localReqs.some((lr) => lr.id === r.id)),
        ]

        if (!ignore) {
          setRequests(merged)
        }

        // 4. Fetch notifications
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .order('id', { ascending: false })
          .limit(20)

        if (!ignore && notifData) {
          setNotifications(notifData)
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        if (!ignore) setError('Failed to load emergency dashboard data. Please try again.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [refreshTrigger])

  const loadDashboardData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  // Pure Supabase Realtime Listener (no polling, no memory leaks)
  useRealtimeUpdates({
    onEmergencyRequest: (change) => {
      if (change.eventType === 'INSERT' && change.new) {
        setRequests((prev) => [change.new, ...prev.filter((r) => r.id !== change.new.id)])
      } else if (change.eventType === 'UPDATE' && change.new) {
        setRequests((prev) =>
          prev.map((r) => (r.id === change.new.id ? { ...r, ...change.new } : r))
        )
      } else if (change.eventType === 'DELETE' && change.old) {
        setRequests((prev) => prev.filter((r) => r.id !== change.old.id))
      }
    },
    onResponse: () => {
      // Refresh dashboard immediately when a blood bank submits a response
      loadDashboardData()
    },
  })

  const handleRequestCreated = (newRequest) => {
    setRequests((prev) => [newRequest, ...prev])
  }

  const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length

  const activeRequestsCount = requests.filter(
    (r) => r.status !== 'FULFILLED' && r.status !== 'CANCELLED'
  ).length
  const criticalCount = requests.filter((r) => r.urgency === 'CRITICAL').length
  const fulfilledCount = requests.filter((r) => r.status === 'FULFILLED').length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header
        hospitalName={hospital?.hospital_name || profile?.full_name || 'Hospital'}
        city={hospital?.city || 'Metro'}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onCreateEmergencyClick={() => setIsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center gap-1.5 text-xs font-bold underline hover:no-underline text-red-700 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Hospital Info & Verification Card */}
        <HospitalInformation
          hospital={hospital}
          profile={profile || { email: user?.email }}
        />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                Active Emergencies
              </span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {loading ? '-' : activeRequestsCount}
              </p>
              <span className="text-3xs text-slate-500 mt-0.5 block">
                Requires blood bank fulfillment
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                Critical Priority
              </span>
              <p className="text-3xl font-extrabold text-red-600 mt-1">
                {loading ? '-' : criticalCount}
              </p>
              <span className="text-3xs text-slate-500 mt-0.5 block">
                Immediate response needed (&lt;1 hr)
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                Units Fulfilled
              </span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                {loading ? '-' : fulfilledCount}
              </p>
              <span className="text-3xs text-slate-500 mt-0.5 block">
                Successfully resolved requests
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Emergency Request Trigger Banner */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-white/20 text-white uppercase tracking-wider mb-2">
              Fast Dispatch
            </span>
            <h3 className="text-xl font-bold">Initiate Intelligent Emergency Blood Match</h3>
            <p className="text-xs text-red-100 mt-1 max-w-xl">
              System identifies optimal resources using deterministic 40% availability + 30% distance + 20% urgency + 10% freshness ranking in under 10 seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 bg-white hover:bg-slate-50 text-red-700 font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Emergency Request</span>
          </button>
        </div>

        {/* Active Emergency Requests Section */}
        <ActiveEmergencyRequests
          requests={requests}
          loading={loading}
          onRefresh={loadDashboardData}
          onCreateRequest={() => setIsModalOpen(true)}
        />

        {/* Blood Availability Overview */}
        <BloodAvailabilityOverview />
      </main>

      {/* Emergency Request Creation Modal */}
      <EmergencyRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hospitalId={hospital?.id}
        onRequestCreated={handleRequestCreated}
      />

      {/* Notifications Slide-over Panel */}
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />
    </div>
  )
}
