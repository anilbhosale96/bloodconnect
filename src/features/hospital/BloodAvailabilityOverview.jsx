import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function BloodAvailabilityOverview() {
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInventory() {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('blood_group, available_units, count')

        if (!error && data) {
          const counts = {}
          BLOOD_GROUPS.forEach((bg) => {
            counts[bg] = 0
          })
          data.forEach((item) => {
            const group = item.blood_group
            const units = item.available_units ?? item.count ?? 0
            if (counts[group] !== undefined) {
              counts[group] += units
            }
          })
          setAvailability(counts)
        }
      } catch (err) {
        console.error('Error loading inventory availability:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Regional Blood Availability</h3>
            <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <Info className="w-3 h-3" />
              Live Network
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated units currently available across participating blood banks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4">
        {BLOOD_GROUPS.map((bg) => {
          const units = availability[bg] ?? 0
          const isCritical = units <= 2
          const isModerate = units > 2 && units <= 5

          return (
            <div
              key={bg}
              className={`p-3 rounded-xl border text-center transition-all ${
                isCritical
                  ? 'border-red-200 bg-red-50/40 text-red-900'
                  : isModerate
                  ? 'border-amber-200 bg-amber-50/30 text-amber-900'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <span className="w-8 h-8 rounded-lg bg-red-600 text-white font-extrabold text-sm flex items-center justify-center shadow-2xs">
                  {bg}
                </span>
              </div>
              <p className="text-xl font-extrabold mt-1">
                {loading ? '-' : units}
              </p>
              <span className="text-3xs font-semibold uppercase tracking-wider block text-slate-500">
                Units
              </span>
              <span
                className={`mt-1.5 inline-block text-3xs font-bold px-1.5 py-0.2 rounded-md ${
                  isCritical
                    ? 'bg-red-100 text-red-700'
                    : isModerate
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isCritical ? 'Low Supply' : isModerate ? 'Moderate' : 'Available'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
