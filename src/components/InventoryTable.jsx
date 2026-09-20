import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Filter,
  Search,
} from 'lucide-react'
import {
  STANDARD_BLOOD_GROUPS,
  STANDARD_COMPONENTS,
} from '../services/inventoryService.js'

export default function InventoryTable({
  items = [],
  loading = false,
  onEditItem,
}) {
  const [selectedGroup, setSelectedGroup] = useState('ALL')
  const [selectedComponent, setSelectedComponent] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedGroup !== 'ALL' && item.blood_group !== selectedGroup) return false
    if (selectedComponent !== 'ALL' && item.component_type !== selectedComponent) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchGroup = item.blood_group.toLowerCase().includes(q)
      const matchComp = (item.component_type || '').toLowerCase().includes(q)
      if (!matchGroup && !matchComp) return false
    }
    return true
  })

  // Group summary metrics
  const totalAvailable = items.reduce(
    (sum, i) => sum + (i.available_units ?? i.count ?? 0),
    0
  )
  const totalReserved = items.reduce(
    (sum, i) => sum + (i.reserved_units ?? 0),
    0
  )
  const criticalCount = items.filter(
    (i) => (i.available_units ?? i.count ?? 0) <= 2
  ).length

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              Live Blood Bank Inventory
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              {filteredItems.length} Categories
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time component units tracked across cold storage facilities
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search group or component..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Blood Group Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="py-1.5 px-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Blood Groups</option>
              {STANDARD_BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Component Filter */}
          <select
            value={selectedComponent}
            onChange={(e) => setSelectedComponent(e.target.value)}
            className="py-1.5 px-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Components</option>
            {STANDARD_COMPONENTS.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-500 font-medium">Available Units:</span>
          <strong className="text-slate-900 font-bold">{totalAvailable}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-500 font-medium">Reserved (Locked):</span>
          <strong className="text-slate-900 font-bold">{totalReserved}</strong>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 text-red-600 font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{criticalCount} Low Supply Alert(s)</span>
          </div>
        )}
      </div>

      {/* Responsive Table Container (with horizontal scroll) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="bg-slate-50 text-slate-400 uppercase text-3xs font-bold tracking-wider border-b border-slate-200">
              <th className="py-3 px-5 sm:px-6">Blood Group</th>
              <th className="py-3 px-4">Component Type</th>
              <th className="py-3 px-4 text-center">Available Units</th>
              <th className="py-3 px-4 text-center">Reserved Units</th>
              <th className="py-3 px-4">Supply Status</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mb-2" />
                  <p>Loading real-time inventory...</p>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <p className="font-semibold text-slate-700">No inventory records matching filters</p>
                  <p className="text-3xs text-slate-400 mt-1">Use the "Update Inventory" button above to add component units.</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const available = item.available_units ?? item.count ?? 0
                const reserved = item.reserved_units ?? 0
                const isCritical = available <= 2
                const isAdequate = available > 5

                return (
                  <tr
                    key={item.id || `${item.blood_group}-${item.component_type}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Blood Group */}
                    <td className="py-3.5 px-5 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-red-600 text-white font-extrabold text-sm flex items-center justify-center shadow-2xs">
                          {item.blood_group}
                        </span>
                        <span className="font-bold text-slate-900">
                          {item.blood_group}
                        </span>
                      </div>
                    </td>

                    {/* Component Type */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {item.component_type || 'Whole Blood'}
                    </td>

                    {/* Available Units */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center font-extrabold text-sm px-3 py-1 rounded-xl ${
                          isCritical
                            ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                            : isAdequate
                            ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 font-bold border border-amber-200'
                        }`}
                      >
                        {available} Bags
                      </span>
                    </td>

                    {/* Reserved Units */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center font-bold text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                        {reserved} Units
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3" />
                          Critical Low
                        </span>
                      ) : isAdequate ? (
                        <span className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Sufficient
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Moderate
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => onEditItem(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Adjust</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

