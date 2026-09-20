import React from 'react';
import { Building2, MapPin, Droplets, Clock, Send, CheckCircle2, Award, Phone } from 'lucide-react';
import { getPriorityColorTheme, getUrgencyBadgeClasses } from '../lib/calculations.js';

function formatRelativeTime(timeStr) {
  if (!timeStr) return 'Just now';
  try {
    const timeMs = typeof timeStr === 'number' ? timeStr : new Date(timeStr).getTime();
    if (isNaN(timeMs)) return 'Recently';
    const mins = Math.max(1, Math.round((Date.now() - timeMs) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    return `${hours}h ago`;
  } catch {
    return 'Recently';
  }
}

export default function MatchCard({
  match,
  rank = 1,
  urgency = 'CRITICAL',
  onNotify,
  isNotified = false,
  isNotifying = false
}) {
  if (!match) return null;

  const score = Math.round(match.priority_score ?? 0);
  const theme = getPriorityColorTheme(score);
  const urgencyClasses = getUrgencyBadgeClasses(urgency);
  const updatedTime = formatRelativeTime(match.updated_at || match.last_updated || match.created_at);

  return (
    <div
      className={`relative bg-white rounded-xl border-2 ${theme.border} p-5 shadow-sm transition-all hover:shadow-md md:p-6`}
      data-testid={`match-card-${rank}`}
    >
      {/* Top Banner: Rank & Priority Score */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-700 text-sm">
            #{rank}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
                {match.resource_name || 'Blood Bank Partner'}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${urgencyClasses}`}>
                {urgency}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="capitalize">{match.resource_type ? match.resource_type.toLowerCase().replace('_', ' ') : 'Blood Bank'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Updated {updatedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Priority Score Visual Badge */}
        <div className="flex flex-col items-end">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${theme.badgeBg} ${theme.badgeText} shadow-sm`}>
            <Award className="w-3.5 h-3.5" />
            <span>{score}/100</span>
          </div>
          <span className={`text-[11px] font-medium ${theme.text} mt-1`}>
            {theme.label}
          </span>
        </div>
      </div>

      {/* Resource Metrics & Key Data */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 py-1">
        {/* Distance */}
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-blue-100 text-blue-700">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Distance</p>
            <p className="text-sm font-bold text-slate-900">
              {match.distance_km != null ? `${match.distance_km} km` : 'Near'}
            </p>
          </div>
        </div>

        {/* Available Units */}
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-red-100 text-red-700">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">In Stock</p>
            <p className="text-sm font-bold text-slate-900">
              {match.available_units ?? 0} Units
            </p>
          </div>
        </div>

        {/* Match Breakdown / Contact */}
        <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-emerald-100 text-emerald-700">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Location</p>
            <p className="text-sm font-bold text-slate-900 truncate">
              {match.city || match.address || 'Central District'}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-score Breakdown Progress Bar */}
      {match.scores && (
        <div className="mb-4 pt-2 border-t border-slate-100">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Score Composition</span>
            <span className="text-slate-700 font-bold">{score}% match factor</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
            <div
              className="bg-emerald-500 h-2 transition-all duration-500"
              style={{ width: `${(match.scores.availability || 0) * 0.4}%` }}
              title={`Availability: ${match.scores.availability}% (40% weight)`}
            />
            <div
              className="bg-blue-500 h-2 transition-all duration-500"
              style={{ width: `${(match.scores.distance || 0) * 0.3}%` }}
              title={`Distance: ${match.scores.distance}% (30% weight)`}
            />
            <div
              className="bg-red-500 h-2 transition-all duration-500"
              style={{ width: `${(match.scores.urgency || 0) * 0.2}%` }}
              title={`Urgency: ${match.scores.urgency}% (20% weight)`}
            />
            <div
              className="bg-amber-500 h-2 transition-all duration-500"
              style={{ width: `${(match.scores.freshness || 0) * 0.1}%` }}
              title={`Freshness: ${match.scores.freshness}% (10% weight)`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Avail 40%</span>
            <span>Dist 30%</span>
            <span>Urg 20%</span>
            <span>Fresh 10%</span>
          </div>
        </div>
      )}

      {/* Actions: Notify Button */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          {match.phone && (
            <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {match.phone}
            </span>
          )}
        </div>

        <button
          onClick={() => onNotify?.(match)}
          disabled={isNotified || isNotifying}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
            isNotified
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
              : isNotifying
              ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow'
          }`}
          data-testid={`notify-btn-${match.resource_id}`}
        >
          {isNotified ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Notified</span>
            </>
          ) : isNotifying ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Notifying...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>NOTIFY</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
