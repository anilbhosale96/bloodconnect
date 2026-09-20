/**
 * Comprehensive Test Suite for LIFE-LINK Seed Data & Presentation Demo Engine
 *
 * Verifies Acceptance Criteria:
 * 1. 5 blood banks in different cities/locations
 * 2. At least 2km apart (Haversine formula validation)
 * 3. 10 donors with all 8 blood groups represented
 * 4. Varying inventory levels (some high, some low)
 * 5. 3 requests with CRITICAL, HIGH, NORMAL urgencies
 * 6. Demo user credentials and login workflow
 * 7. Matching engine finds matches for requests
 */

import {
  SEED_BLOOD_BANKS,
  SEED_INVENTORY,
  SEED_DONORS,
  SEED_EMERGENCY_REQUESTS,
  DEMO_USERS,
  seedDemoData,
  getSeedData
} from './src/lib/seedData.js';
import { calculateHaversineDistance } from './src/lib/calculations.js';
import { signIn } from './src/services/auth.js';
import { findMatchesForRequest } from './src/services/matchingService.js';
import { fetchAccountsForVerification, fetchAdminMetrics } from './src/services/adminService.js';
import { fetchDonorCompatibleRequests } from './src/services/donorService.js';

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

async function runSeedDataTests() {
  console.log('====================================================');
  console.log('    LIFE-LINK Demo Seed Data & Auth Test Suite     ');
  console.log('====================================================\n');

  // --- Test 1: 5 Blood Banks in Different Cities/Locations ---
  console.log('--- Test 1: Blood Banks Count & Coordinate Integrity ---');
  assert(SEED_BLOOD_BANKS.length === 5, `Configured exactly 5 blood banks (found ${SEED_BLOOD_BANKS.length})`);

  const uniqueCities = new Set(SEED_BLOOD_BANKS.map((b) => b.city));
  assert(uniqueCities.size >= 4, `Located across diverse metropolitan sectors/cities: ${[...uniqueCities].join('; ')}`);

  SEED_BLOOD_BANKS.forEach((b) => {
    assert(
      typeof b.latitude === 'number' &&
      typeof b.longitude === 'number' &&
      b.name &&
      b.phone,
      `Bank "${b.name}" has valid coordinates (${b.latitude}, ${b.longitude}) and phone`
    );
  });

  // --- Test 2: Distance Constraint: At Least 2km Apart ---
  console.log('\n--- Test 2: Blood Banks Distance Separation (>= 2km) ---');
  let allDistancesAbove2Km = true;
  const distancePairs = [];

  for (let i = 0; i < SEED_BLOOD_BANKS.length; i++) {
    for (let j = i + 1; j < SEED_BLOOD_BANKS.length; j++) {
      const b1 = SEED_BLOOD_BANKS[i];
      const b2 = SEED_BLOOD_BANKS[j];
      const dist = calculateHaversineDistance(b1.latitude, b1.longitude, b2.latitude, b2.longitude);
      distancePairs.push({ pair: `${b1.name.slice(0, 15)}... <-> ${b2.name.slice(0, 15)}...`, dist });
      if (dist < 2.0) {
        allDistancesAbove2Km = false;
        console.error(`Distance between ${b1.name} and ${b2.name} is ${dist} km (< 2km)`);
      }
    }
  }

  assert(allDistancesAbove2Km, `All 10 blood bank pairs are separated by >= 2.0 km (min: ${Math.min(...distancePairs.map(p => p.dist)).toFixed(2)} km)`);
  console.log('Sample distances between facilities:');
  distancePairs.slice(0, 4).forEach((p) => console.log(`   * ${p.pair}: ${p.dist} km`));

  // --- Test 3: 10 Donors With All 8 Blood Groups Represented ---
  console.log('\n--- Test 3: Donors Count & Blood Group Diversity ---');
  assert(SEED_DONORS.length === 10, `Configured exactly 10 voluntary donors (found ${SEED_DONORS.length})`);

  const requiredBloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const donorBloodGroups = new Set(SEED_DONORS.map((d) => d.blood_group));
  const allGroupsPresent = requiredBloodGroups.every((bg) => donorBloodGroups.has(bg));

  assert(allGroupsPresent, `All 8 required blood groups represented in donors (${[...donorBloodGroups].join(', ')})`);

  const universalDonor = SEED_DONORS.find((d) => d.blood_group === 'O-');
  assert(universalDonor != null, `Universal donor (O-) present: ${universalDonor?.name}`);

  // --- Test 4: Varied Inventory Levels (Some High, Some Low) ---
  console.log('\n--- Test 4: Inventory Variation & Component Distribution ---');
  assert(SEED_INVENTORY.length >= 20, `Seeded comprehensive inventory (${SEED_INVENTORY.length} items across 5 facilities)`);

  const units = SEED_INVENTORY.map((item) => item.available_units);
  const highStock = SEED_INVENTORY.filter((item) => item.available_units >= 15);
  const lowStock = SEED_INVENTORY.filter((item) => item.available_units <= 2);

  assert(highStock.length >= 3, `High inventory units available (>=15 units): ${highStock.length} items (e.g. ${highStock[0].blood_group} ${highStock[0].component_type} = ${highStock[0].available_units} units)`);
  assert(lowStock.length >= 3, `Low/critical inventory units represented (<=2 units): ${lowStock.length} items (e.g. ${lowStock[0].blood_group} ${lowStock[0].component_type} = ${lowStock[0].available_units} units)`);
  assert(Math.max(...units) > 20 && Math.min(...units) <= 1, `Inventory spans wide realistic range from ${Math.min(...units)} to ${Math.max(...units)} units`);

  // --- Test 5: 3 Emergency Requests with CRITICAL, HIGH, NORMAL ---
  console.log('\n--- Test 5: Emergency Requests Urgency Spectrum ---');
  assert(SEED_EMERGENCY_REQUESTS.length === 3, `Configured exactly 3 emergency requests (found ${SEED_EMERGENCY_REQUESTS.length})`);

  const urgencies = SEED_EMERGENCY_REQUESTS.map((r) => r.urgency);
  assert(urgencies.includes('CRITICAL'), 'Includes CRITICAL urgency request (Immediate < 45 min deadline)');
  assert(urgencies.includes('HIGH'), 'Includes HIGH urgency request (Within 2 hours)');
  assert(urgencies.includes('NORMAL'), 'Includes NORMAL urgency request (Within 6 hours)');

  const criticalReq = SEED_EMERGENCY_REQUESTS.find((r) => r.urgency === 'CRITICAL');
  assert(criticalReq.blood_group === 'O-' && criticalReq.component_type === 'Platelets', `Critical request requires ${criticalReq.blood_group} ${criticalReq.component_type} at ${criticalReq.hospital_name}`);

  // --- Test 6: Demo User Accounts & Seamless Login Workflow ---
  console.log('\n--- Test 6: Demo User Credentials & Authentication ---');
  assert(DEMO_USERS.length === 4, `Defined credentials for all 4 roles (Hospital, Blood Bank, Donor, Admin)`);

  for (const demo of DEMO_USERS) {
    const loginRes = await signIn({ email: demo.email, password: demo.password });
    assert(loginRes.error === null, `Demo login succeeds for ${demo.role}: ${demo.email}`);
    assert(loginRes.data?.user?.email === demo.email, `User object returned with email ${demo.email}`);
    assert(loginRes.data?.profile?.role === demo.role, `Profile role assigned: ${demo.role}`);
  }

  // --- Test 7: Seed Execution Function ---
  console.log('\n--- Test 7: Seed Function Execution ---');
  const seedResult = await seedDemoData();
  assert(seedResult.success === true, `seedDemoData() returned success: ${seedResult.message}`);

  const activeSeed = getSeedData();
  assert(activeSeed.bloodBanks.length === 5, 'Stored seed data contains 5 blood banks');
  assert(activeSeed.donors.length === 10, 'Stored seed data contains 10 donors');
  assert(activeSeed.emergencyRequests.length === 3, 'Stored seed data contains 3 emergency requests');

  // --- Test 8: Matching Engine Identifies Top Resources ---
  console.log('\n--- Test 8: Matching Engine Against Seeded Data ---');
  const matchResult = await findMatchesForRequest(criticalReq);
  assert(matchResult.success === true, 'Matching engine executed successfully for critical request');
  assert(matchResult.matches.length > 0, `Found ${matchResult.matches.length} matches for O- Platelets emergency`);

  const topMatch = matchResult.matches[0];
  console.log(`Top match: ${topMatch.resource_name} | Distance: ${topMatch.distance_km} km | Priority Score: ${topMatch.priority_score}/100`);
  assert(topMatch.priority_score > 0, `Calculated priority score: ${topMatch.priority_score}`);
  assert(topMatch.available_units > 0, `Top matched facility has ${topMatch.available_units} units available`);

  // --- Test 9: Donor Dashboard Filter Compatibility ---
  console.log('\n--- Test 9: Donor Compatible Requests Filtering ---');
  const oMinusDonor = SEED_DONORS.find((d) => d.blood_group === 'O-');
  const nearbyReqs = await fetchDonorCompatibleRequests(oMinusDonor);
  assert(nearbyReqs.length > 0, `O- Donor matches nearby emergency requests (${nearbyReqs.length} found)`);
  assert(nearbyReqs[0].blood_group === 'O-', `Compatible request blood group matches donor (${nearbyReqs[0].blood_group})`);

  // --- Test 10: Admin Dashboard Accounts and Metrics ---
  console.log('\n--- Test 10: Admin Dashboard Verification & Metrics ---');
  const accounts = await fetchAccountsForVerification();
  assert(accounts.length >= 5, `Admin accounts table loads ${accounts.length} facilities for verification`);
  assert(accounts.some(a => a.type === 'BLOOD_BANK'), 'Includes seeded blood banks');

  const metrics = await fetchAdminMetrics();
  assert(metrics.bloodBanksCount >= 5, `Admin metrics reflect ${metrics.bloodBanksCount} blood banks`);
  assert(metrics.donorsCount >= 10, `Admin metrics reflect ${metrics.donorsCount} voluntary donors`);

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSeedDataTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
