import { supabase } from '../lib/supabase.js'
import { getSeedData, SEED_INVENTORY } from '../lib/seedData.js'

export const STANDARD_BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
export const STANDARD_COMPONENTS = ['Whole Blood', 'PRBC', 'Platelets', 'FFP', 'Cryoprecipitate']

/**
 * Fetch inventory rows from Supabase
 * @param {string} [bloodBankId]
 * @returns {Promise<{ data: any[]|null, error: Error|null }>}
 */
export async function fetchInventory(bloodBankId) {
  try {
    let query = supabase
      .from('inventory')
      .select('*')
      .order('blood_group', { ascending: true })

    if (bloodBankId) {
      query = query.eq('blood_bank_id', bloodBankId)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return { data, error: null }
    }

    // Fallback to seeded demo inventory
    const seedData = getSeedData()
    let stock = seedData?.inventory || SEED_INVENTORY
    if (bloodBankId) {
      stock = stock.filter((item) => item.blood_bank_id === bloodBankId)
    }

    return { data: stock, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/**
 * Update or upsert an inventory row
 * @param {Object} item
 * @param {string} [item.id]
 * @param {string} item.blood_bank_id
 * @param {string} item.blood_group
 * @param {string} item.component_type
 * @param {number} item.available_units
 * @param {number} [item.reserved_units]
 * @returns {Promise<{ data: any|null, error: Error|null }>}
 */
export async function updateInventoryItem({
  id,
  blood_bank_id,
  blood_group,
  component_type,
  available_units,
  reserved_units = 0,
}) {
  try {
    const payload = {
      blood_bank_id,
      blood_group,
      component_type,
      available_units: Math.max(0, parseInt(available_units, 10) || 0),
      reserved_units: Math.max(0, parseInt(reserved_units, 10) || 0),
      count: Math.max(0, parseInt(available_units, 10) || 0),
    }

    if (id) {
      payload.id = id
    }

    const { data, error } = await supabase
      .from('inventory')
      .upsert(payload)
      .select()
      .maybeSingle()

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/**
 * Fetch count of active incoming emergency requests
 * @returns {Promise<{ count: number, error: Error|null }>}
 */
export async function fetchEmergencyRequestsCount() {
  try {
    const { data, error } = await supabase
      .from('emergency_requests')
      .select('id, status')
      .not('status', 'in', '("FULFILLED","CANCELLED")')

    if (error) {
      return { count: 0, error }
    }

    return { count: data?.length || 0, error: null }
  } catch (err) {
    return { count: 0, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/**
 * Subscribe to realtime inventory changes
 * @param {Function} onUpdate Callback when inventory changes
 * @returns {{ unsubscribe: Function }}
 */
export function subscribeToInventoryRealtime(onUpdate) {
  const channel = supabase
    .channel('public:inventory')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inventory' },
      (payload) => {
        onUpdate(payload)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

/**
 * Subscribe to realtime emergency requests changes
 * @param {Function} onUpdate Callback when emergency request is created or updated
 * @returns {{ unsubscribe: Function }}
 */
export function subscribeToEmergencyRequestsRealtime(onUpdate) {
  const channel = supabase
    .channel('public:emergency_requests')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'emergency_requests' },
      (payload) => {
        onUpdate(payload)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

