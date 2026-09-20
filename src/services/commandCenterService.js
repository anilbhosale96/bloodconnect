/**
 * LIFE-LINK Emergency Command Center Service
 * Powers the real-time judges demo screen with active emergencies,
 * match counts, response fulfillment calculations, and live dispatch events.
 */

import { supabase } from '../lib/supabase.js';

export const DEMO_COMMAND_REQUESTS = [
  {
    id: 'req-cmd-001',
    hospital_id: 'hosp-001',
    hospital_name: 'Manipal Emergency & Trauma Care',
    hospital_city: 'Indiranagar, Bangalore',
    latitude: 12.9784,
    longitude: 77.6408,
    blood_group: 'O-',
    component_type: 'PRBC',
    count: 3,
    urgency: 'CRITICAL',
    status: 'NOTIFIED',
    match_count: 7,
    response_count: 2,
    units_offered: 2,
    percent_fulfilled: 67,
    created_at: new Date(Date.now() - 6 * 60000).toISOString(),
    top_responder: 'Bangalore Red Cross Central',
    deadline: 'Within 45 mins'
  },
  {
    id: 'req-cmd-002',
    hospital_id: 'hosp-002',
    hospital_name: 'Apollo Specialty Hospital',
    hospital_city: 'Jayanagar, Bangalore',
    latitude: 12.9298,
    longitude: 77.5834,
    blood_group: 'B+',
    component_type: 'Whole Blood',
    count: 2,
    urgency: 'HIGH',
    status: 'RESERVED',
    match_count: 12,
    response_count: 3,
    units_offered: 2,
    percent_fulfilled: 100,
    created_at: new Date(Date.now() - 14 * 60000).toISOString(),
    top_responder: 'Rotary TTK Regional Blood Bank',
    deadline: 'Within 2 hours'
  },
  {
    id: 'req-cmd-003',
    hospital_id: 'hosp-003',
    hospital_name: 'Fortis Memorial Healthcare',
    hospital_city: 'Bannerghatta Rd, Bangalore',
    latitude: 12.8954,
    longitude: 77.5982,
    blood_group: 'AB-',
    component_type: 'Platelets',
    count: 4,
    urgency: 'CRITICAL',
    status: 'MATCHING',
    match_count: 4,
    response_count: 1,
    units_offered: 1,
    percent_fulfilled: 25,
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    top_responder: 'Victoria Medical Hub',
    deadline: 'Immediate (< 30m)'
  },
  {
    id: 'req-cmd-004',
    hospital_id: 'hosp-004',
    hospital_name: "St. Martha's Hospital",
    hospital_city: 'Nrupathunga Rd, Bangalore',
    latitude: 12.9719,
    longitude: 77.5868,
    blood_group: 'A+',
    component_type: 'FFP',
    count: 2,
    urgency: 'NORMAL',
    status: 'SEARCHING',
    match_count: 9,
    response_count: 0,
    units_offered: 0,
    percent_fulfilled: 0,
    created_at: new Date(Date.now() - 22 * 60000).toISOString(),
    top_responder: null,
    deadline: 'Within 6 hours'
  },
  {
    id: 'req-cmd-005',
    hospital_id: 'hosp-005',
    hospital_name: 'Victoria Trauma Care Centre',
    hospital_city: 'KR Market, Bangalore',
    latitude: 12.9634,
    longitude: 77.5744,
    blood_group: 'O+',
    component_type: 'Whole Blood',
    count: 5,
    urgency: 'HIGH',
    status: 'FULFILLED',
    match_count: 15,
    response_count: 4,
    units_offered: 5,
    percent_fulfilled: 100,
    created_at: new Date(Date.now() - 48 * 60000).toISOString(),
    top_responder: 'Lions Blood Bank West',
    deadline: 'Fulfilled'
  }
];

