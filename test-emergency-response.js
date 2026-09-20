import {
  calculateHaversineDistance,
  respondToEmergencyRequest,
} from './src/services/responseService.js'

async function runResponseWorkflowTests() {
  console.log('====================================================')
  console.log('   LIFE-LINK Emergency Response Workflow Tests      ')
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

  // 1. Distance Calculation (Haversine Formula)
  console.log('--- Test 1: Haversine Distance Calculation ---')
  const distSame = calculateHaversineDistance(18.5204, 73.8567, 18.5204, 73.8567)
  assert(distSame === 0, 'Distance between identical coordinates is 0 km')

  const distPuneMumbai = calculateHaversineDistance(18.5204, 73.8567, 18.5500, 73.8800)
  assert(distPuneMumbai > 0 && distPuneMumbai < 10, `Calculates proximity distance: ${distPuneMumbai} km`)

  // 2. Accept Workflow Logic
  console.log('\n--- Test 2: Full Acceptance Workflow ---')
  const dummyRequestId = '00000000-0000-0000-0000-000000000001'
  const dummyHospitalId = '00000000-0000-0000-0000-000000000002'

  const acceptResult = await respondToEmergencyRequest({
    requestId: dummyRequestId,
    hospitalId: dummyHospitalId,
    responderId: '00000000-0000-0000-0000-000000000003',
    action: 'ACCEPT',
    unitsOffered: 4,
    bloodGroup: 'O+',
    componentType: 'Whole Blood',
  })

  assert(acceptResult.data !== null, 'Accept response executed through service')
  assert(acceptResult.data?.status === 'NOTIFIED', 'Updates request status to NOTIFIED')
  assert(acceptResult.data?.unitsOffered === 4, 'Full 4 units recorded as offered')

  // 3. Partial Offer Workflow Logic
  console.log('\n--- Test 3: Partial Offer Workflow ---')
  const partialResult = await respondToEmergencyRequest({
    requestId: dummyRequestId,
    hospitalId: dummyHospitalId,
    responderId: '00000000-0000-0000-0000-000000000003',
    action: 'PARTIAL',
    unitsOffered: 2,
    bloodGroup: 'O+',
    componentType: 'Whole Blood',
  })

  assert(partialResult.data !== null, 'Partial offer executed through service')
  assert(partialResult.data?.unitsOffered === 2, 'Partial 2 units recorded as offered')
  assert(partialResult.data?.status === 'NOTIFIED', 'Sets status to NOTIFIED on partial offer')

  // 4. Decline Workflow Logic
  console.log('\n--- Test 4: Decline Workflow ---')
  const declineResult = await respondToEmergencyRequest({
    requestId: dummyRequestId,
    hospitalId: dummyHospitalId,
    responderId: '00000000-0000-0000-0000-000000000003',
    action: 'DECLINE',
    unitsOffered: 0,
    notes: 'Out of stock in blood bank',
    bloodGroup: 'O+',
    componentType: 'Whole Blood',
  })

  assert(declineResult.data !== null, 'Decline executed through service')
  assert(declineResult.data?.unitsOffered === 0, 'Declined response records 0 units offered')

  console.log('\n====================================================')
  console.log(`Results: ${passed} Passed, ${failed} Failed`)
  console.log('====================================================\n')

  if (failed > 0) process.exit(1)
}

runResponseWorkflowTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})

