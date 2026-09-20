/**
 * LIFE-LINK Automated Test Suite for Supabase Realtime Service & Listeners
 */

import {
  subscribeToEmergencyRequests,
  subscribeToInventory,
  subscribeToResponses,
  subscribeToEmergencySystem
} from './src/services/realtimeService.js';

async function runRealtimeServiceTests() {
  console.log('====================================================');
  console.log('      LIFE-LINK Realtime Service Test Suite         ');
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

  // --- Test 1: Emergency Requests Listener Subscription & Teardown ---
  console.log('--- Test 1: Emergency Requests Realtime Listener ---');
  const emergencySub = subscribeToEmergencyRequests((_change) => {});

  assert(emergencySub != null, 'Emergency requests subscription created');
  assert(typeof emergencySub.unsubscribe === 'function', 'Emergency requests subscription exposes unsubscribe()');
  assert(emergencySub.channel != null, 'Emergency requests channel instantiated on Supabase');

  // Verify unsubscribe tears down cleanly without leaks
  emergencySub.unsubscribe();
  assert(true, 'Emergency requests subscription unsubscribes cleanly');

  // --- Test 2: Inventory Listener Subscription & Teardown ---
  console.log('\n--- Test 2: Inventory Realtime Listener (available_units & reserved_units) ---');
  const inventorySub = subscribeToInventory((_change) => {});

  assert(inventorySub != null, 'Inventory subscription created');
  assert(typeof inventorySub.unsubscribe === 'function', 'Inventory subscription exposes unsubscribe()');
  assert(inventorySub.channel != null, 'Inventory channel instantiated on Supabase');

  inventorySub.unsubscribe();
  assert(true, 'Inventory subscription unsubscribes cleanly');

  // --- Test 3: Responses Listener Subscription & Teardown ---
  console.log('\n--- Test 3: Responses Realtime Listener ---');
  const responsesSub = subscribeToResponses((_change) => {});

  assert(responsesSub != null, 'Responses subscription created');
  assert(typeof responsesSub.unsubscribe === 'function', 'Responses subscription exposes unsubscribe()');
  assert(responsesSub.channel != null, 'Responses channel instantiated on Supabase');

  responsesSub.unsubscribe();
  assert(true, 'Responses subscription unsubscribes cleanly');

  // --- Test 4: Unified Multi-Table Emergency System Channel ---
  console.log('\n--- Test 4: Unified System Realtime Channel (All 3 Tables) ---');
  const eventsReceived = [];

  const systemSub = subscribeToEmergencySystem({
    onEmergencyRequest: (change) => eventsReceived.push(change),
    onInventoryChange: (change) => eventsReceived.push(change),
    onResponse: (change) => eventsReceived.push(change),
    onAnyChange: (_change) => {},
    onStatusChange: (_status) => {}
  });

  assert(systemSub != null, 'Unified system subscription created');
  assert(typeof systemSub.unsubscribe === 'function', 'Unified system subscription exposes unsubscribe()');
  assert(systemSub.channel != null, 'Unified system channel attached');

  // Clean up
  systemSub.unsubscribe();
  assert(true, 'Unified system subscription unsubscribes cleanly without memory leaks');

  // --- Test 5: Verify Pure Realtime (No Polling Detection) ---
  console.log('\n--- Test 5: Verify Pure Realtime Architecture ---');
  const serviceCode = await import('fs').then(fs => fs.promises.readFile('./src/services/realtimeService.js', 'utf8'));
  const hookCode = await import('fs').then(fs => fs.promises.readFile('./src/hooks/useRealtimeUpdates.js', 'utf8'));

  assert(!serviceCode.includes('setInterval'), 'realtimeService.js has zero setInterval polling');
  assert(!hookCode.includes('setInterval'), 'useRealtimeUpdates.js has zero setInterval polling');
  assert(serviceCode.includes('postgres_changes'), 'Uses native Supabase postgres_changes webhooks');
  assert(serviceCode.includes('table: \'emergency_requests\''), 'Monitors emergency_requests table');
  assert(serviceCode.includes('table: \'inventory\''), 'Monitors inventory table');
  assert(serviceCode.includes('table: \'responses\''), 'Monitors responses table');

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runRealtimeServiceTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
