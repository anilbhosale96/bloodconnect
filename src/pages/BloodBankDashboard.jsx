import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  Droplets,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import InventoryTable from '../components/InventoryTable.jsx'
import UpdateInventoryModal from '../components/UpdateInventoryModal.jsx'
import RequestResponseModal from '../components/RequestResponseModal.jsx'
import { getCurrentUser, getUserProfile, signOut } from '../services/auth.js'
import {
  fetchEmergencyRequestsCount,
  fetchInventory,
  STANDARD_BLOOD_GROUPS,
  STANDARD_COMPONENTS,
  subscribeToEmergencyRequestsRealtime,
  subscribeToInventoryRealtime,
} from '../services/inventoryService.js'
import { supabase } from '../lib/supabase.js'

export default function BloodBankDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [bloodBank, setBloodBank] = useState(null)
  const [inventory, setInventory] = useState([])
  const [emergencyCount, setEmergencyCount] = useState(0)
  const [incomingRequests, setIncomingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedItemToEdit, setSelectedItemToEdit] = useState(null)

  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false)
  const [selectedRequestToRespond, setSelectedRequestToRespond] = useState(null)

  const handleOpenRespondModal = (req) => {
    setSelectedRequestToRespond(req)
    setIsRespondModalOpen(true)
  }

  useEffect(() => {
    let ignore = false

    async function fetchAllData() {
      try {
        const { data: user } = await getCurrentUser()
        if (user && !ignore) {
          const { data: prof } = await getUserProfile(user.id)
          setProfile(prof || { full_name: user.user_metadata?.full_name, role: 'blood_bank' })

          const { data: bb } = await supabase
            .from('blood_banks')
            .select('*')
            .eq('profile_id', user.id)
            .maybeSingle()

          if (bb) {
            setBloodBank(bb)
          } else {
            setBloodBank({
              id: user.id,
              name: prof?.full_name || 'Central Regional Blood Bank',
              city: 'Metro Health Hub',
              address: 'District Red Cross Complex, Block B',
            })
          }
        }

        // Fetch inventory rows
        const { data: invData } = await fetchInventory()
        if (!ignore) {
          if (invData && invData.length > 0) {
            setInventory(invData)
          } else {
            // Provide initial grid for all standard blood groups if database has 0 rows yet
            const defaultStock = []
            STANDARD_BLOOD_GROUPS.forEach((bg) => {
              STANDARD_COMPONENTS.slice(0, 2).forEach((comp) => {
                defaultStock.push({
                  id: `${bg}-${comp}`,
                  blood_group: bg,
                  component_type: comp,
                  available_units: bg === 'O+' || bg === 'B+' ? 8 : bg === 'AB-' ? 1 : 4,
                  reserved_units: bg === 'O+' ? 2 : 0,
                })
              })
            })
            setInventory(defaultStock)
          }
        }

        // Fetch emergency requests count
        const { count } = await fetchEmergencyRequestsCount()
        if (!ignore) setEmergencyCount(count)

        // Fetch latest incoming requests
        const { data: reqs } = await supabase
          .from('emergency_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        if (reqs && !ignore) {
          setIncomingRequests(reqs)
        }
      } catch (err) {
        console.error('Failed to load blood bank data:', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchAllData()

    // Realtime Subscriptions
    const inventorySub = subscribeToInventoryRealtime(() => {
      fetchAllData()
    })

    const emergencySub = subscribeToEmergencyRequestsRealtime(() => {
      fetchAllData()
    })

    return () => {
      ignore = true
      inventorySub.unsubscribe()
      emergencySub.unsubscribe()
    }
  }, [refreshTrigger])

  const loadData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleOpenEdit = (item) => {
    setSelectedItemToEdit(item)
    setIsUpdateModalOpen(true)
  }

  const handleOpenNew = () => {
    setSelectedItemToEdit(null)
    setIsUpdateModalOpen(true)
  }

  const totalAvailable = inventory.reduce(
    (sum, i) => sum + (i.available_units ?? i.count ?? 0),
    0
  )
  const totalReserved = inventory.reduce(
    (sum, i) => sum + (i.reserved_units ?? 0),
    0
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 text-white rounded-xl shadow-xs">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                  LIFE-LINK
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  Blood Bank
                </span>
              </div>
              <p className="text-3xs text-slate-500 hidden sm:block">
                Inventory Management &amp; Fulfillment Portal
              </p>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Emergency Requests Counter */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>Emergency Requests: {emergencyCount}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {bloodBank?.name || profile?.full_name || 'Central Blood Bank'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {bloodBank?.address || 'Medical Depot, Sector 2'}, {bloodBank?.city || 'Metro City'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadData}
              title="Refresh inventory"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Update Inventory Button */}
            <button
              type="button"
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Update Inventory</span>
            </button>
          </div>
        </div>

        {/* Emergency Alert Banner if requests > 0 */}
        {emergencyCount > 0 && (
          <div className="p-4 rounded-2xl bg-red-600 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 text-white">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  {emergencyCount} Active Emergency Request{emergencyCount > 1 ? 's' : ''} Require Immediate Attention
                </h3>
                <p className="text-2xs text-red-100 mt-0.5">
                  Regional hospitals have dispatched critical blood calls. Check available units below to allocate response.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                Incoming Emergency Requests
              </span>
              <p className="text-3xl font-extrabold text-red-600 mt-1">
                {emergencyCount}
              </p>
              <span className="text-3xs text-slate-500 mt-0.5 block">
                Live requests needing fulfillment
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                Available Stock Units
              </span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                {totalAvailable}
              </p>
              <span className="text-3xs text-slate-500 mt-0.5 block">
                Ready for immediate allocation
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                Reserved Units
              </span>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">
                {totalReserved}
              </p>
              <span className="text-3xs text-slate-500 mt-0.5 block">
                Locked for pending emergency dispatches
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Inventory Table Component */}
        <InventoryTable
          items={inventory}
          loading={loading}
          onEditItem={handleOpenEdit}
        />

        {/* Incoming Emergency Requests Preview List */}
        {incomingRequests.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Recent Emergency Dispatch Calls
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                  {incomingRequests.length} Active
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-red-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                      {req.blood_group}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {req.component_type || 'Blood Units'}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {req.count || 1} Units
                        </span>
                        <span
                          className={`text-3xs font-bold px-2 py-0.5 rounded-full border ${
                            req.urgency === 'CRITICAL'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {req.urgency}
                        </span>
                      </div>
                      <span className="text-3xs text-slate-400">
                        Target Deadline: {req.deadline ? new Date(req.deadline).toLocaleTimeString() : 'Immediate'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">
                      Status: {req.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenRespondModal(req)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      Respond
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Update Inventory Modal */}
      <UpdateInventoryModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        bloodBankId={bloodBank?.id}
        itemToEdit={selectedItemToEdit}
        onSuccess={() => loadData()}
      />

      {/* Emergency Request Response Modal */}
      <RequestResponseModal
        isOpen={isRespondModalOpen}
        onClose={() => setIsRespondModalOpen(false)}
        request={selectedRequestToRespond}
        bloodBankLocation={{
          latitude: bloodBank?.latitude || 18.5204,
          longitude: bloodBank?.longitude || 73.8567,
        }}
        responderId={profile?.id}
        onResponseSuccess={() => loadData()}
      />

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        LIFE-LINK &bull; Blood Bank Inventory &amp; Emergency Coordination &bull; PRARAMBHA 2.0 PS-02
      </footer>
    </div>
  )
}
