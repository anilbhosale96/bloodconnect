import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Clock,
  Droplets,
  Loader2,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import Header from '../components/Header.jsx'
import RequestResponseModal from '../components/RequestResponseModal.jsx'
import {
  calculateHaversineDistance,
  getEmergencyRequestWithHospital,
} from '../services/responseService.js'
import { getCurrentUser, getUserProfile } from '../services/auth.js'

export default function EmergencyRequestDetail() {
  const { id } = useParams()
  const [request, setRequest] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const bloodBankCoords = { latitude: 18.5204, longitude: 73.8567 }

  useEffect(() => {
    async function load() {
      try {
        const { data: user } = await getCurrentUser()
        if (user) {
          const { data: prof } = await getUserProfile(user.id)
          setProfile(prof || { full_name: user.user_metadata?.full_name, role: 'blood_bank' })
        }

        if (id) {
          const { data: reqData, error: reqErr } = await getEmergencyRequestWithHospital(id)
          if (reqErr || !reqData) {
            setError(reqErr?.message || 'Emergency request not found.')
          } else {
            setRequest(reqData)
          }
        }
      } catch (err) {
        setError(err?.message || 'Failed to load request.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading emergency dispatch details...</p>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Request Not Available</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">{error || 'This emergency request could not be located.'}</p>
          <Link
            to="/blood-bank"
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            Return to Blood Bank Portal
          </Link>
        </div>
      </div>
    )
  }

  const requestedUnits = request.count || request.quantity || 1
  const hospitalName = request.hospital?.hospital_name || 'City Hospital'
  const hospitalCity = request.hospital?.city || 'Metro District'
  const distanceKm = calculateHaversineDistance(
    bloodBankCoords.latitude,
    bloodBankCoords.longitude,
    request.latitude,
    request.longitude
  )

  const isCritical = request.urgency === 'CRITICAL'
  const isHigh = request.urgency === 'HIGH'
  const urgencyColor = isCritical
    ? 'bg-red-600 text-white'
    : isHigh
    ? 'bg-amber-500 text-white'
    : 'bg-slate-700 text-white'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        hospitalName="Central Blood Bank"
        city="Metro Hub"
        unreadNotificationsCount={0}
        onOpenNotifications={() => {}}
        onCreateEmergencyClick={() => {}}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link
            to="/blood-bank"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blood Bank Dashboard</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audited Emergency Call</span>
          </div>
        </div>

        {/* Main Emergency Detail Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className={`p-6 text-white ${isCritical ? 'bg-red-600' : 'bg-slate-900'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-white text-red-600 font-black text-xl flex items-center justify-center shadow-xs">
                  {request.blood_group}
                </span>
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-white/20 text-white mb-1">
                    Emergency Call ID: #{request.id.slice(0, 8)}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold">
                    {request.blood_group} &bull; {request.component_type || 'Whole Blood'}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider ${urgencyColor}`}>
                  {request.urgency} URGENCY
                </span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Grid Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-3xs">Quantity Demanded</span>
                <p className="text-slate-900 font-black text-base mt-0.5">{requestedUnits} Units (Bags)</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-3xs">Proximity Distance</span>
                <p className="text-emerald-700 font-bold text-base mt-0.5 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {distanceKm} km away
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-3xs">Request Status</span>
                <p className="text-blue-700 font-bold text-base mt-0.5">{request.status || 'CREATED'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-3xs">Response Deadline</span>
                <p className="text-slate-900 font-bold text-base mt-0.5 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Within 1 hr
                </p>
              </div>
            </div>

            {/* Requesting Hospital Information */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Requesting Hospital Department
              </h4>
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{hospitalName}</p>
                  <p className="text-xs text-slate-500">{request.hospital?.address || 'Healthcare Corridor'}, {hospitalCity}</p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Responding promptly locks inventory and dispatches real-time courier alerts to the hospital.
              </p>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Droplets className="w-4 h-4" />
                <span>Respond to Emergency Call</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Response Modal */}
      <RequestResponseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={request}
        responderId={profile?.id}
        bloodBankLocation={bloodBankCoords}
        onResponseSuccess={() => {
          setRequest((prev) => ({ ...prev, status: 'NOTIFIED' }))
        }}
      />
    </div>
  )
}

