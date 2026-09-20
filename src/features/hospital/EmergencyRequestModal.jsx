import { useState } from 'react'
import { AlertCircle, AlertTriangle, Clock, Droplets, Loader2, X, Plus, Minus } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const COMPONENT_TYPES = [
  'Whole Blood',
  'Red Blood Cells (RBC)',
  'Platelets',
  'Fresh Frozen Plasma (FFP)',
  'Cryoprecipitate',
]

const URGENCIES = [
  { id: 'CRITICAL', label: 'Critical (<1 hr)', desc: 'Life-threatening emergency (e.g. trauma, ICU hemorrhage)', color: 'bg-red-50 text-red-700 border-red-300' },
  { id: 'HIGH', label: 'High Priority (<3 hrs)', desc: 'Scheduled surgical emergency or acute deficit', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  { id: 'MEDIUM', label: 'Medium (<6 hrs)', desc: 'Sub-acute replacement & stabilization', color: 'bg-blue-50 text-blue-700 border-blue-300' },
]

export default function EmergencyRequestModal({
  isOpen,
  onClose,
  hospitalId,
  onRequestCreated,
}) {
  const [bloodGroup, setBloodGroup] = useState('O+')
  const [componentType, setComponentType] = useState('Whole Blood')
  const [count, setCount] = useState(2)
  const [urgency, setUrgency] = useState('CRITICAL')
  const [deadlineHours, setDeadlineHours] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!bloodGroup || !componentType || !count || count <= 0) {
      setError('Please select valid blood group, component type, and unit count.')
      return
    }

    setLoading(true)

    try {
      const deadlineDate = new Date(Date.now() + deadlineHours * 60 * 60 * 1000).toISOString()

      const payload = {
        hospital_id: hospitalId || '00000000-0000-0000-0000-000000000000',
        blood_group: bloodGroup,
        component_type: componentType,
        count: parseInt(count, 10),
        urgency: urgency,
        status: 'PENDING',
        deadline: deadlineDate,
      }

      const { data, error: insertError } = await supabase
        .from('emergency_requests')
        .insert(payload)
        .select()
        .single()

      if (insertError) {
        // If hospital_id FK fails because no hospital record exists, retry with null or handle gracefully
        if (insertError.message?.includes('foreign key') || insertError.code === '23503') {
          // Let's notify and fallback with valid reference if needed
          throw new Error(`Database error: ${insertError.message}`)
        }
        throw insertError
      }

      onRequestCreated(data)
      onClose()
    } catch (err) {
      console.error('Failed to create emergency request:', err)
      setError(err?.message || 'Failed to submit emergency request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">Create Emergency Blood Request</h3>
              <p className="text-2xs text-red-100">Initiates automated multi-factor matching across network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Blood Group Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Required Blood Group <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  aria-label={`Select ${bg} blood group`}
                  onClick={() => setBloodGroup(bg)}
                  className={`py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer inline-flex items-center justify-center gap-1 ${
                    bloodGroup === bg
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Droplets className="w-3 h-3" />
                  <span>{bg}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Component Type & Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-component-type" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Component Type <span className="text-red-500">*</span>
              </label>
              <select
                id="modal-component-type"
                aria-label="Blood component type"
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COMPONENT_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="modal-units-count" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Units Needed (Bags) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Decrease units"
                  onClick={() => setCount((prev) => Math.max(1, prev - 1))}
                  className="w-9 h-9 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  id="modal-units-count"
                  aria-label="Units count"
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  aria-label="Increase units"
                  onClick={() => setCount((prev) => prev + 1)}
                  className="w-9 h-9 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Urgency Classification <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {URGENCIES.map((u) => (
                <label
                  key={u.id}
                  onClick={() => setUrgency(u.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    urgency === u.id
                      ? `${u.color} ring-1 ring-current shadow-2xs`
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={u.id}
                    checked={urgency === u.id}
                    onChange={() => setUrgency(u.id)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold block">{u.label}</span>
                    <span className="text-3xs text-slate-500 leading-tight block">{u.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Target Response Deadline */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Response Window Deadline</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 6].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  aria-label={`Deadline within ${hrs} hour`}
                  onClick={() => setDeadlineHours(hrs)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border cursor-pointer inline-flex items-center justify-center gap-1 ${
                    deadlineHours === hrs
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Within {hrs}h</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Request...</span>
                </>
              ) : (
                <>
                  <Droplets className="w-4 h-4" />
                  <span>Dispatch Emergency Call</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

