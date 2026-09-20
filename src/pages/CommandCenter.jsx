import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Radio,
  RefreshCw,
  Zap,
  Filter,
  Search,
  ExternalLink,
  Shield,
  Layers,
  LayoutGrid,
  MapPin,
  X
} from 'lucide-react';
import RequestCard from '../components/RequestCard.jsx';
import LiveMap from '../components/LiveMap.jsx';
import RequestTimeline from '../components/RequestTimeline.jsx';
import {
  fetchCommandCenterRequests,
  simulateJudgeDemoEmergency
} from '../services/commandCenterService.js';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates.js';

export default function CommandCenter() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [timelineModalRequest, setTimelineModalRequest] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [demoBanner, setDemoBanner] = useState(null);

  // Filters & View Modes
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('SPLIT'); // 'SPLIT', 'CARDS', 'MAP'

  // Load all command center data
  const loadData = useCallback(async () => {
    try {
      const data = await fetchCommandCenterRequests();
      setRequests(data);
      if (!selectedRequest && data.length > 0) {
        setSelectedRequest(data[0]);
      }
    } catch (err) {
      console.warn('Error loading command center data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRequest]);

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

  // Pure Supabase Realtime Listener (No Polling)
  const { isConnected } = useRealtimeUpdates({
    onEmergencyRequest: (payload) => {
      console.log('Realtime Emergency Request event:', payload);
      loadData();
    },
    onResponse: (payload) => {
      console.log('Realtime Response event:', payload);
      loadData();
    },
    onInventoryChange: () => {
      loadData();
    }
  });

  // Handle Manual Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Trigger Live Demo Simulation for Judges
  const handleSimulateEmergency = async () => {
    setSimulating(true);
    try {
      const newEmergency = await simulateJudgeDemoEmergency();
      setRequests((prev) => [newEmergency, ...prev]);
      setSelectedRequest(newEmergency);
      setDemoBanner(
        `🚨 LIVE EVENT DETECTED: Incoming ${newEmergency.urgency} request for ${newEmergency.blood_group} (${newEmergency.count} Units) at ${newEmergency.hospital_name}!`
      );
      setTimeout(() => setDemoBanner(null), 6000);
    } catch (err) {
      console.warn('Simulation exception:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Summary Metrics for the Top Operational Bar
  const stats = useMemo(() => {
    const total = requests.length;
    const critical = requests.filter((r) => r.urgency === 'CRITICAL').length;
    const high = requests.filter((r) => r.urgency === 'HIGH').length;
    const totalMatches = requests.reduce((acc, r) => acc + (r.match_count || 0), 0);
    const totalResponses = requests.reduce((acc, r) => acc + (r.response_count || 0), 0);

    const totalRequired = requests.reduce((acc, r) => acc + (r.count || 1), 0);
    const totalFulfilled = requests.reduce((acc, r) => acc + (r.units_offered || 0), 0);
    const avgFulfillment = totalRequired > 0 ? Math.min(100, Math.round((totalFulfilled / totalRequired) * 100)) : 0;

    return {
      total,
      critical,
      high,
      totalMatches,
      totalResponses,
      avgFulfillment
    };
  }, [requests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (urgencyFilter !== 'ALL' && r.urgency !== urgencyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hospName = (r.hospital_name || '').toLowerCase();
        const hospCity = (r.hospital_city || '').toLowerCase();
        const group = (r.blood_group || '').toLowerCase();
        const comp = (r.component_type || '').toLowerCase();
        const status = (r.status || '').toLowerCase();
        return (
          hospName.includes(q) ||
          hospCity.includes(q) ||
          group.includes(q) ||
          comp.includes(q) ||
          status.includes(q)
        );
      }
      return true;
    });
  }, [requests, urgencyFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 1. TOP HEADER & JUDGES LIVE DEMO BAR */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 text-white rounded-xl shadow-xs">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-lg sm:text-xl tracking-tight uppercase text-white">
                    EMERGENCY COMMAND CENTER
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    JUDGES DEMO CONSOLE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Autonomous Blood Resource Matching &amp; Real-Time Tactical Logistics
                </p>
              </div>
            </div>

            {/* Live Socket Status & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Realtime Socket Status Indicator */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
                title="Pure Supabase Realtime channel status"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}
                />
                <span className="hidden sm:inline">
                  {isConnected ? 'Realtime Connected' : 'Connecting...'}
                </span>
                <span className="sm:hidden">LIVE</span>
              </div>

              {/* Judges Demo Simulation Trigger */}
              <button
                type="button"
                onClick={handleSimulateEmergency}
                disabled={simulating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
                title="Trigger simulated emergency request to showcase live response"
              >
                <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                <span>{simulating ? 'Simulating...' : 'Simulate Emergency'}</span>
              </button>

              {/* Manual Refresh */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
                title="Refresh requests"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`}
                />
              </button>

              <Link
                to="/"
                className="text-xs text-slate-400 hover:text-white px-2 py-1 font-semibold hidden md:inline"
              >
                Exit Demo
              </Link>
            </div>
          </div>

          {/* 2. COMMAND STATS BAR STRIP */}
          <div className="py-2.5 border-t border-slate-800/80 grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Active Emergencies
              </span>
              <span className="text-base font-black text-white">{stats.total}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-red-400">
                Critical Alerts
              </span>
              <span className="text-base font-black text-red-400">{stats.critical}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-amber-400">
                High Priority
              </span>
              <span className="text-base font-black text-amber-400">{stats.high}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-indigo-400">
                Matches Found
              </span>
              <span className="text-base font-black text-indigo-300">
                {stats.totalMatches}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-emerald-400">
                Responses In
              </span>
              <span className="text-base font-black text-emerald-300">
                {stats.totalResponses}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-sky-400">
                Fulfillment Rate
              </span>
              <span className="text-base font-black text-sky-300">
                {stats.avgFulfillment}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Live Event Notification Toast */}
      {demoBanner && (
        <div role="alert" className="bg-red-600 text-white px-4 py-3 text-xs sm:text-sm font-black flex items-center justify-between shadow-lg animate-bounce">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{demoBanner}</span>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setDemoBanner(null)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-4 cursor-pointer inline-flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Controls Toolbar: Search, Urgency Badges Filter, View Switcher */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Search emergencies by hospital, blood group, or component"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hospital, blood group, component..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          {/* Urgency Filter Pills with exact DESIGN.md colors */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Urgency:</span>
            </span>

            <button
              type="button"
              onClick={() => setUrgencyFilter('ALL')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                urgencyFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>All ({requests.length})</span>
            </button>

            {/* Red = CRITICAL */}
            <button
              type="button"
              onClick={() => setUrgencyFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                urgencyFilter === 'CRITICAL'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Critical ({stats.critical})</span>
            </button>

            {/* Amber = HIGH */}
            <button
              type="button"
              onClick={() => setUrgencyFilter('HIGH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                urgencyFilter === 'HIGH'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>High ({stats.high})</span>
            </button>

            {/* Green = NORMAL */}
            <button
              type="button"
              onClick={() => setUrgencyFilter('NORMAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                urgencyFilter === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Normal</span>
            </button>
          </div>

          {/* View Switcher: Split, Cards, Map */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('SPLIT')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'SPLIT'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MAP')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'MAP'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Tactical Map</span>
            </button>
          </div>
        </div>

        {/* 4. VISUAL TACTICAL MAP SECTION */}
        {(viewMode === 'SPLIT' || viewMode === 'MAP') && (
          <section aria-label="Tactical Radar Map" className="space-y-2">
            <LiveMap
              requests={requests}
              selectedRequest={selectedRequest}
              onSelectRequest={(req) => setSelectedRequest(req)}
            />
          </section>
        )}

        {/* 5. REQUEST CARDS FEED SECTION */}
        {(viewMode === 'SPLIT' || viewMode === 'CARDS') && (
          <section aria-label="Active Emergency Requests Feed" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Active Emergency Feed
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-800">
                  {filteredRequests.length} Showing
                </span>
              </div>

              <span className="text-xs text-slate-500 hidden sm:inline">
                Real-time updates via Supabase Realtime
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse h-48"
                  />
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                <Shield className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800">No requests match current filter</h3>
                <p className="text-xs text-slate-500">
                  Try adjusting urgency filters or search criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setUrgencyFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    isSelected={selectedRequest?.id === req.id}
                    onSelect={(r) => setSelectedRequest(r)}
                    onInspectTimeline={(r) => setTimelineModalRequest(r)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 6. INSPECT TIMELINE LIFECYCLE MODAL */}
        {timelineModalRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                      {timelineModalRequest.id}
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      Emergency Lifecycle Traceability
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {timelineModalRequest.hospital_name} • {timelineModalRequest.blood_group} ({timelineModalRequest.count} Units needed)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setTimelineModalRequest(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Render Traceable Request Timeline */}
              <RequestTimeline
                requestId={timelineModalRequest.id}
                request={timelineModalRequest}
              />

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Link
                  to={`/hospital/requests/${timelineModalRequest.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                >
                  <span>Open Full Detail View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setTimelineModalRequest(null)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
