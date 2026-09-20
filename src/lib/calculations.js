/**
 * LIFE-LINK Emergency Response System
 * Core Calculation Utilities & Rule-Based Matching Formulas
 */

export const EARTH_RADIUS_KM = 6371;

/**
 * Calculates distance between two coordinates in kilometers using the Haversine formula.
 *
 * Formula:
 * distance = 2R * asin(
 *   sqrt(
 *     sin²((lat2-lat1)/2)
 *     + cos(lat1)*cos(lat2)*sin²((lon2-lon1)/2)
 *   )
 * )
 *
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }

  // Identical coordinates check
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;

  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLon = Math.sin(dLon / 2);

  const a =
    sinHalfDLat * sinHalfDLat +
    Math.cos(rLat1) * Math.cos(rLat2) * sinHalfDLon * sinHalfDLon;

  // Clamp a between 0 and 1 to prevent NaN from tiny floating point inaccuracies
  const clampedA = Math.max(0, Math.min(1, a));
  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(clampedA));

  // Round to 2 decimal places to avoid floating point anomalies
  return Math.round(distance * 100) / 100;
}

/**
 * Calculates Availability Score (0 - 100).
 * Availability = (available_units / required_units) * 100
 *
 * @param {number} availableUnits
 * @param {number} requiredUnits
 * @returns {number} Score between 0 and 100
 */
export function calculateAvailabilityScore(availableUnits, requiredUnits) {
  if (!requiredUnits || requiredUnits <= 0) return 100;
  if (!availableUnits || availableUnits <= 0) return 0;

  const rawScore = (availableUnits / requiredUnits) * 100;
  const clamped = Math.min(100, Math.max(0, rawScore));
  return Math.round(clamped * 100) / 100;
}

/**
 * Calculates Distance Score (0 - 100) based on Haversine distance.
 *
 * Bracket:
 * 0 - 2km   = 100
 * 2 - 5km   = 80
 * 5 - 10km  = 60
 * 10 - 20km = 30
 * > 20km    = 0
 *
 * @param {number} distanceKm
 * @returns {number}
 */
export function calculateDistanceScore(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm) || distanceKm < 0) {
    return 0;
  }
  if (distanceKm <= 2) return 100;
  if (distanceKm <= 5) return 80;
  if (distanceKm <= 10) return 60;
  if (distanceKm <= 20) return 30;
  return 0;
}

/**
 * Calculates Urgency Score (0 - 100).
 * CRITICAL = 100
 * HIGH     = 70
 * NORMAL   = 40
 *
 * @param {string} urgency
 * @returns {number}
 */
export function calculateUrgencyScore(urgency) {
  const norm = String(urgency || '').trim().toUpperCase();
  switch (norm) {
    case 'CRITICAL':
      return 100;
    case 'HIGH':
      return 70;
    case 'NORMAL':
    default:
      return 40;
  }
}

/**
 * Calculates Freshness Score (0 - 100) based on elapsed time from request creation.
 *
 * Bracket:
 * < 5 min    = 100
 * 5 - 15 min = 80
 * 15 - 30 min= 60
 * 30 - 60 min= 30
 * > 60 min   = 0
 *
 * @param {string|Date|number} createdAt - Creation timestamp or elapsed minutes
 * @param {Date|number} [referenceTime=Date.now()] - Optional reference time for testing
 * @returns {number}
 */
export function calculateFreshnessScore(createdAt, referenceTime = Date.now()) {
  let elapsedMinutes = 0;

  if (typeof createdAt === 'number' && createdAt >= 0 && createdAt < 10000000000) {
    // If directly passed elapsed minutes
    elapsedMinutes = createdAt;
  } else if (createdAt) {
    const createdMs = new Date(createdAt).getTime();
    const refMs = typeof referenceTime === 'number' ? referenceTime : new Date(referenceTime).getTime();
    elapsedMinutes = Math.max(0, (refMs - createdMs) / (1000 * 60));
  }

  if (elapsedMinutes < 5) return 100;
  if (elapsedMinutes <= 15) return 80;
  if (elapsedMinutes <= 30) return 60;
  if (elapsedMinutes <= 60) return 30;
  return 0;
}

/**
 * Calculates Final Priority Score with rule-based weights:
 * Priority Score = 40% Availability + 30% Distance + 20% Urgency + 10% Freshness
 *
 * @param {Object} scores
 * @param {number} scores.availabilityScore
 * @param {number} scores.distanceScore
 * @param {number} scores.urgencyScore
 * @param {number} scores.freshnessScore
 * @returns {number} Rounded to 2 decimal places (0 - 100)
 */
export function calculatePriorityScore({
  availabilityScore = 0,
  distanceScore = 0,
  urgencyScore = 0,
  freshnessScore = 0,
}) {
  const weighted =
    0.4 * availabilityScore +
    0.3 * distanceScore +
    0.2 * urgencyScore +
    0.1 * freshnessScore;

  // Round cleanly to 2 decimal places to avoid IEEE 754 precision issues
  return Math.round(weighted * 100) / 100;
}

/**
 * Priority Score Color Determination per Constraint:
 * - 90+   = Green  (Emerald)
 * - 70-89 = Yellow (Amber)
 * - <70   = Gray   (Slate)
 *
 * @param {number} score
 * @returns {Object} Theme definitions including classes and labels
 */
export function getPriorityColorTheme(score) {
  const rounded = Math.round(score ?? 0);
  if (rounded >= 90) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-600',
      badgeText: 'text-white',
      ring: 'ring-emerald-500',
      bar: 'bg-emerald-500',
      label: 'Optimal Match'
    };
  }
  if (rounded >= 70) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      badgeBg: 'bg-amber-500',
      badgeText: 'text-white',
      ring: 'ring-amber-400',
      bar: 'bg-amber-500',
      label: 'Good Match'
    };
  }
  return {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    badgeBg: 'bg-slate-500',
    badgeText: 'text-white',
    ring: 'ring-slate-400',
    bar: 'bg-slate-400',
    label: 'Standard Match'
  };
}

/**
 * Urgency badge color mapping per DESIGN.md:
 * - CRITICAL = Red
 * - HIGH     = Amber
 * - NORMAL   = Gray
 *
 * @param {string} urgency
 * @returns {string} Tailwind CSS classes
 */
export function getUrgencyBadgeClasses(urgency) {
  const norm = String(urgency || '').trim().toUpperCase();
  if (norm === 'CRITICAL') {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (norm === 'HIGH') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

