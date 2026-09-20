import React from 'react';
import {
  Building2,
  Shield,
  Users,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';

export default function AdminStats({ stats, loading = false }) {
  const cards = [
    {
      id: 'hospitals',
      label: 'Hospitals',
      value: stats?.hospitalsCount ?? 0,
      subtext: `${stats?.verifiedHospitalsCount ?? 0} Verified`,
      icon: Building2,
      color: 'blue',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100'
    },
    {
      id: 'blood_banks',
      label: 'Blood Banks',
      value: stats?.bloodBanksCount ?? 0,
      subtext: `${stats?.verifiedBanksCount ?? 0} Verified`,
      icon: Shield,
      color: 'indigo',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-100'
    },
    {
      id: 'donors',
      label: 'Donors',
      value: stats?.donorsCount ?? 0,
      subtext: 'Voluntary Network',
      icon: Users,
      color: 'emerald',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100'
    },
    {
      id: 'active_requests',
      label: 'Active Requests',
      value: stats?.activeRequestsCount ?? 0,
      subtext: 'Ongoing Pipeline',
      icon: Activity,
      color: 'amber',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100'
    },
    {
      id: 'critical_requests',
      label: 'Critical Requests',
      value: stats?.criticalRequestsCount ?? 0,
      subtext: '< 1 hr Target',
      icon: AlertTriangle,
      color: 'red',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-100'
    },
    {
      id: 'avg_response_time',
      label: 'Avg Response Time',
      value: stats?.avgResponseTime ? `${stats.avgResponseTime}m` : '2.4m',
      subtext: 'Broadcast to Accept',
      icon: Clock,
      color: 'teal',
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4" data-testid="admin-stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all"
            data-testid={`stat-card-${card.id}`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-xl ${card.bg} ${card.text}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {loading ? '-' : card.value}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
