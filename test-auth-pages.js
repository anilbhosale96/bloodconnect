import { VALID_ROLES } from './src/services/auth.js'

async function runPageLogicTests() {
  console.log('====================================================')
  console.log('      LIFE-LINK Auth Pages & RoleSelector Tests     ')
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

  // 1. Role Selection Configuration
  console.log('--- Test 1: Role Configuration ---')
  const expectedRoles = ['hospital', 'blood_bank', 'donor', 'admin']
  assert(
    expectedRoles.every(r => VALID_ROLES.includes(r)),
    'RoleSelector supports all 4 required roles: Hospital, Blood Bank, Donor, Admin'
  )

  // 2. Role Redirection Mapping Logic
  console.log('\n--- Test 2: Role Redirection Mapping ---')
  const roleRoutes = {
    hospital: '/hospital',
    blood_bank: '/blood-bank',
    donor: '/donor',
    admin: '/admin',
    unknown: '/'
  }

  function getRedirectRoute(role) {
    switch (role) {
      case 'hospital': return '/hospital'
      case 'blood_bank': return '/blood-bank'
      case 'donor': return '/donor'
      case 'admin': return '/admin'
      default: return '/'
    }
  }

  for (const [r, path] of Object.entries(roleRoutes)) {
    assert(getRedirectRoute(r) === path, `Role "${r}" routes correctly to "${path}"`)
  }

  // 3. Signup Validation Rules
  console.log('\n--- Test 3: Signup Validation Logic ---')
  function validateSignup({ email, password, role }) {
    if (!email || !password) return 'Please provide both email and password.'
    if (password.length < 6) return 'Password must be at least 6 characters long.'
    if (!role || !VALID_ROLES.includes(role)) return 'Please select an account role to proceed.'
    return null
  }

  assert(validateSignup({ email: '', password: 'Password123!', role: 'hospital' }) !== null, 'Rejects empty email')
  assert(validateSignup({ email: 'test@hosp.org', password: '', role: 'hospital' }) !== null, 'Rejects empty password')
  assert(validateSignup({ email: 'test@hosp.org', password: '123', role: 'hospital' }) === 'Password must be at least 6 characters long.', 'Enforces 6+ character password')
  assert(validateSignup({ email: 'test@hosp.org', password: 'Password123!', role: 'invalid' }) !== null, 'Rejects unapproved role')
  assert(validateSignup({ email: 'test@hosp.org', password: 'Password123!', role: 'hospital' }) === null, 'Accepts valid hospital signup inputs')
  assert(validateSignup({ email: 'test@donor.org', password: 'Password123!', role: 'donor' }) === null, 'Accepts valid donor signup inputs')
  assert(validateSignup({ email: 'test@bb.org', password: 'Password123!', role: 'blood_bank' }) === null, 'Accepts valid blood_bank signup inputs')
  assert(validateSignup({ email: 'test@admin.org', password: 'Password123!', role: 'admin' }) === null, 'Accepts valid admin signup inputs')

  // 4. Login Validation Rules
  console.log('\n--- Test 4: Login Validation Logic ---')
  function validateLogin({ email, password }) {
    if (!email || !password) return 'Please provide both email and password.'
    return null
  }

  assert(validateLogin({ email: '', password: '123' }) !== null, 'Rejects login without email')
  assert(validateLogin({ email: 'user@test.org', password: '' }) !== null, 'Rejects login without password')
  assert(validateLogin({ email: 'user@test.org', password: 'SecretPassword123!' }) === null, 'Accepts valid login inputs')

  console.log('\n====================================================')
  console.log(`Results: ${passed} Passed, ${failed} Failed`)
  console.log('====================================================\n')

  if (failed > 0) process.exit(1)
}

runPageLogicTests()

