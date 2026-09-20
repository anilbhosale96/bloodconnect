import React from 'react';
import {
  Clock,
  Sparkles,
  MessageSquare,
  Building2,
  Droplet,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { getUrgencyBadgeConfig } from '../services/commandCenterService.js';

function formatDispatchTime(isoString) {
  if (!isoString) return 'Active Now';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Active';
  }
}

/**
 * RequestCard component for Emergency Command Center.
 *
 * Displays:
 * - Color badge: Red = CRITICAL, Amber = HIGH, Green = NORMAL
 * - Match count per request
 * - Response count per request
 * - Visual progress bar: % fulfilled
 * - Hospital information, blood group, component type
 *
 * @param {Object} props
 * @param {Object} props.request - Emergency request details
 * @param {boolean} [props.isSelected=false] - Whether this card is focused on the map
 * @param {Function} [props.onSelect] - Focus request on live map
 * @param {Function} [props.onInspectTimeline] - Trigger timeline lifecycle modal
 */
export default function RequestCard({
  request,
  isSelected = false,
  onSelect,
  onInspectTimeline
}) {
  if (!request) return null;

  const urgencyConfig = getUrgencyBadgeConfig(request.urgency);
  const unitsRequired = request.count || request.quantity || 1;
  const unitsOffered = request.units_offered ?? 0;
  const percentFulfilled = request.percent_fulfilled ?? Math.min(
    100,
    Math.round((unitsOffered / unitsRequired) * 100)
  );

  const isFulfilled = percentFulfilled >= 100 || request.status === 'FULFILLED';

  return (
    <div
      onClick={() => onSelect && onSelect(request)}
      className={`relative bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-blue-50/10'
          : urgencyConfig.cardBorder
      }`}
    >
      {/* Top Header: Urgency Badge + Blood Group Display + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Urgency Color Badge (Red = CRITICAL, Amber = HIGH, Green = NORMAL) */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-2xs ${urgencyConfig.badgeBg} ${urgencyConfig.badgeText}`}
          >
            {urgencyConfig.pulse && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            )}
            {urgencyConfig.label}
          </span>

          {/* Request Status Badge */}
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 uppercase tracking-tight">
            {request.status || 'PENDING'}
          </span>

          {request.deadline && (
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {request.deadline}
            </span>
          )}
        </div>

        {/* Blood Group Tag */}
        <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-xl border border-red-200 shrink-0">
          <Droplet className="w-4 h-4 fill-red-600 text-red-600" />
          <span className="text-base font-black tracking-tight leading-none">
            {request.blood_group}
          </span>
        </div>
      </div>

      {/* Hospital Details & Component Type */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm sm:text-base leading-snug">
          <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="truncate">{request.hospital_name || 'Emergency Hospital'}</span>
        </div>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
          <span className="truncate">{request.hospital_city || 'Central District'}</span>
          <span className="font-semibold text-slate-700">
            {unitsRequired} {unitsRequired === 1 ? 'Unit' : 'Units'} • {request.component_type || 'Whole Blood'}
          </span>
        </div>
      </div>

      {/* Live Operational Counters: Matches Found & Responses Received */}
      <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
        {/* Match Count Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-black text-slate-900 leading-tight">
              {request.match_count ?? 0}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              Matches Found
            </div>
          </div>
        </div>

        {/* Response Count Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-black text-slate-900 leading-tight">
              {request.response_count ?? 0}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              Responses Received
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar: % Fulfilled */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-600 flex items-center gap-1">
            <span>Fulfillment Progress</span>
            {isFulfilled && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </span>
          <span
            className={`${
              isFulfilled
                ? 'text-emerald-700'
                : percentFulfilled > 0
                ? 'text-blue-700'
                : 'text-slate-500'
            }`}
          >
            {percentFulfilled}% ({unitsOffered}/{unitsRequired} Units)
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFulfilled
                ? 'bg-emerald-500'
                : percentFulfilled > 50
                ? 'bg-blue-600'
                : percentFulfilled > 0
                ? 'bg-amber-500'
                : 'bg-slate-300'
            }`}
            style={{ width: `${Math.max(4, percentFulfilled)}%` }}
          />
        </div>
      </div>

      {/* Footer Info & Inspection Action */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
        <div className="text-[11px] font-medium text-slate-400">
          Dispatched at {formatDispatchTime(request.created_at)}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onInspectTimeline) onInspectTimeline(request);
          }}
          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition-colors text-xs"
        >
          <span>Inspect Timeline</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
