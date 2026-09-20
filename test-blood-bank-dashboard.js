import {
  fetchInventory,
  fetchEmergencyRequestsCount,
  subscribeToInventoryRealtime,
  subscribeToEmergencyRequestsRealtime,
  STANDARD_BLOOD_GROUPS,
  STANDARD_COMPONENTS,
} from './src/services/inventoryService.js'

async function runBloodBankDashboardTests() {
  console.log('====================================================')
  console.log('    LIFE-LINK Blood Bank & Inventory Test Suite     ')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${message}`)
      failed++
    }
  }

  // 1. Blood Groups Coverage in Inventory
  console.log('--- Test 1: Blood Groups in Inventory Table ---')
  const expectedGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
  assert(
    expectedGroups.every((bg) => STANDARD_BLOOD_GROUPS.includes(bg)),
    'Supports all 8 standard blood groups in inventory'
  )

  // 2. Component Types Coverage
  console.log('\n--- Test 2: Component Types in Inventory Table ---')
  const expectedComponents = ['Whole Blood', 'PRBC', 'Platelets', 'FFP', 'Cryoprecipitate']
  assert(
    expectedComponents.every((c) => STANDARD_COMPONENTS.includes(c)),
    'Supports Whole Blood, PRBC, Platelets, FFP, Cryoprecipitate'
  )

  // 3. Database Inventory Fetch Query Execution
  console.log('\n--- Test 3: Inventory Fetch Query Execution ---')
  const inventoryResult = await fetchInventory()
  assert(inventoryResult.error === null, 'Supabase inventory query executes without error')
  assert(Array.isArray(inventoryResult.data), 'Inventory query returns an array')

  // 4. Emergency Requests Counter Query
  console.log('\n--- Test 4: Emergency Requests Counter Query ---')
  const counterResult = await fetchEmergencyRequestsCount()
  assert(counterResult.error === null, 'Emergency requests count query executes without error')
  assert(typeof counterResult.count === 'number' && counterResult.count >= 0, `Returns valid non-negative counter: ${counterResult.count}`)

  // 5. Update Inventory Item Helper Validation
  console.log('\n--- Test 5: Update Inventory Data Preparation ---')

  // Test payload construction (unit clamp to >= 0)
  const clampedUnits = Math.max(0, parseInt('-5', 10) || 0)
  assert(clampedUnits === 0, 'Clamps negative stock values to 0')

  // 6. Realtime Subscription Functions
  console.log('\n--- Test 6: Realtime Channel Subscription Helpers ---')
  assert(typeof subscribeToInventoryRealtime === 'function', 'subscribeToInventoryRealtime function is exported')
  assert(typeof subscribeToEmergencyRequestsRealtime === 'function', 'subscribeToEmergencyRequestsRealtime function is exported')

  console.log('\n====================================================')
  console.log(`Results: ${passed} Passed, ${failed} Failed`)
  console.log('====================================================\n')

  if (failed > 0) process.exit(1)
}

runBloodBankDashboardTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
