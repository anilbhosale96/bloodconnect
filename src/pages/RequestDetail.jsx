import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FileText
} from 'lucide-react';
import Header from '../components/Header.jsx';
import RequestTimeline from '../components/RequestTimeline.jsx';
import { fetchAuditLogsForRequest } from '../services/auditService.js';
import { supabase } from '../lib/supabase.js';
import { getCurrentUser, getUserProfile } from '../services/auth.js';
import { getUrgencyBadgeClasses } from '../lib/calculations.js';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState(null);

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch user & hospital metadata
      const { data: user } = await getCurrentUser();
      if (user) {
        const { data: prof } = await getUserProfile(user.id);
        const { data: hosp } = await supabase
          .from('hospitals')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();

        setHospitalInfo(hosp || { hospital_name: prof?.full_name || 'City General Hospital', city: 'Metro' });
      }

      // 2. Fetch emergency request
      let reqData = null;
      if (id) {
        const { data: req } = await supabase
          .from('emergency_requests')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (req) {
          reqData = req;
        }
      }

      // Fallback sample if testing without DB row
      if (!reqData) {
        reqData = {
          id: id || 'req-demo-001',
          blood_group: 'O+',
          component_type: 'Whole Blood',
          count: 2,
          urgency: 'CRITICAL',
          status: 'NOTIFIED',
          hospital_name: 'City General Hospital',
          city: 'Central District',
          created_at: new Date(Date.now() - 15 * 60000).toISOString()
        };
      }
      setRequest(reqData);

      // 3. Fetch audit logs from audit_logs table
      if (id) {
        const logs = await fetchAuditLogsForRequest(id);
        setAuditLogs(logs);
      }
    } catch (err) {
      console.warn('Failed to load request detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await loadData();
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const urgencyClasses = getUrgencyBadgeClasses(request?.urgency);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <Header
        hospitalName={hospitalInfo?.hospital_name || 'City Hospital'}
        city={hospitalInfo?.city || 'Metro City'}
        unreadNotificationsCount={0}
        onOpenNotifications={() => {}}
        onCreateEmergencyClick={() => navigate('/hospital/create-request')}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              to="/hospital"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors p-1 rounded-md hover:bg-slate-200/60"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hospital Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh timeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh Audit Trail</span>
            </button>

            {request && (
              <Link
                to={`/hospital/matching-results?requestId=${request.id}&bloodGroup=${encodeURIComponent(request.blood_group)}&units=${request.count}&urgency=${request.urgency}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>View Matching Results</span>
              </Link>
            )}
          </div>
        </div>

        {/* Request Overview Card */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white font-extrabold text-lg flex items-center justify-center shadow-xs shrink-0">
                  {request.blood_group}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                      {request.component_type || 'Blood Units'} Emergency
                    </h1>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${urgencyClasses}`}>
                      {request.urgency}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Status: {request.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>Request ID: <strong className="font-mono text-slate-700">{request.id}</strong></span>
                    <span>•</span>
                    <span>Created: {new Date(request.created_at).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">Required Quantity</span>
                  <span className="text-xl font-black text-slate-900">{request.count} Units</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium block">Hospital</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {hospitalInfo?.hospital_name || 'City Hospital'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium block">Location</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {hospitalInfo?.city || 'Metro City'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium block">Traceability</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Audit Verified
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium block">Audit Trail Entries</span>
                <span className="font-bold text-blue-700 block mt-0.5">
                  {auditLogs.length > 0 ? `${auditLogs.length} Records` : 'Active Stream'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 6-Stage Timeline Component */}
        <RequestTimeline
          requestId={request?.id}
          request={request}
          auditLogs={auditLogs.length > 0 ? auditLogs : null}
        />

        {/* Audit Log Historical Inspection Drawer */}
        {auditLogs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Immutable Audit Log Ledger</h3>
              <span className="text-xs text-slate-400">({auditLogs.length} events recorded)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Actor Name</th>
                    <th className="py-2.5 px-3">Actor Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {log.metadata?.actor_name || 'System Engine'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                          {log.metadata?.actor_role || 'SYSTEM'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
