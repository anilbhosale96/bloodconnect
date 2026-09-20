import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  User,
  Shield,
  Truck,
  Building2,
  Cpu
} from 'lucide-react';
import {
  fetchAuditLogsForRequest,
  buildTimelineStages,
  getStageStateClasses
} from '../services/auditService.js';

function getActorIcon(role) {
  const norm = String(role || '').toUpperCase();
  if (norm.includes('HOSPITAL')) return <Building2 className="w-3.5 h-3.5 text-blue-600" />;
  if (norm.includes('BANK')) return <Shield className="w-3.5 h-3.5 text-red-600" />;
  if (norm.includes('COURIER') || norm.includes('LOGISTICS')) return <Truck className="w-3.5 h-3.5 text-amber-600" />;
  if (norm.includes('SYSTEM')) return <Cpu className="w-3.5 h-3.5 text-indigo-600" />;
  return <User className="w-3.5 h-3.5 text-slate-600" />;
}

export default function RequestTimeline({
  requestId,
  request,
  auditLogs: initialLogs = null
}) {
  const [stages, setStages] = useState(() => buildTimelineStages(initialLogs || [], request || {}));
  const [loading, setLoading] = useState(!initialLogs && Boolean(requestId));

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (initialLogs) {
        setStages(buildTimelineStages(initialLogs, request || {}));
        return;
      }

      if (requestId) {
        setLoading(true);
        const logs = await fetchAuditLogsForRequest(requestId);
        if (!ignore) {
          setStages(buildTimelineStages(logs, request || {}));
          setLoading(false);
        }
      } else {
        setStages(buildTimelineStages([], request || {}));
        setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [requestId, request, initialLogs]);

  const formatTimestamp = (ts) => {
    if (!ts) return '--:--';
    const date = new Date(ts);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 animate-pulse">
        <Clock className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-600">Loading request audit trail...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm" data-testid="request-timeline">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Lifecycle Traceability Timeline</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              6 Stages
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-backed progression from request creation to delivery fulfillment
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span>Pending</span>
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW: Horizontal 6-Stage Progression Bar (md and up) */}
      <div className="hidden lg:block pt-8 pb-4">
        <div className="relative flex items-center justify-between">
          {/* Background Connecting Rail */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-0" />

          {stages.map((stage, _idx) => {
            const theme = getStageStateClasses(stage.state);
            const isCompleted = stage.state === 'completed';
            const isInProgress = stage.state === 'in_progress';

            return (
              <div key={stage.key} className="relative z-10 flex flex-col items-center group">
                {/* Step Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ring-4 shadow-sm transition-all ${theme.badgeBg} ${theme.badgeRing} text-white`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isInProgress ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 fill-slate-300" />
                  )}
                </div>

                {/* Stage Title */}
                <span className={`mt-3 text-xs font-bold ${theme.text}`}>
                  {stage.label}
                </span>

                {/* Timestamp */}
                <span className="text-[11px] font-mono text-slate-500 mt-0.5">
                  {stage.timestamp ? formatTimestamp(stage.timestamp) : '--:--'}
                </span>

                {/* Actor Popover Summary */}
                {stage.actorName && (
                  <div className="mt-2 text-center max-w-[130px]">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full truncate">
                      {getActorIcon(stage.actorRole)}
                      <span className="truncate">{stage.actorName}</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE & TABLET VIEW: Vertical Structured Timeline (Default & < lg) */}
      <div className="block lg:hidden mt-6 space-y-4">
        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
          {stages.map((stage, idx) => {
            const theme = getStageStateClasses(stage.state);
            const isCompleted = stage.state === 'completed';
            const isInProgress = stage.state === 'in_progress';

            return (
              <div key={stage.key} className="relative group">
                {/* Node on Vertical Line */}
                <div
                  className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 shadow-sm ${theme.badgeBg} ${theme.badgeRing} text-white`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isInProgress ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-[10px] text-slate-500">{idx + 1}</span>
                  )}
                </div>

                {/* Content Card */}
                <div className={`p-4 rounded-xl border ${theme.border} ${theme.cardBg} transition-all`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold ${theme.text}`}>
                        {idx + 1}. {stage.label}
                      </h4>
                      <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800' : isInProgress ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {theme.label}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-medium text-slate-600">
                        {stage.timestamp ? formatTimestamp(stage.timestamp) : 'Pending'}
                      </span>
                      {stage.timestamp && (
                        <span className="text-[10px] text-slate-400 block">
                          {formatDate(stage.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">
                    {stage.action}
                  </p>

                  {/* Actor Details */}
                  {stage.actorName && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                        {getActorIcon(stage.actorRole)}
                        <span>{stage.actorName}</span>
                      </span>
                      {stage.actorRole && (
                        <span className="text-[10px] font-mono uppercase bg-white/80 px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                          {stage.actorRole}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
