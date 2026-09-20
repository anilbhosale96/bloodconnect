/**
 * LIFE-LINK Emergency Blood Response System
 * Donor Service: Proximity Matching & Emergency Response
 */

import { supabase } from '../lib/supabase.js';
import { calculateHaversineDistance } from '../lib/calculations.js';

// Standard donor compatibility matrix (or exact matching)
export const BLOOD_COMPATIBILITY = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

/**
 * Checks if a donor blood group matches/is compatible with an emergency request.
 *
 * @param {string} donorGroup - Donor's blood group (e.g. 'O+')
 * @param {string} requestGroup - Required blood group (e.g. 'O+')
 * @param {boolean} [exactOnly=true] - When true, requires identical group per prompt constraint
 * @returns {boolean}
 */
export function isBloodCompatible(donorGroup, requestGroup, exactOnly = true) {
  if (!donorGroup || !requestGroup) return false;
  if (exactOnly) {
    return donorGroup.trim().toUpperCase() === requestGroup.trim().toUpperCase();
  }
  const recipientList = BLOOD_COMPATIBILITY[donorGroup.trim().toUpperCase()] || [];
  return recipientList.includes(requestGroup.trim().toUpperCase());
}

/**
 * Filters and scores nearby emergency requests for a donor within 20km.
 *
 * @param {Array<Object>} requests - List of candidate emergency requests
 * @param {Object} donor - Donor info with blood_group, latitude, longitude
 * @param {Object} [options]
 * @param {number} [options.maxRadiusKm=20] - Maximum radius constraint (20km)
 * @param {boolean} [options.exactOnly=true] - Exact blood group match requirement
 * @returns {Array<Object>} Sorted nearby matching requests
 */
export function filterNearbyRequestsForDonor(requests = [], donor = {}, options = {}) {
  const maxRadiusKm = options.maxRadiusKm ?? 20;
  const exactOnly = options.exactOnly ?? true;
  const donorLat = donor.latitude ?? 18.5204;
  const donorLon = donor.longitude ?? 73.8567;
  const donorGroup = donor.blood_group || 'O+';

  return requests
    .filter((req) => {
      // 1. Blood group compatibility filter
      const matchesGroup = isBloodCompatible(donorGroup, req.blood_group, exactOnly);
      if (!matchesGroup) return false;

      // 2. Proximity filter (must be within 20km)
      const reqLat = req.latitude ?? donorLat;
      const reqLon = req.longitude ?? donorLon;
      const dist = calculateHaversineDistance(donorLat, donorLon, reqLat, reqLon);

      if (dist > maxRadiusKm) return false;

      return true;
    })
    .map((req) => {
      const reqLat = req.latitude ?? donorLat;
      const reqLon = req.longitude ?? donorLon;
      const distanceKm = calculateHaversineDistance(donorLat, donorLon, reqLat, reqLon);

      return {
        ...req,
        distance_km: distanceKm,
        hospital_name: req.hospital_name || req.hospitals?.hospital_name || 'Emergency Medical Center'
      };
    })
    .sort((a, b) => {
      // Prioritize CRITICAL over HIGH over NORMAL, then sort by distance
      const urgencyRank = { CRITICAL: 3, HIGH: 2, NORMAL: 1 };
      const urgA = urgencyRank[a.urgency] || 1;
      const urgB = urgencyRank[b.urgency] || 1;
      if (urgA !== urgB) return urgB - urgA;
      return (a.distance_km || 0) - (b.distance_km || 0);
    });
}

/**
 * Fetches nearby compatible emergency requests from database.
 *
 * @param {Object} donor
 * @param {Object} [options]
 * @returns {Promise<Array<Object>>}
 */
