/**
 * LIFE-LINK Emergency Blood Response System
 * Rule-Based Matching Engine
 *
 * Scoring Formula:
 * Priority Score = 40% Availability + 30% Distance + 20% Urgency + 10% Freshness
 */

import { supabase } from '../lib/supabase.js';
import {
  calculateHaversineDistance,
  calculateAvailabilityScore,
  calculateDistanceScore,
  calculateUrgencyScore,
  calculateFreshnessScore,
  calculatePriorityScore
} from '../lib/calculations.js';

/**
 * Evaluates and scores a single candidate resource against an emergency request.
 *
 * @param {Object} candidate - Candidate blood bank / inventory record
 * @param {Object} request - The emergency blood request
 * @param {Object} [options] - Additional scoring or filtering overrides
 * @returns {Object} Scored candidate with breakdown and priority_score
 */
export function scoreCandidateResource(candidate, request, options = {}) {
  const requiredUnits = request.count || request.quantity || 1;
  const availableUnits = candidate.available_units ?? candidate.units ?? 0;
  const requestLat = request.latitude;
  const requestLon = request.longitude;
  const bankLat = candidate.latitude;
  const bankLon = candidate.longitude;

  // 1. Distance (Haversine Formula)
  const distanceKm =
    requestLat != null && requestLon != null && bankLat != null && bankLon != null
      ? calculateHaversineDistance(requestLat, requestLon, bankLat, bankLon)
      : candidate.distance_km ?? 999;

  // 2. Component Scores (All 0 - 100)
  const availabilityScore = calculateAvailabilityScore(availableUnits, requiredUnits);
  const distanceScore = calculateDistanceScore(distanceKm);
  const urgencyScore = calculateUrgencyScore(request.urgency);
  const freshnessScore = calculateFreshnessScore(request.created_at, options.referenceTime);

  // 3. Composite Priority Score: 40% Availability + 30% Distance + 20% Urgency + 10% Freshness
  const priorityScore = calculatePriorityScore({
    availabilityScore,
    distanceScore,
    urgencyScore,
    freshnessScore
  });

  return {
    resource_id: candidate.blood_bank_id || candidate.id,
    resource_name: candidate.name || candidate.bank_name || 'Blood Bank Partner',
    resource_type: candidate.resource_type || 'BLOOD_BANK',
    blood_group: candidate.blood_group,
    component_type: candidate.component_type,
    available_units: availableUnits,
    required_units: requiredUnits,
    distance_km: distanceKm,
    scores: {
      availability: availabilityScore,
      distance: distanceScore,
      urgency: urgencyScore,
      freshness: freshnessScore
    },
    priority_score: priorityScore
  };
}

/**
 * Filters candidates based on:
 * 1. Correct blood group
 * 2. Component type
 * 3. Sufficient quantity (available_units > 0 or >= requiredUnits if strict)
 * 4. Within search radius (default 50km or configurable)
 *
 * @param {Array<Object>} candidates
 * @param {Object} request
 * @param {Object} [options]
 * @returns {Array<Object>} Filtered and scored candidates sorted descending by priority_score
 */
export function filterAndScoreCandidates(candidates = [], request, options = {}) {
  const maxRadiusKm = options.maxRadiusKm ?? 50;
  const strictQuantity = options.strictQuantity ?? false;
  const requiredUnits = request.count || request.quantity || 1;

  const filtered = candidates.filter((item) => {
    // A. Blood group filter
    if (request.blood_group && item.blood_group !== request.blood_group) {
      return false;
    }

    // B. Component type filter
    if (request.component_type && item.component_type !== request.component_type) {
      return false;
    }

    // C. Sufficient quantity filter
    const available = item.available_units ?? item.units ?? 0;
    if (strictQuantity) {
      if (available < requiredUnits) return false;
    } else {
      if (available <= 0) return false;
    }

    // D. Radius filter (if coordinates exist)
    const reqLat = request.latitude;
    const reqLon = request.longitude;
    const itemLat = item.latitude;
    const itemLon = item.longitude;

    if (reqLat != null && reqLon != null && itemLat != null && itemLon != null) {
      const dist = calculateHaversineDistance(reqLat, reqLon, itemLat, itemLon);
      if (dist > maxRadiusKm) return false;
    }

    return true;
  });

  // Score each valid candidate
  const scored = filtered.map((candidate) =>
    scoreCandidateResource(candidate, request, options)
  );

  // Sort descending by priority_score (higher is better)
  scored.sort((a, b) => b.priority_score - a.priority_score);

  return scored;
}

