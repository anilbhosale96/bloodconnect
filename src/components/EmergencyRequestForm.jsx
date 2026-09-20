import { useState, useEffect } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Loader2,
  MapPin,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react'
import {
  createEmergencyRequest,
  VALID_BLOOD_GROUPS,
  VALID_COMPONENTS,
  VALID_URGENCIES,
} from '../services/emergencyService.js'

export default function EmergencyRequestForm({
  hospitalId,
  defaultLat = 18.5204,
  defaultLng = 73.8567,
  onSuccess,
}) {
  const [bloodGroup, setBloodGroup] = useState('O+')
  const [componentType, setComponentType] = useState('Whole Blood')
  const [quantity, setQuantity] = useState(2)
  const [urgency, setUrgency] = useState('CRITICAL')
  const [latitude, setLatitude] = useState(defaultLat)
  const [longitude, setLongitude] = useState(defaultLng)
  const [locating, setLocating] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submittedData, setSubmittedData] = useState(null)

  // Try to obtain precise device/hospital GPS location if permitted
  useEffect(() => {
    let active = true
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (active) {
            setLatitude(Number(pos.coords.latitude.toFixed(6)))
            setLongitude(Number(pos.coords.longitude.toFixed(6)))
            setLocating(false)
          }
        },
        () => {
          if (active) setLocating(false)
        },
        { timeout: 5000 }
      )
    }
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmittedData(null)

    // Form client-side validation
    if (!bloodGroup || !VALID_BLOOD_GROUPS.includes(bloodGroup)) {
      setError('Please select a valid blood group.')
      return
    }

    if (!componentType || !VALID_COMPONENTS.includes(componentType)) {
      setError('Please select a valid blood component.')
      return
    }

    const numQty = Number(quantity)
    if (!quantity || isNaN(numQty) || numQty <= 0 || !Number.isInteger(numQty)) {
      setError('Quantity must be a positive integer greater than 0.')
      return
    }

    if (!urgency || !VALID_URGENCIES.includes(urgency)) {
      setError('Please select a valid urgency level.')
      return
    }

    setLoading(true)

    try {
      const { data, error: serviceError } = await createEmergencyRequest({
        blood_group: bloodGroup,
        component_type: componentType,
        quantity: numQty,
        urgency,
        latitude,
        longitude,
        hospital_id: hospitalId,
      })

      if (serviceError) {
        setError(serviceError.message || 'Failed to submit emergency blood request.')
        setLoading(false)
        return
      }

      setSubmittedData(data)
      if (onSuccess) {
        onSuccess(data)
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSubmittedData(null)
    setError(null)
    setBloodGroup('O+')
    setComponentType('Whole Blood')
    setQuantity(2)
    setUrgency('CRITICAL')
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-600 to-rose-700 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 text-white backdrop-blur-2xs shadow-xs">
            <Droplet className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Create Emergency Blood Request
            </h2>
            <p className="text-xs sm:text-sm text-red-100 mt-0.5">
              Dispatches emergency requirement to prioritized blood banks within radius
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Submission Error</span>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Success Confirmation Card */}
        {submittedData ? (
          <div className="py-6 px-4 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Status: {submittedData.status || 'CREATED'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Emergency Request Dispatched Successfully
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
                Your emergency request is now active in the system. The intelligent matching algorithm is identifying compatible blood banks.
              </p>
            </div>

            {/* Request Summary Details */}
            <div className="max-w-md mx-auto bg-slate-50 rounded-xl border border-slate-200 p-4 text-left grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold text-3xs">Blood Group</span>
                <p className="text-slate-900 font-extrabold text-sm">{submittedData.blood_group}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold text-3xs">Component</span>
                <p className="text-slate-900 font-extrabold text-sm">{submittedData.component_type}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold text-3xs">Quantity Required</span>
                <p className="text-slate-900 font-extrabold text-sm">{submittedData.quantity} Units</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold text-3xs">Urgency</span>
                <p className="text-red-600 font-extrabold text-sm">{submittedData.urgency}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-3xs text-slate-500">
                <span>GPS Location: {submittedData.latitude}° N, {submittedData.longitude}° E</span>
                <span>Deadline: Within 1 hr</span>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Another Request</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Blood Group (Dropdown) */}
            <div>
              <label
                htmlFor="blood_group"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                1. Required Blood Group <span className="text-red-500">*</span>
              </label>
              <select
                id="blood_group"
                name="blood_group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                disabled={loading}
                className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors cursor-pointer disabled:bg-slate-50"
              >
                {VALID_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg} (ABO / Rh compatible)
                  </option>
                ))}
              </select>
              <p className="mt-1 text-2xs text-slate-500">
                Select the exact patient blood group.
              </p>
            </div>

            {/* 2. Component Type (Dropdown) */}
            <div>
              <label
                htmlFor="component_type"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                2. Blood Component Type <span className="text-red-500">*</span>
              </label>
              <select
                id="component_type"
                name="component_type"
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                disabled={loading}
                className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors cursor-pointer disabled:bg-slate-50"
              >
                {VALID_COMPONENTS.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-2xs text-slate-500">
                Choose component (Whole Blood, Packed Red Blood Cells, Platelets, FFP, Cryoprecipitate).
              </p>
            </div>

            {/* 3. Quantity (Number) */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                3. Quantity (Units Needed) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. 2"
                  className="block w-36 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-50"
                />
                <span className="text-sm font-semibold text-slate-600">
                  Standard blood bags (&gt;0)
                </span>
              </div>
            </div>

            {/* 4. Urgency (Radio) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                4. Urgency Classification <span className="text-red-500">*</span>
              </label>
              <div
                role="radiogroup"
                aria-label="Urgency level"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {/* CRITICAL (Red) */}
                <label
                  onClick={() => setUrgency('CRITICAL')}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    urgency === 'CRITICAL'
                      ? 'border-red-500 bg-red-50/70 ring-2 ring-red-500/30 text-red-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/20 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value="CRITICAL"
                    checked={urgency === 'CRITICAL'}
                    onChange={() => setUrgency('CRITICAL')}
                    className="mt-0.5 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-extrabold text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      CRITICAL
                    </span>
                    <span className="text-2xs text-red-800/80 mt-0.5 block leading-snug">
                      Immediate life threat (&lt;1 hr window)
                    </span>
                  </div>
                </label>

                {/* HIGH (Amber) */}
                <label
                  onClick={() => setUrgency('HIGH')}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    urgency === 'HIGH'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/30 text-amber-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/20 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value="HIGH"
                    checked={urgency === 'HIGH'}
                    onChange={() => setUrgency('HIGH')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-extrabold text-amber-700 flex items-center gap-1.5">
                      HIGH
                    </span>
                    <span className="text-2xs text-amber-800/80 mt-0.5 block leading-snug">
                      Acute deficit / surgery (&lt;3 hr window)
                    </span>
                  </div>
                </label>

                {/* NORMAL (Gray) */}
                <label
                  onClick={() => setUrgency('NORMAL')}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    urgency === 'NORMAL'
                      ? 'border-slate-600 bg-slate-100 ring-2 ring-slate-400/30 text-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value="NORMAL"
                    checked={urgency === 'NORMAL'}
                    onChange={() => setUrgency('NORMAL')}
                    className="mt-0.5 text-slate-600 focus:ring-slate-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                      NORMAL
                    </span>
                    <span className="text-2xs text-slate-500 mt-0.5 block leading-snug">
                      Sub-acute routine (&lt;6 hr window)
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* GPS Location Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Dispatch GPS: <strong>{latitude}° N, {longitude}° E</strong>
                </span>
              </div>
              {locating && (
                <span className="text-2xs text-blue-600 font-semibold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Detecting GPS...
                </span>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Transmitting Emergency Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Emergency Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
