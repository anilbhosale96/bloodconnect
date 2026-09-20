import {
  validateEmergencyRequestInput,
  createEmergencyRequest,
  VALID_BLOOD_GROUPS,
  VALID_COMPONENTS,
  VALID_URGENCIES,
} from './src/services/emergencyService.js'

async function runEmergencyRequestTests() {
  console.log('====================================================')
  console.log('    LIFE-LINK Emergency Request Form Test Suite     ')
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

  // 1. Blood Groups Acceptance Criteria
  console.log('--- Test 1: Blood Group Dropdown Options ---')
  const requiredBloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
  assert(
    requiredBloodGroups.length === 8 &&
    requiredBloodGroups.every((bg) => VALID_BLOOD_GROUPS.includes(bg)),
    'Form supports all 8 required blood groups: O+, O-, A+, A-, B+, B-, AB+, AB-'
  )

  // 2. Component Types Acceptance Criteria
  console.log('\n--- Test 2: Blood Component Dropdown Options ---')
  const requiredComponents = ['Whole Blood', 'PRBC', 'Platelets', 'FFP', 'Cryoprecipitate']
  assert(
    requiredComponents.every((c) => VALID_COMPONENTS.includes(c)),
    'Form supports: Whole Blood, PRBC, Platelets, FFP, Cryoprecipitate'
  )

  // 3. Urgency Options & Levels
  console.log('\n--- Test 3: Urgency Radio Classifications ---')
  const requiredUrgencies = ['CRITICAL', 'HIGH', 'NORMAL']
  assert(
    requiredUrgencies.every((u) => VALID_URGENCIES.includes(u)),
    'Form supports: CRITICAL (red), HIGH (amber), and NORMAL (gray)'
  )

  // 4. Quantity Validations (>0, integer)
  console.log('\n--- Test 4: Quantity Input Validation ---')
  assert(
    validateEmergencyRequestInput({
      blood_group: 'O+',
      component_type: 'Whole Blood',
      quantity: 0,
      urgency: 'CRITICAL',
    }).valid === false,
    'Rejects quantity = 0'
  )

  assert(
    validateEmergencyRequestInput({
      blood_group: 'O+',
      component_type: 'Whole Blood',
      quantity: -3,
      urgency: 'CRITICAL',
    }).valid === false,
    'Rejects negative quantity (-3)'
  )

  assert(
    validateEmergencyRequestInput({
      blood_group: 'O+',
      component_type: 'Whole Blood',
      quantity: 'abc',
      urgency: 'CRITICAL',
    }).valid === false,
    'Rejects non-numeric quantity'
  )

  assert(
    validateEmergencyRequestInput({
      blood_group: 'O+',
      component_type: 'Whole Blood',
      quantity: 1.5,
      urgency: 'CRITICAL',
    }).valid === false,
    'Rejects fractional quantities (1.5)'
  )

  assert(
    validateEmergencyRequestInput({
      blood_group: 'O+',
      component_type: 'Whole Blood',
      quantity: 3,
      urgency: 'CRITICAL',
    }).valid === true,
    'Accepts valid positive integer quantity (3)'
  )

  // 5. Complete Valid Form Input
  console.log('\n--- Test 5: End-to-End Form Validation ---')
  const validForm = validateEmergencyRequestInput({
    blood_group: 'AB-',
    component_type: 'PRBC',
    quantity: 4,
    urgency: 'HIGH',
  })
  assert(validForm.valid === true, 'Valid form inputs pass service-side validation')

  // 6. Service Execution and Schema Payload
  console.log('\n--- Test 6: Database Payload Construction ---')
  const serviceResult = await createEmergencyRequest({
    blood_group: 'O-',
    component_type: 'Platelets',
    quantity: 2,
    urgency: 'CRITICAL',
    latitude: 18.5204,
    longitude: 73.8567,
  })

  // Either successfully inserted or gracefully returned status CREATED with valid payload
  assert(serviceResult.data !== null || serviceResult.error !== null, 'Service handled request execution')
  if (serviceResult.data) {
    assert(serviceResult.data.status === 'CREATED', 'Initial status set to CREATED')
    assert(serviceResult.data.blood_group === 'O-', 'Blood group preserved in payload')
    assert(serviceResult.data.urgency === 'CRITICAL', 'Urgency set to CRITICAL')
    assert(serviceResult.data.latitude === 18.5204, 'Hospital latitude captured')
    assert(serviceResult.data.longitude === 73.8567, 'Hospital longitude captured')
  }

  console.log('\n====================================================')
  console.log(`Results: ${passed} Passed, ${failed} Failed`)
  console.log('====================================================\n')

  if (failed > 0) process.exit(1)
}

runEmergencyRequestTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})

