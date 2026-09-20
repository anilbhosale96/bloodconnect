import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Droplet,
  Loader2,
  MapPin,
  X,
  XCircle,
} from 'lucide-react'
import {
  calculateHaversineDistance,
  respondToEmergencyRequest,
} from '../services/responseService.js'

export default function RequestResponseModal({
  isOpen,
  onClose,
  request,
  bloodBankLocation = { latitude: 18.5204, longitude: 73.8567 },
  responderId,
  onResponseSuccess,
}) {
  const [selectedAction, setSelectedAction] = useState(null) // 'ACCEPT' | 'PARTIAL' | 'DECLINE'
  const [partialUnits, setPartialUnits] = useState(1)
  const [declineReason, setDeclineReason] = useState('Stock depleted in cold storage')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successData, setSuccessData] = useState(null)

  if (!isOpen || !request) return null

  const requestedUnits = request.count || request.quantity || 1
  const hospitalName = request.hospital?.hospital_name || 'City Hospital'
  const hospitalCity = request.hospital?.city || 'Metro'
  const distanceKm = calculateHaversineDistance(
    bloodBankLocation.latitude,
    bloodBankLocation.longitude,
    request.latitude,
    request.longitude
  )

  const isCritical = request.urgency === 'CRITICAL'
  const isHigh = request.urgency === 'HIGH'
  const urgencyBadgeClass = isCritical
    ? 'bg-red-100 text-red-800 border-red-200'
    : isHigh
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-slate-100 text-slate-800 border-slate-200'

  const handleExecuteResponse = async (action) => {
    setError(null)
    setLoading(true)

    try {
      const unitsToOffer =
        action === 'ACCEPT'
          ? requestedUnits
          : action === 'PARTIAL'
          ? partialUnits
          : 0

      const noteText =
        action === 'DECLINE' ? declineReason : ''

      const { data, error: serviceError } = await respondToEmergencyRequest({
        requestId: request.id,
        hospitalId: request.hospital_id,
        responderId,
        action,
        unitsOffered: unitsToOffer,
        notes: noteText,
        bloodGroup: request.blood_group,
        componentType: request.component_type,
      })

      if (serviceError) {
        throw serviceError
      }

      setSuccessData({
        action,
        unitsOffered: unitsToOffer,
      })

      if (onResponseSuccess) {
        onResponseSuccess(data)
      }
    } catch (err) {
      console.error('Failed to submit response:', err)
      setError(err?.message || 'Failed to submit response to hospital.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedAction(null)
    setSuccessData(null)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div
          className={`px-6 py-4 text-white flex items-center justify-between ${
            isCritical ? 'bg-red-600' : 'bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20">
              <Droplet className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Emergency Blood Call Response
              </h3>
              <p className="text-2xs text-white/80">
                Action will immediately update reserved inventory and alert hospital
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successData ? (
            <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  Response Dispatched Successfully
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                  {successData.action === 'ACCEPT'
                    ? `Allocated ${successData.unitsOffered} units to ${hospitalName}. Inventory reserved.`
                    : successData.action === 'PARTIAL'
                    ? `Offered ${successData.unitsOffered} partial units. Awaiting hospital dispatch confirmation.`
                    : 'Call declined. System is routing request to the next ranked facility.'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Close Window</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Request Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-extrabold text-base flex items-center justify-center shadow-2xs">
                      {request.blood_group}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {request.blood_group} &bull; {request.component_type || 'Whole Blood'}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold">
                        Needed: <strong className="text-slate-900">{requestedUnits} Units (Bags)</strong>
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${urgencyBadgeClass}`}>
                    {request.urgency}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">{hospitalName}, {hospitalCity}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>{distanceKm} km</strong> away</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 text-3xs text-slate-500 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Target Response Window: Within 1 Hour</span>
                  </div>
                </div>
              </div>

              {/* Partial Allocation Input (if user clicked offer partial) */}
              {selectedAction === 'PARTIAL' && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5 animate-in fade-in">
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Specify Units to Offer (1 to {Math.max(1, requestedUnits - 1)} Units):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      aria-label="Specify partial units to offer"
                      min="1"
                      max={Math.max(1, requestedUnits - 1)}
                      value={partialUnits}
                      onChange={(e) =>
                        setPartialUnits(
                          Math.min(
                            Math.max(1, requestedUnits - 1),
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        )
                      }
                      className="w-24 px-3 py-2 text-sm font-bold bg-white border border-amber-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-xs text-amber-800">
                      Units will be locked in reserved inventory
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleExecuteResponse('PARTIAL')}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Confirm Partial Offer of {partialUnits} Units</span>
                  </button>
                </div>
              )}

              {/* Decline Reason Input (if user clicked decline) */}
              {selectedAction === 'DECLINE' && (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-2.5 animate-in fade-in">
                  <label htmlFor="decline-reason-select" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Reason for Inability to Fulfill:
                  </label>
                  <select
                    id="decline-reason-select"
                    aria-label="Reason for inability to fulfill request"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="Stock depleted in cold storage">Stock depleted in cold storage</option>
                    <option value="Units reserved for trauma/surgery">Units reserved for trauma/surgery</option>
                    <option value="Logistics/courier unavailable">Logistics/courier unavailable</option>
                    <option value="Component expired or testing in progress">Component testing in progress</option>
                  </select>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleExecuteResponse('DECLINE')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    <span>Confirm Decline</span>
                  </button>
                </div>
              )}

              {/* 3 Response Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
                {/* 1. ACCEPT FULL */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleExecuteResponse('ACCEPT')}
                  className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading && selectedAction === 'ACCEPT' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Accept {requestedUnits} Units</span>
                </button>

                {/* 2. OFFER PARTIAL */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setSelectedAction(selectedAction === 'PARTIAL' ? null : 'PARTIAL')}
                  className={`w-full sm:flex-1 py-3 px-4 font-bold text-xs sm:text-sm rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                    selectedAction === 'PARTIAL'
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Offer Partial</span>
                </button>

                {/* 3. DECLINE */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setSelectedAction(selectedAction === 'DECLINE' ? null : 'DECLINE')}
                  className={`w-full sm:w-auto py-3 px-4 font-bold text-xs sm:text-sm rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                    selectedAction === 'DECLINE'
                      ? 'bg-slate-200 text-slate-900 border-slate-400'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

