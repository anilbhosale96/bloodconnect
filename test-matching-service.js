/**
 * LIFE-LINK Automated Test Suite for Matching Engine & Calculations
 */

import {
  calculateHaversineDistance,
  calculateAvailabilityScore,
  calculateDistanceScore,
  calculateUrgencyScore,
  calculateFreshnessScore,
  calculatePriorityScore
} from './src/lib/calculations.js';

import {
  scoreCandidateResource,
  filterAndScoreCandidates
} from './src/services/matchingService.js';

async function runMatchingEngineTests() {
  console.log('====================================================');
  console.log('       LIFE-LINK Matching Engine Test Suite         ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- Test 1: Haversine Distance Formula Accuracy ---
  console.log('--- Test 1: Haversine Distance Formula Accuracy ---');
  const dZero = calculateHaversineDistance(18.5204, 73.8567, 18.5204, 73.8567);
  assert(dZero === 0, 'Haversine distance for identical coordinates is 0 km');

  // Distance between Mumbai (19.0760, 72.8777) and Pune (18.5204, 73.8567) is approx 119 - 120 km
  const distMumbaiPune = calculateHaversineDistance(19.0760, 72.8777, 18.5204, 73.8567);
  assert(distMumbaiPune >= 118 && distMumbaiPune <= 122, `Mumbai to Pune distance accurate: ${distMumbaiPune} km`);

  // Local proximity: 1.5 km apart
  const distNearby = calculateHaversineDistance(18.5204, 73.8567, 18.5300, 73.8650);
  assert(distNearby > 1 && distNearby < 2, `Proximity distance accurate: ${distNearby} km`);

  // Floating point check: ensure no long decimal tails like 1.4399999999999997
  assert(distNearby.toString().split('.')[1]?.length <= 2, 'Distance rounded cleanly with no floating point tail');

  // --- Test 2: Individual Component Scores (0-100 verification) ---
  console.log('\n--- Test 2: Score Components (Range 0 - 100) ---');

  // Availability
  assert(calculateAvailabilityScore(2, 2) === 100, 'Full availability: 2/2 units = 100');
  assert(calculateAvailabilityScore(1, 2) === 50, 'Half availability: 1/2 units = 50');
  assert(calculateAvailabilityScore(4, 2) === 100, 'Excess availability capped at 100: 4/2 units = 100');
  assert(calculateAvailabilityScore(0, 2) === 0, 'Zero availability: 0/2 units = 0');

  // Distance brackets:
  // 0-2km = 100, 2-5km = 80, 5-10km = 60, 10-20km = 30, >20km = 0
  assert(calculateDistanceScore(1.2) === 100, 'Distance 1.2km (0-2km) = 100');
  assert(calculateDistanceScore(3.5) === 80, 'Distance 3.5km (2-5km) = 80');
  assert(calculateDistanceScore(8.0) === 60, 'Distance 8.0km (5-10km) = 60');
  assert(calculateDistanceScore(15.0) === 30, 'Distance 15.0km (10-20km) = 30');
  assert(calculateDistanceScore(25.0) === 0, 'Distance 25.0km (>20km) = 0');

  // Urgency
  assert(calculateUrgencyScore('CRITICAL') === 100, 'Urgency CRITICAL = 100');
  assert(calculateUrgencyScore('HIGH') === 70, 'Urgency HIGH = 70');
  assert(calculateUrgencyScore('NORMAL') === 40, 'Urgency NORMAL = 40');

  // Freshness: <5m = 100, 5-15m = 80, 15-30m = 60, 30-60m = 30, >60m = 0
  assert(calculateFreshnessScore(2) === 100, 'Freshness 2 min elapsed = 100');
  assert(calculateFreshnessScore(10) === 80, 'Freshness 10 min elapsed = 80');
  assert(calculateFreshnessScore(20) === 60, 'Freshness 20 min elapsed = 60');
  assert(calculateFreshnessScore(45) === 30, 'Freshness 45 min elapsed = 30');
  assert(calculateFreshnessScore(90) === 0, 'Freshness 90 min elapsed = 0');

  // --- Test 3: Composite Priority Score Formula & Weights ---
  console.log('\n--- Test 3: Composite Priority Score (40% + 30% + 20% + 10%) ---');
  // Perfect score: 100 availability, 100 distance, 100 urgency, 100 freshness
  const maxScore = calculatePriorityScore({
    availabilityScore: 100,
    distanceScore: 100,
    urgencyScore: 100,
    freshnessScore: 100
  });
  assert(maxScore === 100, `Max score equals 100: ${maxScore}`);

  // Test custom scenario: 50% avail, 80 dist, 70 urgency, 80 freshness
  // 0.4*50 (20) + 0.3*80 (24) + 0.2*70 (14) + 0.1*80 (8) = 20 + 24 + 14 + 8 = 66
  const sampleScore = calculatePriorityScore({
    availabilityScore: 50,
    distanceScore: 80,
    urgencyScore: 70,
    freshnessScore: 80
  });
  assert(sampleScore === 66, `Composite priority calculation matches exact formula: ${sampleScore} (expected 66)`);

  // Floating point check on composite score:
  // e.g. 0.4*33.33 + 0.3*80 + 0.2*70 + 0.1*60 = 13.332 + 24 + 14 + 6 = 57.332 -> 57.33
  const fpScore = calculatePriorityScore({
    availabilityScore: 33.33,
    distanceScore: 80,
    urgencyScore: 70,
    freshnessScore: 60
  });
  assert(fpScore === 57.33, `No floating point precision error: ${fpScore}`);

  // --- Test 4: O+ Request with 2 Units & CRITICAL Urgency ---
  console.log('\n--- Test 4: O+ Request with 2 Units & CRITICAL Urgency ---');
  const emergencyRequest = {
    id: 'req-001',
    blood_group: 'O+',
    component_type: 'Whole Blood',
    count: 2,
    urgency: 'CRITICAL',
    latitude: 18.5204,
    longitude: 73.8567,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
  };

  const sampleBanks = [
    {
      id: 'bank-a',
      name: 'City Central Blood Bank',
      blood_group: 'O+',
      component_type: 'Whole Blood',
      available_units: 4, // 100% avail
      latitude: 18.5300,
      longitude: 73.8600 // ~1.12 km -> 100 dist
    },
    {
      id: 'bank-b',
      name: 'Suburban Red Cross Center',
      blood_group: 'O+',
      component_type: 'Whole Blood',
      available_units: 2, // 100% avail
      latitude: 18.5500,
      longitude: 73.8900 // ~4.8 km -> 80 dist
    },
    {
      id: 'bank-c',
      name: 'Far Metro Blood Bank',
      blood_group: 'O+',
      component_type: 'Whole Blood',
      available_units: 5, // 100% avail
      latitude: 18.6500,
      longitude: 73.9900 // ~20.1 km -> 0 dist
    },
    {
      id: 'bank-wrong-bg',
      name: 'Wrong Blood Group Center',
      blood_group: 'A+', // Should be filtered out!
      component_type: 'Whole Blood',
      available_units: 10,
      latitude: 18.5205,
      longitude: 73.8568
    },
    {
      id: 'bank-zero-stock',
      name: 'Empty Stock Center',
      blood_group: 'O+',
      component_type: 'Whole Blood',
      available_units: 0, // Should be filtered out!
      latitude: 18.5205,
      longitude: 73.8568
    },
    {
      id: 'bank-wrong-component',
      name: 'Platelet Center',
      blood_group: 'O+',
      component_type: 'Platelets', // Wrong component!
      available_units: 5,
      latitude: 18.5205,
      longitude: 73.8568
    }
  ];

  // Test single resource scoring directly
  const singleScored = scoreCandidateResource(sampleBanks[0], emergencyRequest);
  assert(singleScored.priority_score === 100, `Single candidate resource scored correctly: ${singleScored.priority_score}`);

  const results = filterAndScoreCandidates(sampleBanks, emergencyRequest);

  // Verification 1: Filters
  assert(results.length === 3, `Filters excluded wrong group, wrong component, and 0 stock: ${results.length} valid matches`);
  assert(!results.some(r => r.blood_group !== 'O+'), 'Wrong blood group excluded');
  assert(!results.some(r => r.available_units <= 0), 'Zero stock candidate excluded');
  assert(!results.some(r => r.component_type !== 'Whole Blood'), 'Wrong component type excluded');

  // Verification 2: Nearest bank scores highest
  assert(results[0].resource_name === 'City Central Blood Bank', `Nearest bank ranked #1: ${results[0].resource_name}`);
  assert(results[0].priority_score > results[1].priority_score, `Rank #1 score (${results[0].priority_score}) > Rank #2 (${results[1].priority_score})`);
  assert(results[1].priority_score > results[2].priority_score, `Rank #2 score (${results[1].priority_score}) > Rank #3 (${results[2].priority_score})`);

  // Verification 3: Check exact score of #1
  // Bank A: Avail = 100 (4/2 capped), Dist = 100 (~1.12km <= 2km), Urgency = 100 (CRITICAL), Freshness = 100 (<5m)
  // Total = 0.4*100 + 0.3*100 + 0.2*100 + 0.1*100 = 100
  assert(results[0].priority_score === 100, `Rank #1 achieves full 100 priority score in optimal condition: ${results[0].priority_score}`);

  // Bank B: Avail = 100, Dist = 80 (~4.8km in 2-5km), Urgency = 100, Freshness = 100
  // Total = 0.4*100 (40) + 0.3*80 (24) + 0.2*100 (20) + 0.1*100 (10) = 94
  assert(results[1].priority_score === 94, `Rank #2 score matches expected 94: ${results[1].priority_score}`);

  // Bank C: Avail = 100, Dist = 0 (>20km), Urgency = 100, Freshness = 100
  // Total = 40 + 0 + 20 + 10 = 70
  assert(results[2].priority_score === 70, `Rank #3 score matches expected 70: ${results[2].priority_score}`);

  // Verification 4: All scores are in [0, 100]
  const allScoresValid = results.every(r => r.priority_score >= 0 && r.priority_score <= 100);
  assert(allScoresValid, 'All priority scores are strictly within 0 - 100');

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  console.log('--- Example Ranked Results ---');
  console.table(results.map((r, i) => ({
    Rank: `#${i + 1}`,
    'Resource Name': r.resource_name,
    'Distance (km)': r.distance_km,
    'Available Units': r.available_units,
    'Avail Score': r.scores.availability,
    'Dist Score': r.scores.distance,
    'Urg Score': r.scores.urgency,
    'Fresh Score': r.scores.freshness,
    'PRIORITY SCORE': r.priority_score
  })));

  if (failed > 0) {
    process.exit(1);
  }
}

runMatchingEngineTests().catch(console.error);