/**
 * Persists match records to the database `matches` table.
 *
 * @param {string} requestId
 * @param {Array<Object>} matches - Array of scored match items
 * @returns {Promise<Array<Object>>}
 */
export async function saveMatchesToDatabase(requestId, matches = []) {
  if (!requestId || !matches.length) return [];

  const rowsToInsert = matches.map((m) => ({
    request_id: requestId,
    resource_id: m.resource_id,
    resource_type: m.resource_type || 'BLOOD_BANK',
    distance_km: m.distance_km,
    priority_score: m.priority_score
  }));

  try {
    const { data, error } = await supabase
      .from('matches')
      .insert(rowsToInsert)
      .select();

    if (error) {
      console.warn('Could not insert into matches table (proceeding):', error.message);
      return rowsToInsert;
    }
    return data || rowsToInsert;
  } catch (err) {
    console.warn('saveMatchesToDatabase exception (proceeding):', err.message);
    return rowsToInsert;
  }
}

/**
 * Main engine entry point:
 * Finds, scores, ranks, and records top matching resources for an emergency blood request.
 *
 * @param {string|Object} requestOrId - Emergency request object or request UUID
 * @param {Object} [options] - Options (limit = 5, maxRadiusKm = 50, etc.)
 * @returns {Promise<{ success: boolean, request: Object, matches: Array<Object> }>}
 */
export async function findMatchesForRequest(requestOrId, options = {}) {
  const limit = options.limit ?? 5;

  // 1. Resolve Emergency Request
  let request = typeof requestOrId === 'object' ? requestOrId : null;
  if (!request && typeof requestOrId === 'string') {
    const { data, error } = await supabase
      .from('emergency_requests')
      .select('*')
      .eq('id', requestOrId)
      .single();

    if (error || !data) {
      throw new Error(`Emergency request ${requestOrId} not found`);
    }
    request = data;
  }

  if (!request) {
    throw new Error('No valid emergency request provided for matching');
  }

  // 2. Fetch inventory items matching blood group & component
  const { data: inventoryItems, error: invError } = await supabase
    .from('inventory')
    .select('*')
    .eq('blood_group', request.blood_group)
    .eq('component_type', request.component_type)
    .gt('available_units', 0);

  if (invError) {
    console.error('Error fetching inventory:', invError);
  }

  // 3. Fetch blood bank details (for names and location coordinates)
  const { data: bloodBanks, error: bankError } = await supabase
    .from('blood_banks')
    .select('id, profile_id, name, address, city, latitude, longitude, phone');

  if (bankError) {
    console.error('Error fetching blood banks:', bankError);
  }

  // Map blood bank locations onto inventory items
  const banksMap = new Map();
  (bloodBanks || []).forEach((b) => {
    banksMap.set(b.id, b);
    if (b.profile_id) banksMap.set(b.profile_id, b);
  });

  const candidates = (inventoryItems || []).map((inv) => {
    const bank = banksMap.get(inv.blood_bank_id) || {};
    return {
      ...inv,
      name: bank.name || 'Blood Bank Partner',
      address: bank.address,
      city: bank.city,
      latitude: bank.latitude,
      longitude: bank.longitude,
      phone: bank.phone
    };
  });

  // 4. Filter, score, and rank candidates
  const scoredCandidates = filterAndScoreCandidates(candidates, request, options);

  // 5. Select top N matches
  const topMatches = scoredCandidates.slice(0, limit);

  // 6. Persist matches to database
  if (topMatches.length > 0 && request.id) {
    await saveMatchesToDatabase(request.id, topMatches);
  }

  return {
    success: true,
    request,
    totalCandidates: candidates.length,
    matchedCount: scoredCandidates.length,
    matches: topMatches
  };
}