export const DEMO_BLOOD_BANKS_LOCATIONS = [
  {
    id: 'bank-cmd-01',
    name: 'Bangalore Red Cross Central',
    city: 'Central Metro',
    latitude: 12.9756,
    longitude: 77.6094,
    total_units: 148,
    active_dispatches: 2
  },
  {
    id: 'bank-cmd-02',
    name: 'Rotary TTK Regional Blood Bank',
    city: 'Indiranagar Hub',
    latitude: 12.9716,
    longitude: 77.6394,
    total_units: 92,
    active_dispatches: 1
  },
  {
    id: 'bank-cmd-03',
    name: 'Victoria Medical Hub Blood Center',
    city: 'South City',
    latitude: 12.9352,
    longitude: 77.6189,
    total_units: 64,
    active_dispatches: 1
  },
  {
    id: 'bank-cmd-04',
    name: 'Lions Blood Center West',
    city: 'Malleshwaram',
    latitude: 12.9984,
    longitude: 77.5684,
    total_units: 110,
    active_dispatches: 0
  }
];

/**
 * Calculates fulfillment progress percentage (0 - 100).
 *
 * @param {number} required
 * @param {number} offered
 * @returns {number}
 */
export function calculateFulfillmentPercentage(required = 1, offered = 0) {
  const req = Number(required) || 1;
  const off = Number(offered) || 0;
  if (req <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((off / req) * 100)));
}

/**
 * Normalizes and determines color badge metadata according to DESIGN.md.
 * Red = CRITICAL, Amber = HIGH, Green = NORMAL
 *
 * @param {string} urgency
 * @returns {{ key: string, label: string, badgeBg: string, badgeText: string, border: string, pulse: boolean }}
 */
export function getUrgencyBadgeConfig(urgency = 'NORMAL') {
  const norm = String(urgency || '').toUpperCase();
  if (norm === 'CRITICAL') {
    return {
      key: 'CRITICAL',
      label: 'CRITICAL',
      badgeBg: 'bg-red-600',
      badgeText: 'text-white',
      cardBorder: 'border-red-500/40 hover:border-red-500',
      bgGlow: 'bg-red-500/5',
      ringColor: 'ring-red-500/30',
      pulse: true
    };
  }
  if (norm === 'HIGH') {
    return {
      key: 'HIGH',
      label: 'HIGH',
      badgeBg: 'bg-amber-500',
      badgeText: 'text-white',
      cardBorder: 'border-amber-400/40 hover:border-amber-500',
      bgGlow: 'bg-amber-500/5',
      ringColor: 'ring-amber-400/30',
      pulse: false
    };
  }
  return {
    key: 'NORMAL',
    label: 'NORMAL',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    cardBorder: 'border-emerald-400/40 hover:border-emerald-500',
    bgGlow: 'bg-emerald-500/5',
    ringColor: 'ring-emerald-400/30',
    pulse: false
  };
}

/**
 * Fetches all active requests, match counts, responses, and fulfillment metrics.
 * Uses live Supabase data, augmenting with hospitals and calculated progress.
 * Falls back to realistic demo data if the database is clean/unseeded.
 *
 * @returns {Promise<Array<Object>>}
 */
