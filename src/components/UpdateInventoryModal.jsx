import { useState } from 'react'
import { AlertCircle, Check, Loader2, PackagePlus, X } from 'lucide-react'
import {
  STANDARD_BLOOD_GROUPS,
  STANDARD_COMPONENTS,
  updateInventoryItem,
} from '../services/inventoryService.js'

function InventoryFormContent({
  itemToEdit,
  bloodBankId,
  onClose,
  onSuccess,
}) {
  const [bloodGroup, setBloodGroup] = useState(itemToEdit?.blood_group || 'O+')
  const [componentType, setComponentType] = useState(itemToEdit?.component_type || 'Whole Blood')
  const [availableUnits, setAvailableUnits] = useState(
    itemToEdit?.available_units ?? itemToEdit?.count ?? 10
  )
  const [reservedUnits, setReservedUnits] = useState(itemToEdit?.reserved_units ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: updateError } = await updateInventoryItem({
        id: itemToEdit?.id,
        blood_bank_id: bloodBankId || '00000000-0000-0000-0000-000000000000',
        blood_group: bloodGroup,
        component_type: componentType,
        available_units: parseInt(availableUnits, 10),
        reserved_units: parseInt(reservedUnits, 10),
      })

      if (updateError) {
        throw updateError
      }

      if (onSuccess) {
        onSuccess(data)
      }
      onClose()
    } catch (err) {
      console.error('Failed to update inventory:', err)
      setError(err?.message || 'Failed to update inventory.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Blood Group */}
      <div>
        <label htmlFor="inv-blood-group" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Blood Group
        </label>
        <select
          id="inv-blood-group"
          aria-label="Select blood group"
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {STANDARD_BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>
              {bg}
            </option>
          ))}
        </select>
      </div>

      {/* Component Type */}
      <div>
        <label htmlFor="inv-component-type" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Component Type
        </label>
        <select
          id="inv-component-type"
          aria-label="Select blood component type"
          value={componentType}
          onChange={(e) => setComponentType(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {STANDARD_COMPONENTS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Units Available & Reserved */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="inv-available-units" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Available Units
          </label>
          <input
            id="inv-available-units"
            aria-label="Available units count"
            type="number"
            min="0"
            max="999"
            value={availableUnits}
            onChange={(e) => setAvailableUnits(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-3xs text-slate-400 mt-1 block">Unreserved units in stock</span>
        </div>

        <div>
          <label htmlFor="inv-reserved-units" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Reserved Units
          </label>
          <input
            id="inv-reserved-units"
            aria-label="Reserved units count"
            type="number"
            min="0"
            max="999"
            value={reservedUnits}
            onChange={(e) => setReservedUnits(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-3xs text-slate-400 mt-1 block">Locked for active emergencies</span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save Inventory Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default function UpdateInventoryModal({
  isOpen,
  onClose,
  bloodBankId,
  itemToEdit,
  onSuccess,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {itemToEdit ? 'Adjust Stock Count' : 'Update Blood Bank Inventory'}
              </h3>
              <p className="text-2xs text-slate-300">
                Directly updates cold storage balance in database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <InventoryFormContent
          key={itemToEdit?.id || `${itemToEdit?.blood_group}-${itemToEdit?.component_type}` || 'new'}
          itemToEdit={itemToEdit}
          bloodBankId={bloodBankId}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  )
}

