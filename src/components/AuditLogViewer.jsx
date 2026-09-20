import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  FileText,
  Clock,
  Building2,
  Shield,
  Cpu,
  User,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

function getActorRoleBadge(role) {
  const norm = String(role || '').toUpperCase();
  if (norm.includes('HOSPITAL')) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  if (norm.includes('BANK')) {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  if (norm.includes('SYSTEM')) {
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  }
  if (norm.includes('DONOR')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getActorIcon(role) {
  const norm = String(role || '').toUpperCase();
  if (norm.includes('HOSPITAL')) return <Building2 className="w-3.5 h-3.5 text-blue-600" />;
  if (norm.includes('BANK')) return <Shield className="w-3.5 h-3.5 text-red-600" />;
  if (norm.includes('SYSTEM')) return <Cpu className="w-3.5 h-3.5 text-indigo-600" />;
  return <User className="w-3.5 h-3.5 text-slate-600" />;
}

export default function AuditLogViewer({ logs = [], loading = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortDirection, setSortDirection] = useState('desc'); // 'desc' (newest first) or 'asc' (oldest first)

  // Filtering and Sorting logic
  const filteredAndSortedLogs = useMemo(() => {
    return (logs || [])
      .filter((log) => {
        // 1. Role filter
        const role = String(log.metadata?.actor_role || 'SYSTEM').toUpperCase();
        if (roleFilter !== 'ALL' && !role.includes(roleFilter)) {
          return false;
        }

        // 2. Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const action = String(log.action || '').toLowerCase();
          const actorName = String(log.metadata?.actor_name || '').toLowerCase();
          const reqId = String(log.request_id || '').toLowerCase();
          const stage = String(log.metadata?.stage || '').toLowerCase();

          return (
            action.includes(term) ||
            actorName.includes(term) ||
            reqId.includes(term) ||
            stage.includes(term)
          );
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [logs, searchTerm, roleFilter, sortDirection]);

  const toggleSort = () => {
    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" data-testid="audit-log-viewer">
      {/* Viewer Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Immutable System Audit Trail</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              {filteredAndSortedLogs.length} Events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sortable &amp; filterable ledger of all emergency dispatches, scoring runs, and responses
          </p>
        </div>

        {/* Controls: Search, Role Filter, Timestamp Sort */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Search audit trail"
              placeholder="Search action, actor, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white w-48 sm:w-56"
              data-testid="audit-search-input"
            />
          </div>

          {/* Role Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filter audit trail by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
              data-testid="audit-role-filter"
            >
              <option value="ALL">All Roles</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="BANK">Blood Bank</option>
              <option value="DONOR">Donor</option>
              <option value="SYSTEM">System Engine</option>
            </select>
          </div>

          {/* Timestamp Sort Toggle Button */}
          <button
            type="button"
            onClick={toggleSort}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Toggle sort direction"
            data-testid="audit-sort-btn"
          >
            {sortDirection === 'desc' ? (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-purple-600" />
                <span>Newest First</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-purple-600" />
                <span>Oldest First</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" data-testid="audit-table">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 tracking-wider">
            <tr>
              <th className="py-3 px-4">
                <button
                  type="button"
                  onClick={toggleSort}
                  className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                >
                  <span>Timestamp</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Request Trace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin text-purple-600" />
                    <span>Streaming audit logs...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No audit logs matching search &amp; filter criteria.
                </td>
              </tr>
            ) : (
              filteredAndSortedLogs.map((log) => {
                const role = log.metadata?.actor_role || 'SYSTEM';
                const roleClass = getActorRoleBadge(role);
                const reqId = log.request_id;

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {log.timestamp ? (
                        <div>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        '--:--'
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="font-mono text-xs text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                        {log.action}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 font-semibold">
                        {getActorIcon(role)}
                        <span>{log.metadata?.actor_name || 'System Auto-Trigger'}</span>
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${roleClass}`}>
                        {role}
                      </span>
                    </td>

                    {/* Request Trace Link */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {reqId ? (
                        <Link
                          to={`/hospital/requests/${reqId}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-mono text-xs font-bold hover:underline"
                          title="View 6-stage lifecycle progression"
                        >
                          <span>{reqId.slice(0, 8)}...</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-mono">--</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

