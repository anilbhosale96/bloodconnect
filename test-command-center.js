/**
 * Test Suite for Emergency Command Center (Judges Demo Screen)
 * Validates:
 * - Active requests retrieval & real-time readiness
 * - Urgency color badge rules (Red = CRITICAL, Amber = HIGH, Green = NORMAL)
 * - Match counts & Response counts
 * - Fulfillment percentage calculation accuracy
 * - Simulation engine for judges demo
 */

import {
  fetchCommandCenterRequests,
  getUrgencyBadgeConfig,
  calculateFulfillmentPercentage,
  simulateJudgeDemoEmergency
} from './src/services/commandCenterService.js';

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

async function runTests() {
  console.log('====================================================');
  console.log('  LIFE-LINK Emergency Command Center Test Suite     ');
  console.log('====================================================\n');

  console.log('--- Test 1: Urgency Color Badge Rule Compliance ---');
  const criticalBadge = getUrgencyBadgeConfig('CRITICAL');
  assert(criticalBadge.badgeBg.includes('bg-red-600'), 'CRITICAL urgency uses RED badge (bg-red-600)');
  assert(criticalBadge.pulse === true, 'CRITICAL urgency triggers live pulsing radar beacon');

  const highBadge = getUrgencyBadgeConfig('HIGH');
  assert(highBadge.badgeBg.includes('bg-amber-500'), 'HIGH urgency uses AMBER badge (bg-amber-500)');

  const normalBadge = getUrgencyBadgeConfig('NORMAL');
  assert(normalBadge.badgeBg.includes('bg-emerald-600'), 'NORMAL urgency uses GREEN badge (bg-emerald-600)');

  console.log('\n--- Test 2: Progress Bar % Fulfilled Calculations ---');
  assert(calculateFulfillmentPercentage(3, 0) === 0, '0 units of 3 = 0%');
  assert(calculateFulfillmentPercentage(3, 2) === 67, '2 units of 3 = 67%');
  assert(calculateFulfillmentPercentage(2, 2) === 100, '2 units of 2 = 100%');
  assert(calculateFulfillmentPercentage(2, 5) === 100, '5 units of 2 = 100% (capped at 100%)');
  assert(calculateFulfillmentPercentage(0, 0) === 0, 'Handles 0 required gracefully');

  console.log('\n--- Test 3: Active Requests Feed & Match/Response Counts ---');
  const requests = await fetchCommandCenterRequests();
  assert(Array.isArray(requests) && requests.length > 0, `Loaded ${requests.length} active emergency requests`);

  const sampleReq = requests[0];
  assert(Boolean(sampleReq.hospital_name), `Hospital name present: ${sampleReq.hospital_name}`);
  assert(Boolean(sampleReq.blood_group), `Blood group present: ${sampleReq.blood_group}`);
  assert(typeof sampleReq.match_count === 'number', `Match count present: ${sampleReq.match_count} matches`);
  assert(typeof sampleReq.response_count === 'number', `Response count present: ${sampleReq.response_count} responses`);
  assert(typeof sampleReq.percent_fulfilled === 'number', `Fulfillment % present: ${sampleReq.percent_fulfilled}%`);
  assert(['CRITICAL', 'HIGH', 'NORMAL'].includes(sampleReq.urgency), `Valid urgency category: ${sampleReq.urgency}`);

  console.log('\n--- Test 4: Judges Demo Emergency Simulation Engine ---');
  const simulated = await simulateJudgeDemoEmergency();
  assert(Boolean(simulated.id), `Simulated emergency created with ID: ${simulated.id}`);
  assert(Boolean(simulated.hospital_name), `Target Hospital assigned: ${simulated.hospital_name}`);
  assert(simulated.match_count > 0, `Immediate matching algorithm triggered (${simulated.match_count} matches)`);
  assert(simulated.urgency === 'CRITICAL', 'Simulated emergency defaults to CRITICAL priority');

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

