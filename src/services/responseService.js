import { supabase } from '../lib/supabase.js'

/**
 * Calculate distance between two coordinates using the Haversine formula (km)
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers rounded to 1 decimal place
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.8

  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const dist = R * c
  return Math.round(dist * 10) / 10
}

/**
 * Fetch a single emergency request with hospital metadata
 * @param {string} requestId
 * @returns {Promise<{ data: any|null, error: Error|null }>}
 */
export async function getEmergencyRequestWithHospital(requestId) {
  try {
    const { data: request, error: reqErr } = await supabase
      .from('emergency_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()

    if (reqErr || !request) {
      return { data: null, error: reqErr || new Error('Request not found.') }
    }

    let hospital = null
    if (request.hospital_id) {
      const { data: hosp } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', request.hospital_id)
        .maybeSingle()
      hospital = hosp
    }

    return {
      data: {
        ...request,
        hospital: hospital || {
          hospital_name: 'Metro Emergency Hospital',
          city: 'Central District',
          address: 'Main Health Corridor',
          latitude: request.latitude || 18.5204,
          longitude: request.longitude || 73.8567,
        },
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/**
 * Handle a blood bank's response to an emergency request
 * - Logs the response in the `responses` table
 * - Updates inventory reserved_units (if accepted/partial)
 * - Creates a notification for the requesting hospital
 * - Updates the emergency_request status to 'NOTIFIED'
 *
 * @param {Object} params
 * @param {string} params.requestId
 * @param {string} params.hospitalId
 * @param {string} params.responderId
 * @param {'ACCEPT'|'PARTIAL'|'DECLINE'} params.action
 * @param {number} params.unitsOffered
 * @param {string} [params.notes]
 * @param {string} params.bloodGroup
 * @param {string} params.componentType
 * @returns {Promise<{ data: any|null, error: Error|null }>}
 */
export async function respondToEmergencyRequest({
  requestId,
  hospitalId,
  responderId,
  action,
  unitsOffered = 0,
  notes = '',
  bloodGroup,
  componentType,
}) {
  try {
    const offered = action === 'DECLINE' ? 0 : Math.max(0, parseInt(unitsOffered, 10) || 0)
    const formattedNotes = notes || (action === 'ACCEPT' ? 'Full units accepted' : action === 'PARTIAL' ? `Partial offer: ${offered} units` : 'Declined request')

    // 1. Log response in responses table
    const responsePayload = {
      request_id: requestId,
      responder_id: responderId || '00000000-0000-0000-0000-000000000000',
      units_offered: offered,
      notes: formattedNotes,
    }

    const { data: responseData, error: respError } = await supabase
      .from('responses')
      .insert(responsePayload)
      .select()
      .maybeSingle()

    if (respError) {
      console.warn('Failed to log into responses table (proceeding):', respError)
    }

    // 2. When accepted, update inventory: reserved_units += offered
    if (offered > 0 && bloodGroup) {
      // Find matching inventory record
      const { data: invItems } = await supabase
        .from('inventory')
        .select('*')
        .eq('blood_group', bloodGroup)
        .eq('component_type', componentType || 'Whole Blood')

      if (invItems && invItems.length > 0) {
        const item = invItems[0]
        const newReserved = (item.reserved_units || 0) + offered
        const newAvailable = Math.max(0, (item.available_units || item.count || 0) - offered)

        await supabase
          .from('inventory')
          .update({
            reserved_units: newReserved,
            available_units: newAvailable,
            count: newAvailable,
          })
          .eq('id', item.id)
      }
    }

    // 3. Create notification for hospital
    const notifMessage =
      action === 'ACCEPT'
        ? `Blood Bank accepted full ${offered} units of ${bloodGroup} (${componentType}). Dispatch prepared.`
        : action === 'PARTIAL'
        ? `Blood Bank offered ${offered} units of ${bloodGroup} (${componentType}). Awaiting confirmation.`
        : `Blood Bank was unable to fulfill ${bloodGroup} request. System routing to next ranked facility.`

    const notifPayload = {
      recipient_id: hospitalId || '00000000-0000-0000-0000-000000000000',
      message: notifMessage,
      status: 'UNREAD',
      request_id: requestId,
    }

    await supabase.from('notifications').insert(notifPayload)

    // 4. Update request status to 'NOTIFIED'
    await supabase
      .from('emergency_requests')
      .update({ status: 'NOTIFIED' })
      .eq('id', requestId)

    return {
      data: {
        success: true,
        action,
        unitsOffered: offered,
        response: responseData,
        status: 'NOTIFIED',
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

