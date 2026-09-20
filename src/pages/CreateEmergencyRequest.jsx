import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import Header from '../components/Header.jsx'
import EmergencyRequestForm from '../components/EmergencyRequestForm.jsx'
import { getCurrentUser, getUserProfile } from '../services/auth.js'
import { supabase } from '../lib/supabase.js'

export default function CreateEmergencyRequest() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [hospital, setHospital] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: user } = await getCurrentUser()
      if (user) {
        const { data: prof } = await getUserProfile(user.id)
        setProfile(prof || { full_name: user.user_metadata?.full_name, role: 'hospital' })

        const { data: hosp } = await supabase
          .from('hospitals')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (hosp) {
          setHospital(hosp)
        } else {
          setHospital({
            id: user.id,
            hospital_name: prof?.full_name || 'City Hospital',
            city: 'Central District',
            latitude: 18.5204,
            longitude: 73.8567,
          })
        }
      }
    }
    load()
  }, [])

  const handleSuccess = (data) => {
    // Redirect directly to Matching Results HERO SCREEN
    setTimeout(() => {
      const id = data?.id
      if (id) {
        navigate(`/hospital/matching-results?requestId=${id}`)
      } else {
        navigate('/hospital/matching-results')
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <Header
        hospitalName={hospital?.hospital_name || profile?.full_name || 'Hospital'}
        city={hospital?.city || 'Metro'}
        unreadNotificationsCount={0}
        onOpenNotifications={() => {}}
        onCreateEmergencyClick={() => {}}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb / Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/hospital"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hospital Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Audit Trail Enabled</span>
          </div>
        </div>

        {/* Emergency Request Form Component */}
        <EmergencyRequestForm
          hospitalId={hospital?.id}
          defaultLat={hospital?.latitude || 18.5204}
          defaultLng={hospital?.longitude || 73.8567}
          onSuccess={handleSuccess}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        LIFE-LINK Emergency Blood Response System
      </footer>
    </div>
  )
}
