import { supabase } from '../lib/supabase.js'
import { getSeedData, SEED_EMERGENCY_REQUESTS } from '../lib/seedData.js'

export const VALID_BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export const VALID_COMPONENTS = [
  'Whole Blood',
  'PRBC',
  'Platelets',
  'FFP',
  'Cryoprecipitate',
]

export const VALID_URGENCIES = ['CRITICAL', 'HIGH', 'NORMAL']

/**
 * Service-side validation for emergency blood request inputs
 * @param {Object} params
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateEmergencyRequestInput({ blood_group, component_type, quantity, urgency }) {
  if (!blood_group || !VALID_BLOOD_GROUPS.includes(blood_group)) {
    return {
      valid: false,
      error: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`,
    }
  }

  if (!component_type || !VALID_COMPONENTS.includes(component_type)) {
    return {
      valid: false,
      error: `Invalid component type. Must be one of: ${VALID_COMPONENTS.join(', ')}`,
    }
  }

  const numQuantity = Number(quantity)
  if (!quantity || isNaN(numQuantity) || numQuantity <= 0 || !Number.isInteger(numQuantity)) {
    return {
      valid: false,
      error: 'Quantity must be a positive whole number greater than 0.',
    }
  }

  if (!urgency || !VALID_URGENCIES.includes(urgency)) {
    return {
      valid: false,
      error: `Invalid urgency level. Must be one of: ${VALID_URGENCIES.join(', ')}`,
    }
  }

  return { valid: true, error: null }
}

/**
 * Create a new emergency blood request in Supabase
 *
 * @param {Object} requestData
 * @param {string} requestData.blood_group
 * @param {string} requestData.component_type
 * @param {number} requestData.quantity
 * @param {'CRITICAL'|'HIGH'|'NORMAL'} requestData.urgency
 * @param {number} [requestData.latitude]
 * @param {number} [requestData.longitude]
 * @param {string} [requestData.hospital_id]
 * @param {string} [requestData.deadline]
 * @returns {Promise<{ data: any|null, error: Error|null }>}
 */
export async function createEmergencyRequest({
  blood_group,
  component_type,
  quantity,
  urgency,
  latitude = 18.5204,
  longitude = 73.8567,
  hospital_id,
  deadline,
}) {
  // 1. Validate inputs
  const validation = validateEmergencyRequestInput({
    blood_group,
    component_type,
    quantity,
    urgency,
  })

  if (!validation.valid) {
    return { data: null, error: new Error(validation.error) }
  }

  const calculatedDeadline =
    deadline ||
    (urgency === 'CRITICAL'
      ? new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
      : urgency === 'HIGH'
      ? new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString())

  // 2. Prepare payload matching database schema
  const payload = {
    blood_group,
    component_type,
    urgency,
    status: 'CREATED',
    latitude: Number(latitude),
    longitude: Number(longitude),
    deadline: calculatedDeadline,
  }

  if (hospital_id) {
    payload.hospital_id = hospital_id
  }

  try {
    const { data, error } = await supabase
      .from('emergency_requests')
      .insert(payload)
      .select()
      .maybeSingle()

    if (error) {
      // If RLS blocked insert because client lacks active session, return descriptive error
      return { data: null, error }
    }

    // Return created record enriched with requested quantity
    const result = {
      ...(data || payload),
      id: data?.id || `mock-${Date.now()}`,
      quantity: Number(quantity),
    }

    return { data: result, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/**
 * Get all emergency requests
 * @param {string} [hospital_id]
 * @returns {Promise<{ data: any[]|null, error: Error|null }>}
 */
export async function getEmergencyRequests(hospital_id) {
  try {
    let query = supabase
      .from('emergency_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (hospital_id) {
      query = query.eq('hospital_id', hospital_id)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return { data, error: null }
    }

    // Fallback to seeded demo requests
    const seedData = getSeedData()
    let requests = seedData?.emergencyRequests || SEED_EMERGENCY_REQUESTS
    if (hospital_id) {
      requests = requests.filter((r) => r.hospital_id === hospital_id)
    }

    return { data: requests, error: null }
  } catch {
    const seedData = getSeedData()
    let requests = seedData?.emergencyRequests || SEED_EMERGENCY_REQUESTS
    if (hospital_id) {
      requests = requests.filter((r) => r.hospital_id === hospital_id)
    }
    return { data: requests, error: null }
  }
}

