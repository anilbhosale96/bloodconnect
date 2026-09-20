
async function runHospitalDashboardTests() {
  console.log('====================================================')
  console.log('     LIFE-LINK Hospital Dashboard & RBAC Tests      ')
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

  // 1. Access Control Logic for Hospital Dashboard
  console.log('--- Test 1: Hospital Route Access-Control Logic ---')
  const allowedRoles = ['hospital', 'admin']

  function checkHospitalAccess(userRole) {
    if (!userRole) return false
    return allowedRoles.includes(userRole)
  }

  assert(checkHospitalAccess('hospital') === true, 'Hospital role granted access to /hospital')
  assert(checkHospitalAccess('admin') === true, 'Admin role granted access to /hospital')
  assert(checkHospitalAccess('blood_bank') === false, 'Blood bank role denied access to /hospital')
  assert(checkHospitalAccess('donor') === false, 'Donor role denied access to /hospital')
  assert(checkHospitalAccess(null) === false, 'Unauthenticated user denied access')

  // 2. Emergency Request Payload Structure
  console.log('\n--- Test 2: Emergency Request Payload Validation ---')
  const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const validUrgencies = ['CRITICAL', 'HIGH', 'MEDIUM']

  function validateEmergencyRequest(req) {
    if (!validBloodGroups.includes(req.blood_group)) return 'Invalid blood group'
    if (!req.component_type) return 'Missing component type'
    if (!req.count || req.count <= 0) return 'Invalid unit count'
    if (!validUrgencies.includes(req.urgency)) return 'Invalid urgency level'
    return null
  }

  const sampleValidRequest = {
    blood_group: 'O+',
    component_type: 'Whole Blood',
    count: 2,
    urgency: 'CRITICAL',
    status: 'PENDING',
    deadline: new Date(Date.now() + 3600000).toISOString()
  }
  assert(validateEmergencyRequest(sampleValidRequest) === null, 'Valid emergency request passes validation')

  const invalidCountRequest = { ...sampleValidRequest, count: 0 }
  assert(validateEmergencyRequest(invalidCountRequest) === 'Invalid unit count', 'Rejects request with 0 count')

  const invalidGroupRequest = { ...sampleValidRequest, blood_group: 'X+' }
  assert(validateEmergencyRequest(invalidGroupRequest) === 'Invalid blood group', 'Rejects unapproved blood group')

  // 3. Regional Blood Availability Aggregation Logic
  console.log('\n--- Test 3: Regional Availability Aggregator ---')
  const mockInventory = [
    { blood_group: 'A+', available_units: 5 },
    { blood_group: 'A+', count: 2 },
    { blood_group: 'O-', available_units: 1 },
    { blood_group: 'B+', available_units: 8 }
  ]

  function aggregateInventory(items) {
    const counts = {}
    validBloodGroups.forEach(bg => { counts[bg] = 0 })
    items.forEach(item => {
      const units = item.available_units ?? item.count ?? 0
      if (counts[item.blood_group] !== undefined) {
        counts[item.blood_group] += units
      }
    })
    return counts
  }

  const aggregated = aggregateInventory(mockInventory)
  assert(aggregated['A+'] === 7, 'Correctly aggregates A+ blood units across records (5+2=7)')
  assert(aggregated['O-'] === 1, 'Correctly tracks O- units')
  assert(aggregated['AB+'] === 0, 'Initializes unused blood groups to 0')

  // 4. Notifications Unread Calculation
  console.log('\n--- Test 4: Notifications Status Counter ---')
  const mockNotifications = [
    { id: 1, message: 'Urgent response from Blood Bank A', status: 'UNREAD' },
    { id: 2, message: 'Request #102 fulfilled', status: 'READ' },
    { id: 3, message: 'Dispatch team assigned', status: 'UNREAD' }
  ]
  const unread = mockNotifications.filter(n => n.status === 'UNREAD').length
  assert(unread === 2, 'Accurately computes unread notifications count (2)')

  console.log('\n====================================================')
  console.log(`Results: ${passed} Passed, ${failed} Failed`)
  console.log('====================================================\n')

  if (failed > 0) process.exit(1)
}

runHospitalDashboardTests()

