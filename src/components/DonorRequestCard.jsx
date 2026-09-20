import React from 'react';
import {
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  AlertCircle
} from 'lucide-react';
import { getUrgencyBadgeClasses } from '../lib/calculations.js';

function formatRelativeTime(ts) {
  if (!ts) return 'Just now';
  try {
    const timeMs = new Date(ts).getTime();
    const mins = Math.max(1, Math.round((Date.now() - timeMs) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    return `${hours}h ago`;
  } catch {
    return 'Recently';
  }
}

export default function DonorRequestCard({
  request,
  onRespond,
  isResponded = false,
  isResponding = false,
  donorAvailable = true
}) {
  if (!request) return null;

  const urgencyClasses = getUrgencyBadgeClasses(request.urgency);
  const distanceText = request.distance_km != null ? `${request.distance_km} km away` : 'Nearby';
  const timeAgo = formatRelativeTime(request.created_at);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-sm hover:shadow-md ${
        isResponded ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
      }`}
      data-testid={`donor-request-card-${request.id}`}
    >
      {/* Top Banner: Urgency & Proximity */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Blood Group Tag */}
          <div className="w-12 h-12 rounded-xl bg-red-600 text-white font-extrabold text-base flex items-center justify-center shadow-xs shrink-0">
            {request.blood_group}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {request.hospital_name || 'Emergency Medical Center'}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${urgencyClasses}`}>
                {request.urgency || 'CRITICAL'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <strong className="text-slate-800 font-semibold">{distanceText}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Requested {timeAgo}
              </span>
            </div>
          </div>
        </div>

        {/* Units Needed */}
        <div className="text-right shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Quantity</span>
          <span className="text-base sm:text-lg font-extrabold text-slate-900">
            {request.count || request.quantity || 1} {request.count === 1 ? 'Unit' : 'Units'}
          </span>
        </div>
      </div>

      {/* Component Needed & Info */}
      <div className="grid grid-cols-2 gap-3 my-4 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
            <span className="w-3.5 h-3.5 block font-bold text-center leading-none">🩸</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Component Needed</p>
            <p className="text-xs font-bold text-slate-900">{request.component_type || 'Whole Blood'}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Facility Type</p>
            <p className="text-xs font-bold text-slate-900 truncate">Hospital Blood Bank</p>
          </div>
        </div>
      </div>

      {/* Non-Medical Eligibility Notice */}
      <div className="bg-blue-50/60 rounded-xl p-2.5 border border-blue-100 text-[11px] text-blue-800 flex items-start gap-2 mb-4">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Voluntary Response:</strong> Medical eligibility, hemoglobin checks, and screening will be conducted on-site by the hospital blood bank staff upon your arrival.
        </span>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          {donorAvailable
            ? 'Ready to donate? Pledge your immediate support.'
            : 'Toggle status to Available to accept emergency calls.'}
        </span>

        <button
          type="button"
          onClick={() => onRespond?.(request)}
          disabled={!donorAvailable || isResponded || isResponding}
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
            isResponded
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
              : !donorAvailable
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              : isResponding
              ? 'bg-blue-100 text-blue-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white hover:shadow'
          }`}
          data-testid={`respond-btn-${request.id}`}
        >
          {isResponded ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Response Logged</span>
            </>
          ) : isResponding ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Logging Response...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>RESPOND</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