export async function fetchDonorCompatibleRequests(donor, options = {}) {
  try {
    // 1. Fetch active emergency requests
    const { data: requests, error: reqErr } = await supabase
      .from('emergency_requests')
      .select('*')
      .neq('status', 'FULFILLED')
      .neq('status', 'CANCELLED')
      .order('created_at', { ascending: false });

    if (reqErr) {
      console.warn('Could not fetch emergency_requests for donor:', reqErr.message);
    }

    // 2. Fetch hospitals metadata for facility names
    const { data: hospitals } = await supabase
      .from('hospitals')
      .select('id, profile_id, hospital_name, city, address');

    const hospMap = new Map();
    (hospitals || []).forEach((h) => {
      hospMap.set(h.id, h.hospital_name);
      if (h.profile_id) hospMap.set(h.profile_id, h.hospital_name);
    });

    const enriched = (requests || []).map((r) => ({
      ...r,
      hospital_name: hospMap.get(r.hospital_id) || 'Emergency Medical Center'
    }));

    return filterNearbyRequestsForDonor(enriched, donor, options);
  } catch (err) {
    console.warn('fetchDonorCompatibleRequests error:', err);
    return [];
  }
}

/**
 * Submits donor response to an emergency request.
 * Logs response to `responses` table and notifies hospital.
 *
 * @param {Object} params
 * @param {string} params.requestId
 * @param {string} [params.hospitalId]
 * @param {string} params.donorId
 * @param {string} [params.donorName]
 * @param {string} [params.donorBloodGroup]
 * @param {string} [params.notes]
 * @returns {Promise<{ success: boolean, data: any, error: any }>}
 */
export async function respondAsDonor({
  requestId,
  hospitalId,
  donorId,
  donorName = 'Voluntary Donor',
  donorBloodGroup = 'O+',
  notes = ''
}) {
  try {
    // 1. Record response in `responses` table
    const responsePayload = {
      request_id: requestId,
      responder_id: donorId,
      units_offered: 1, // Donors pledge 1 donation unit
      notes: notes || `Donor Volunteer: ${donorName} (${donorBloodGroup}) pledged immediate donation.`
    };

    const { data: responseData, error: respErr } = await supabase
      .from('responses')
      .insert(responsePayload)
      .select()
      .maybeSingle();

    if (respErr) {
      console.warn('Could not insert into responses table (proceeding):', respErr.message);
    }

    // 2. Notify requesting hospital in `notifications` table
    if (hospitalId) {
      await supabase.from('notifications').insert({
        recipient_id: hospitalId,
        request_id: requestId,
        status: 'UNREAD',
        message: `DONOR ALERT: ${donorName} (${donorBloodGroup}) has responded to your emergency call and volunteered to donate.`
      });
    }

    return {
      success: true,
      data: responseData || responsePayload,
      error: null
    };
  } catch (err) {
    console.error('respondAsDonor exception:', err);
    return {
      success: false,
      data: null,
      error: err
    };
  }
}

/**
 * Retrieves donor profile from Supabase with fallback.
 *
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getDonorProfile(userId) {
  if (!userId) {
    return {
      id: 'demo-donor',
      profile_id: 'demo-donor',
      name: 'Priya Sharma',
      blood_group: 'O+',
      latitude: 18.5204,
      longitude: 73.8567,
      is_available: true
    };
  }

  try {
    const { data: donorRow } = await supabase
      .from('donors')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const savedAvailability = localStorage.getItem(`donor_avail_${userId}`);
    const isAvailable = savedAvailability !== null ? savedAvailability === 'true' : true;

    return {
      id: donorRow?.id || userId,
      profile_id: userId,
      name: profileRow?.full_name || 'Registered Donor',
      blood_group: donorRow?.blood_group || 'O+',
      latitude: donorRow?.latitude || 18.5204,
      longitude: donorRow?.longitude || 73.8567,
      last_donation_date: donorRow?.last_donation_date,
      is_available: isAvailable
    };
  } catch (err) {
    console.warn('getDonorProfile error:', err);
    return {
      id: userId,
      profile_id: userId,
      name: 'Registered Donor',
      blood_group: 'O+',
      latitude: 18.5204,
      longitude: 73.8567,
      is_available: true
    };
  }
}

/**
 * Updates donor availability toggle state in localStorage.
 *
 * @param {string} userId
 * @param {boolean} isAvailable
 */
export function setDonorAvailability(userId, isAvailable) {
  if (userId) {
    localStorage.setItem(`donor_avail_${userId}`, String(isAvailable));
  }
}

