import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Droplet, RefreshCw, Sparkles, History, Plus } from 'lucide-react'

const STATUS_STEPS = ['PENDING', 'MATCHING', 'RESPONDED', 'FULFILLED']

export default function ActiveEmergencyRequests({
  requests = [],
  loading = false,
  onRefresh,
  onCreateRequest,
}) {
  const [filter, setFilter] = useState('ALL')

  const filteredRequests = requests.filter((r) => {
    if (filter === 'CRITICAL') return r.urgency === 'CRITICAL'
    if (filter === 'ACTIVE') return r.status !== 'FULFILLED' && r.status !== 'CANCELLED'
    if (filter === 'FULFILLED') return r.status === 'FULFILLED'
    return true
  })

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Active Emergency Requests</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
              {requests.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status tracking &amp; resource fulfillment pipeline
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            {['ALL', 'CRITICAL', 'ACTIVE', 'FULFILLED'].map((f) => (
              <button
                key={f}
                type="button"
                aria-label={`Filter requests by ${f}`}
                onClick={() => setFilter(f)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  f === 'CRITICAL' ? 'bg-red-600' : f === 'ACTIVE' ? 'bg-blue-600' : f === 'FULFILLED' ? 'bg-emerald-600' : 'bg-slate-400'
                }`} />
                <span>{f}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            title="Refresh requests"
            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="mt-5 space-y-4">
        {loading && requests.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <Clock className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            Loading active emergency requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Droplet className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No requests matching filter</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              There are currently no requests in this category. Click below to submit an urgent blood requirement.
            </p>
            <button
              type="button"
              onClick={onCreateRequest}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Emergency Request</span>
            </button>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const urgencyColor =
              req.urgency === 'CRITICAL'
                ? 'bg-red-50 text-red-700 border-red-200'
                : req.urgency === 'HIGH'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'

            const statusIndex = STATUS_STEPS.indexOf(req.status)

            return (
              <div
                key={req.id}
                className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-slate-300 transition-colors bg-white shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-red-600 text-white font-extrabold text-base flex items-center justify-center shadow-xs shrink-0">
                      {req.blood_group}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {req.component_type || 'Blood Units'}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {req.count || 1} {req.count === 1 ? 'Unit' : 'Units'}
                        </span>
                      </div>
                      <span className="text-3xs text-slate-400">
                        Requested: {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${urgencyColor}`}>
                      {req.urgency}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      Status: {req.status}
                    </span>
                  </div>
                </div>

                {/* Progress Status Bar */}
                <div className="pt-3">
                  <div className="grid grid-cols-4 gap-2 text-center text-3xs font-semibold">
                    {STATUS_STEPS.map((step, idx) => {
                      const isComplete = statusIndex >= idx
                      const isCurrent = req.status === step

                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div
                            className={`w-full h-1.5 rounded-full mb-1 transition-colors ${
                              isComplete
                                ? isCurrent
                                  ? 'bg-blue-600'
                                  : 'bg-emerald-500'
                                : 'bg-slate-200'
                            }`}
                          />
                          <span
                            className={
                              isComplete ? 'text-slate-800 font-bold' : 'text-slate-400'
                            }
                          >
                            {step}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-3">
                  <span className="text-3xs text-slate-400 font-mono">
                    ID: {req.id ? req.id.slice(0, 8) : 'REQ'}...
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/hospital/requests/${req.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                      title="View full 6-stage lifecycle traceability"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Trace Timeline</span>
                    </Link>
                    <Link
                      to={`/hospital/matching-results?requestId=${req.id}&bloodGroup=${encodeURIComponent(req.blood_group || 'O+')}&units=${req.count || 1}&urgency=${req.urgency || 'CRITICAL'}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Matches</span>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
