/**
 * LIFE-LINK Automated Test Suite for Matching Results & MatchCard Component Logic
 */

import {
  getPriorityColorTheme,
  getUrgencyBadgeClasses
} from './src/lib/calculations.js';
import { filterAndScoreCandidates } from './src/services/matchingService.js';

async function runMatchingResultsTests() {
  console.log('====================================================');
  console.log('      LIFE-LINK Matching Results Tests             ');
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

  // --- Test 1: Priority Score Color Coding per Constraint ---
  // Constraint: Score 90+ = green, 70-89 = yellow, <70 = gray
  console.log('--- Test 1: Priority Score Color Coding ---');
  const theme95 = getPriorityColorTheme(95);
  assert(theme95.badgeBg.includes('emerald'), 'Score 95 gets green (emerald) theme');
  assert(theme95.border.includes('emerald'), 'Score 95 border is emerald');

  const theme90 = getPriorityColorTheme(90);
  assert(theme90.badgeBg.includes('emerald'), 'Boundary Score 90 gets green (emerald) theme');

  const theme89 = getPriorityColorTheme(89);
  assert(theme89.badgeBg.includes('amber'), 'Boundary Score 89 gets yellow (amber) theme');

  const theme70 = getPriorityColorTheme(70);
  assert(theme70.badgeBg.includes('amber'), 'Boundary Score 70 gets yellow (amber) theme');

  const theme69 = getPriorityColorTheme(69);
  assert(theme69.badgeBg.includes('slate'), 'Boundary Score 69 gets gray (slate) theme');

  const theme0 = getPriorityColorTheme(0);
  assert(theme0.badgeBg.includes('slate'), 'Score 0 gets gray (slate) theme');

  // --- Test 2: Urgency Badge Colors per DESIGN.md ---
  // CRITICAL = red, HIGH = amber, NORMAL = gray
  console.log('\n--- Test 2: Urgency Badge Colors ---');
  const critClasses = getUrgencyBadgeClasses('CRITICAL');
  assert(critClasses.includes('red'), 'Urgency CRITICAL maps to red styling');

  const highClasses = getUrgencyBadgeClasses('HIGH');
  assert(highClasses.includes('amber'), 'Urgency HIGH maps to amber styling');

  const normClasses = getUrgencyBadgeClasses('NORMAL');
  assert(normClasses.includes('slate'), 'Urgency NORMAL maps to neutral gray/slate styling');

  // --- Test 3: Top 5 Sorted Match Presentation ---
  console.log('\n--- Test 3: Top 5 Resource Sorting & Ranking ---');
  const mockRequest = {
    id: 'req-002',
    blood_group: 'B+',
    component_type: 'PRBC',
    count: 3,
    urgency: 'CRITICAL',
    latitude: 18.5204,
    longitude: 73.8567,
    created_at: new Date().toISOString()
  };

  const candidateBanks = [
    { id: 'b1', name: 'Bank Far', blood_group: 'B+', component_type: 'PRBC', available_units: 5, latitude: 18.65, longitude: 73.95 },
    { id: 'b2', name: 'Bank Very Close', blood_group: 'B+', component_type: 'PRBC', available_units: 6, latitude: 18.525, longitude: 73.86 },
    { id: 'b3', name: 'Bank Mid Distance', blood_group: 'B+', component_type: 'PRBC', available_units: 4, latitude: 18.55, longitude: 73.89 },
    { id: 'b4', name: 'Bank Mid Close', blood_group: 'B+', component_type: 'PRBC', available_units: 3, latitude: 18.54, longitude: 73.87 },
    { id: 'b5', name: 'Bank Near 2', blood_group: 'B+', component_type: 'PRBC', available_units: 10, latitude: 18.53, longitude: 73.865 },
    { id: 'b6', name: 'Bank Peripheral', blood_group: 'B+', component_type: 'PRBC', available_units: 2, latitude: 18.62, longitude: 73.92 },
    { id: 'b7', name: 'Bank Outer Limit', blood_group: 'B+', component_type: 'PRBC', available_units: 8, latitude: 18.68, longitude: 73.98 }
  ];

  const scored = filterAndScoreCandidates(candidateBanks, mockRequest);
  const top5 = scored.slice(0, 5);

  assert(scored.length === 7, `Found exactly 7 potential resources: ${scored.length}`);
  assert(top5.length === 5, `Top 5 matches selected: ${top5.length}`);

  // Ensure descending score order
  for (let i = 0; i < top5.length - 1; i++) {
    assert(
      top5[i].priority_score >= top5[i + 1].priority_score,
      `Rank #${i + 1} score (${top5[i].priority_score}) >= Rank #${i + 2} (${top5[i + 1].priority_score})`
    );
  }

  // Ensure each card has required properties
  top5.forEach((m, idx) => {
    assert(m.resource_name != null, `Match #${idx + 1} has resource name: ${m.resource_name}`);
    assert(m.distance_km != null, `Match #${idx + 1} has distance: ${m.distance_km} km`);
    assert(m.available_units != null, `Match #${idx + 1} has available units: ${m.available_units}`);
    assert(m.priority_score >= 0 && m.priority_score <= 100, `Match #${idx + 1} has valid priority score: ${m.priority_score}`);
  });

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMatchingResultsTests().catch(console.error);