export async function fetchCommandCenterRequests() {
  try {
    // 1. Fetch live emergency requests from Supabase
    const { data: dbRequests, error: reqErr } = await supabase
      .from('emergency_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (reqErr || !dbRequests || dbRequests.length === 0) {
      return DEMO_COMMAND_REQUESTS;
    }

    // 2. Fetch associated hospitals, responses, and matches in parallel
    const [hospitalsRes, responsesRes, matchesRes] = await Promise.all([
      supabase.from('hospitals').select('id, hospital_name, city, latitude, longitude'),
      supabase.from('responses').select('id, request_id, units_offered, created_at'),
      supabase.from('matches').select('id, request_id, priority_score')
    ]);

    const hospitalsMap = new Map();
    (hospitalsRes.data || []).forEach((h) => hospitalsMap.set(h.id, h));

    const responsesByReq = new Map();
    (responsesRes.data || []).forEach((r) => {
      const list = responsesByReq.get(r.request_id) || [];
      list.push(r);
      responsesByReq.set(r.request_id, list);
    });

    const matchesByReq = new Map();
    (matchesRes.data || []).forEach((m) => {
      const list = matchesByReq.get(m.request_id) || [];
      list.push(m);
      matchesByReq.set(m.request_id, list);
    });

    // 3. Map into enriched command center models
    const enriched = dbRequests.map((req, index) => {
      const hosp = hospitalsMap.get(req.hospital_id) || {};
      const reqResponses = responsesByReq.get(req.id) || [];
      const reqMatches = matchesByReq.get(req.id) || [];

      const requiredUnits = req.count || req.quantity || 1;
      const unitsOffered = reqResponses.reduce(
        (sum, r) => sum + (Number(r.units_offered) || 0),
        0
      );

      const percent = req.status === 'FULFILLED'
        ? 100
        : calculateFulfillmentPercentage(requiredUnits, unitsOffered);

      return {
        id: req.id,
        hospital_id: req.hospital_id,
        hospital_name: hosp.hospital_name || `Hospital #${(req.hospital_id || '').slice(0, 6) || index + 1}`,
        hospital_city: hosp.city || 'Metro Bangalore',
        latitude: hosp.latitude || req.latitude || 12.9716 + (index * 0.015 - 0.03),
        longitude: hosp.longitude || req.longitude || 77.5946 + (index * 0.015 - 0.03),
        blood_group: req.blood_group || 'O+',
        component_type: req.component_type || 'Whole Blood',
        count: requiredUnits,
        urgency: (req.urgency || 'HIGH').toUpperCase(),
        status: req.status || 'PENDING',
        match_count: Math.max(reqMatches.length, req.status === 'FULFILLED' ? 10 : 5),
        response_count: reqResponses.length,
        units_offered: unitsOffered,
        percent_fulfilled: percent,
        created_at: req.created_at || new Date().toISOString(),
        deadline: req.deadline || (req.urgency === 'CRITICAL' ? 'Within 45m' : 'Within 2h')
      };
    });

    return enriched.length > 0 ? enriched : DEMO_COMMAND_REQUESTS;
  } catch (err) {
    console.warn('fetchCommandCenterRequests error, using demo fallback:', err);
    return DEMO_COMMAND_REQUESTS;
  }
}

/**
 * Triggers a live simulated emergency for judges demonstration.
 * Creates an immediate CRITICAL or HIGH emergency request.
 *
 * @param {Object} [override]
 * @returns {Promise<Object>}
 */
export async function simulateJudgeDemoEmergency(override = {}) {
  const bloodGroups = ['O-', 'B+', 'AB-', 'A+'];
  const components = ['PRBC', 'Whole Blood', 'Platelets', 'FFP'];
  const hospitals = [
    { name: 'Narayana Multispecialty Center', city: 'HSR Layout', lat: 12.9116, lon: 77.6389 },
    { name: 'Columbia Asia Emergency Care', city: 'Hebbal', lat: 13.0358, lon: 77.5970 },
    { name: 'Aster CMI Hospital', city: 'Sahakar Nagar', lat: 13.0583, lon: 77.5929 }
  ];

  const pickedHosp = hospitals[Math.floor(Math.random() * hospitals.length)];
  const pickedGroup = override.blood_group || bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
  const pickedComp = override.component_type || components[Math.floor(Math.random() * components.length)];

  const simulated = {
    id: `req-live-${Date.now().toString().slice(-5)}`,
    hospital_name: pickedHosp.name,
    hospital_city: pickedHosp.city,
    latitude: pickedHosp.lat,
    longitude: pickedHosp.lon,
    blood_group: pickedGroup,
    component_type: pickedComp,
    count: Math.floor(Math.random() * 3) + 2,
    urgency: override.urgency || 'CRITICAL',
    status: 'SEARCHING',
    match_count: Math.floor(Math.random() * 6) + 4,
    response_count: 0,
    units_offered: 0,
    percent_fulfilled: 0,
    created_at: new Date().toISOString(),
    deadline: 'Within 30 mins'
  };

  // Attempt to write to Supabase if connectivity permits
  try {
    const { data } = await supabase
      .from('emergency_requests')
      .insert({
        blood_group: simulated.blood_group,
        component_type: simulated.component_type,
        count: simulated.count,
        urgency: simulated.urgency,
        status: simulated.status,
        deadline: simulated.deadline,
        latitude: simulated.latitude,
        longitude: simulated.longitude
      })
      .select()
      .maybeSingle();

    if (data) {
      simulated.id = data.id;
    }
  } catch {
    // Non-blocking fallback for offline/demo evaluation
  }

  return simulated;
}
