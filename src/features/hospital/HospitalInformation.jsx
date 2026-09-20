import { Building2, MapPin, CheckCircle2, ShieldCheck, Phone, Navigation } from 'lucide-react'

export default function HospitalInformation({ hospital, profile }) {
  const hospitalName = hospital?.hospital_name || profile?.full_name || 'City Emergency Hospital'
  const city = hospital?.city || 'Central District'
  const address = hospital?.address || 'Healthcare Corridor, Sector 4'
  const lat = hospital?.latitude ?? 18.5204
  const lng = hospital?.longitude ?? 73.8567

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {hospitalName}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Facility
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{address}, {city}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Emergency Level 1 Node</span>
          </span>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
        <div>
          <span className="text-slate-400 font-medium block uppercase tracking-wider text-3xs">Location GPS</span>
          <span className="text-slate-800 font-semibold mt-0.5 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-slate-400" />
            {Number(lat).toFixed(4)}° N, {Number(lng).toFixed(4)}° E
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block uppercase tracking-wider text-3xs">Registered Email</span>
          <span className="text-slate-800 font-semibold mt-0.5 truncate block" title={profile?.email}>
            {profile?.email || 'hospital@lifelink.org'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block uppercase tracking-wider text-3xs">Emergency Hotline</span>
          <span className="text-slate-800 font-semibold mt-0.5 flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" />
            +91 108 / Priority Line
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block uppercase tracking-wider text-3xs">Network Protocol</span>
          <span className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live Realtime Active
          </span>
        </div>
      </div>
    </div>
  )
}
