import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  LogOut,
  Building2,
  Shield,
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
  History,
  XCircle,
  X,
  Database
} from 'lucide-react';
import AdminStats from '../components/AdminStats.jsx';
import AuditLogViewer from '../components/AuditLogViewer.jsx';
import RequestTimeline from '../components/RequestTimeline.jsx';
import {
  fetchAdminMetrics,
  fetchAccountsForVerification,
  updateAccountVerificationStatus,
  fetchAllAuditLogs
} from '../services/adminService.js';
import { getCurrentUser, getUserProfile, signOut } from '../services/auth.js';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates.js';
import { seedDemoData } from '../lib/seedData.js';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState(null);
  const [seeding, setSeeding] = useState(false);

  // Selected request for embedded timeline inspection
  const [selectedRequestId, setSelectedRequestId] = useState('req-001');
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  // Load all admin data
  const loadAllData = useCallback(async () => {
    try {
      // 1. User profile
      const { data: user } = await getCurrentUser();
      if (user) {
        const { data: prof } = await getUserProfile(user.id);
        setProfile(prof || { full_name: user.user_metadata?.full_name || 'System Admin', role: 'admin' });
      }

      // 2. Metrics, Accounts, and Audit Logs
      const [metricsData, accountsData, logsData] = await Promise.all([
        fetchAdminMetrics(),
        fetchAccountsForVerification(),
        fetchAllAuditLogs()
      ]);

      setStats(metricsData);
      setAccounts(accountsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.warn('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await loadAllData();
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadAllData]);

  // Real-time synchronization for instant stats & audit log refreshes
  useRealtimeUpdates({
    onAnyChange: () => {
      loadAllData();
    }
  });

  // Verify / Revoke Account Handler
  const handleVerifyAccount = async (account) => {
    const isCurrentlyVerified = (account.verification_status || '').toUpperCase() === 'VERIFIED';
    const nextStatus = isCurrentlyVerified ? 'PENDING' : 'VERIFIED';

    // Optimistic UI update
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === account.id ? { ...acc, verification_status: nextStatus } : acc
      )
    );

    const result = await updateAccountVerificationStatus({
      id: account.id,
      type: account.type,
      status: nextStatus,
      adminName: profile?.full_name || 'System Admin'
    });

    if (result.success) {
      setVerificationFeedback(
        `Successfully marked ${account.name} as ${nextStatus}!`
      );
      // Refresh audit logs to reflect verification action
      fetchAllAuditLogs().then(setAuditLogs);
      fetchAdminMetrics().then(setStats);
      setTimeout(() => setVerificationFeedback(null), 4000);
    }
  };

  // Seed Presentation Demo Data Handler
  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const result = await seedDemoData();
      setVerificationFeedback(result.message);
      await loadAllData();
      setTimeout(() => setVerificationFeedback(null), 6000);
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">LIFE-LINK</span>
              <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Command Center &amp; Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 hidden sm:inline font-semibold">
              {profile?.full_name || 'Super Administrator'}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header Title & Live Refresh Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                System Oversight &amp; Verification
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Realtime Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Network Analytics &amp; Control
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                loadAllData().then(() => setRefreshing(false));
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh metrics & audit logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
              <span>Refresh Metrics</span>
            </button>

            <button
              type="button"
              onClick={handleSeedData}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              title="Seed 5 blood banks, 10 donors, and 3 emergency requests for demonstration"
              data-testid="seed-demo-data-btn"
            >
              <Database className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Seeding Data...' : 'Seed Demo Data'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTimelineModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Inspect Request Timeline</span>
            </button>
          </div>
        </div>

        {/* 1. 6 METRIC CARDS */}
        <section aria-label="System Analytics Metrics">
          <AdminStats stats={stats} loading={loading} />
        </section>

        {/* Verification Success Toast Banner */}
        {verificationFeedback && (
          <div role="alert" className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{verificationFeedback}</span>
          </div>
        )}

        {/* 2. ACCOUNT VERIFICATION TABLE */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" data-testid="verification-section">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Institutional Account Verification
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify legitimate hospitals and blood bank facilities before they can broadcast or respond
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
              {accounts.length} Registered Institutions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" data-testid="accounts-table">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Institution Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {accounts.map((acc) => {
                  const isVerified = (acc.verification_status || '').toUpperCase() === 'VERIFIED';
                  const isHospital = acc.type === 'HOSPITAL';

                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isHospital ? (
                            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : (
                            <Shield className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <span className="font-bold text-slate-900">{acc.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isHospital ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {isHospital ? 'Hospital' : 'Blood Bank'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span>{acc.city || 'Metro'}</span>
                        <span className="text-[10px] text-slate-400 block">{acc.address}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {isVerified ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending Verification</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleVerifyAccount(acc)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                            isVerified
                              ? 'bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 border border-slate-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                          data-testid={`verify-btn-${acc.id}`}
                        >
                          {isVerified ? (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Revoke Verification</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify Account</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. AUDIT LOG VIEWER (Sortable & Filterable) */}
        <section aria-label="System Audit Trail">
          <AuditLogViewer logs={auditLogs} loading={loading} />
        </section>

        {/* 4. EMBEDDED REQUEST TIMELINE VIEWER MODAL */}
        {showTimelineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Inspect Request Lifecycle Timeline
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Viewing 6-stage progression backed by audit trail ledger
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTimelineModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Selector for request to inspect */}
              <div className="flex items-center gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="font-semibold text-slate-600">Sample Emergency Request:</span>
                <select
                  value={selectedRequestId}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
                >
                  <option value="req-001">req-001 (O+ Whole Blood - 2 Units)</option>
                  <option value="req-101">req-101 (B+ PRBC - 3 Units)</option>
                  <option value="req-donor-001">req-donor-001 (CRITICAL Match)</option>
                </select>
                <Link
                  to={`/hospital/requests/${selectedRequestId}`}
                  className="ml-auto inline-flex items-center gap-1 text-blue-600 hover:underline font-bold"
                >
                  <span>Open Full Detail Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Request Timeline Component */}
              <RequestTimeline
                requestId={selectedRequestId}
                request={{
                  id: selectedRequestId,
                  blood_group: 'O+',
                  count: 2,
                  urgency: 'CRITICAL',
                  status: 'NOTIFIED',
                  created_at: '2025-05-10T12:00:00.000Z'
                }}
              />

              <div className="text-right pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTimelineModal(false)}
                  className="inline-flex items-center gap-1 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close Inspection</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
