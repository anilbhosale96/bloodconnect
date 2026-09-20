/**
 * LIFE-LINK Automated Test Suite for Donor Dashboard & Proximity Response
 */

import {
  isBloodCompatible,
  filterNearbyRequestsForDonor,
  respondAsDonor
} from './src/services/donorService.js';

async function runDonorDashboardTests() {
  console.log('====================================================');
  console.log('      LIFE-LINK Donor Dashboard Test Suite          ');
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

  // --- Test 1: Blood Group Compatibility / Matching ---
  console.log('--- Test 1: Blood Group Filter for O+ Donor ---');
  assert(isBloodCompatible('O+', 'O+', true) === true, 'O+ donor matches O+ request');
  assert(isBloodCompatible('O+', 'A+', true) === false, 'O+ donor excludes A+ request under matching constraint');
  assert(isBloodCompatible('O+', 'B+', true) === false, 'O+ donor excludes B+ request');
  assert(isBloodCompatible('O+', 'AB+', true) === false, 'O+ donor excludes AB+ request');

  // --- Test 2: Filter Nearby Requests (<= 20km & matching group) ---
  console.log('\n--- Test 2: 20km Radius & Blood Group Filter ---');
  const mockDonor = {
    id: 'donor-101',
    name: 'Priya Sharma',
    blood_group: 'O+',
    latitude: 18.5204,
    longitude: 73.8567, // Pune Center
    is_available: true
  };

  const testRequests = [
    {
      id: 'r1',
      hospital_name: 'Near Central Hospital',
      blood_group: 'O+',
      component_type: 'Whole Blood',
      urgency: 'CRITICAL',
      latitude: 18.5300,
      longitude: 73.8600 // ~1.12 km <= 20km -> MATCH
    },
    {
      id: 'r2',
      hospital_name: 'Suburban Trauma Unit',
      blood_group: 'O+',
      component_type: 'PRBC',
      urgency: 'HIGH',
      latitude: 18.5800,
      longitude: 73.9200 // ~9.4 km <= 20km -> MATCH
    },
    {
      id: 'r3',
      hospital_name: 'Far Rural Center',
      blood_group: 'O+',
      component_type: 'Whole Blood',
      urgency: 'CRITICAL',
      latitude: 18.8500,
      longitude: 74.2000 // ~50 km > 20km -> EXCLUDE!
    },
    {
      id: 'r4',
      hospital_name: 'Near City Hospital (Wrong Blood Group)',
      blood_group: 'A+', // A+ -> EXCLUDE!
      component_type: 'Whole Blood',
      urgency: 'CRITICAL',
      latitude: 18.5250,
      longitude: 73.8580 // 0.5 km
    },
    {
      id: 'r5',
      hospital_name: 'Outer Limits Clinic',
      blood_group: 'B+', // B+ -> EXCLUDE!
      component_type: 'Platelets',
      urgency: 'NORMAL',
      latitude: 18.5204,
      longitude: 73.8567
    }
  ];

  const matched = filterNearbyRequestsForDonor(testRequests, mockDonor, { maxRadiusKm: 20, exactOnly: true });

  assert(matched.length === 2, `Filters return exactly 2 nearby O+ requests (got ${matched.length})`);
  assert(matched.every(r => r.blood_group === 'O+'), 'All matched requests strictly have O+ blood group');
  assert(matched.every(r => r.distance_km <= 20), 'All matched requests are within 20km');
  assert(!matched.some(r => r.id === 'r3'), 'Rural request > 20km was excluded');
  assert(!matched.some(r => r.id === 'r4'), 'Nearby A+ request was excluded for O+ donor');

  // Verify Required Card Fields
  matched.forEach((r, idx) => {
    assert(r.urgency != null, `Match #${idx + 1} has urgency: ${r.urgency}`);
    assert(r.component_type != null, `Match #${idx + 1} has component: ${r.component_type}`);
    assert(r.distance_km != null, `Match #${idx + 1} has distance: ${r.distance_km} km`);
    assert(r.hospital_name != null, `Match #${idx + 1} has hospital name: ${r.hospital_name}`);
  });

  // --- Test 3: Availability Toggle Logic ---
  console.log('\n--- Test 3: Donor Availability Toggle ---');
  let donorAvailable = true;
  donorAvailable = !donorAvailable;
  assert(donorAvailable === false, 'Availability toggles from true to false (Unavailable / Off-Duty)');
  donorAvailable = !donorAvailable;
  assert(donorAvailable === true, 'Availability toggles back from false to true (Available)');

  // --- Test 4: Donor Response Workflow ---
  console.log('\n--- Test 4: Donor Response Workflow (responses table) ---');
  const responseResult = await respondAsDonor({
    requestId: '00000000-0000-0000-0000-000000000001',
    hospitalId: '00000000-0000-0000-0000-000000000002',
    donorId: mockDonor.id,
    donorName: mockDonor.name,
    donorBloodGroup: mockDonor.blood_group,
    notes: 'Volunteered for immediate donation'
  });

  assert(responseResult.success === true, 'respondAsDonor executes successfully');
  assert(responseResult.data?.units_offered === 1, 'Donor pledges 1 unit donation in response payload');
  assert(responseResult.data?.responder_id === mockDonor.id, 'Response payload has correct donor responder_id');

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  console.log('--- Sample Filtered Nearby Requests for O+ Donor ---');
  console.table(matched.map((r, i) => ({
    Rank: `#${i + 1}`,
    Hospital: r.hospital_name,
    Group: r.blood_group,
    Component: r.component_type,
    Urgency: r.urgency,
    'Distance (km)': r.distance_km
  })));

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runDonorDashboardTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

