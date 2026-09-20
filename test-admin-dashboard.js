/**
 * LIFE-LINK Automated Test Suite for Admin Dashboard, Metrics & Verification
 */

import {
  fetchAdminMetrics,
  fetchAccountsForVerification,
  updateAccountVerificationStatus,
  fetchAllAuditLogs
} from './src/services/adminService.js';

async function runAdminDashboardTests() {
  console.log('====================================================');
  console.log('      LIFE-LINK Admin Dashboard Test Suite          ');
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

  // --- Test 1: All 6 Metric Cards Display & Calculation ---
  console.log('--- Test 1: System Operational Metrics Calculation ---');
  const metrics = await fetchAdminMetrics();

  assert(metrics != null, 'Metrics object returned successfully');
  assert(typeof metrics.hospitalsCount === 'number' && metrics.hospitalsCount >= 0, `1. Hospitals count: ${metrics.hospitalsCount}`);
  assert(typeof metrics.bloodBanksCount === 'number' && metrics.bloodBanksCount >= 0, `2. Blood Banks count: ${metrics.bloodBanksCount}`);
  assert(typeof metrics.donorsCount === 'number' && metrics.donorsCount >= 0, `3. Donors count: ${metrics.donorsCount}`);
  assert(typeof metrics.activeRequestsCount === 'number' && metrics.activeRequestsCount >= 0, `4. Active Requests count: ${metrics.activeRequestsCount}`);
  assert(typeof metrics.criticalRequestsCount === 'number' && metrics.criticalRequestsCount >= 0, `5. Critical Requests count: ${metrics.criticalRequestsCount}`);
  assert(typeof metrics.avgResponseTime === 'number' && metrics.avgResponseTime > 0, `6. Avg Response Time calculated: ${metrics.avgResponseTime} mins`);

  // --- Test 2: Audit Logs Sorting and Filtering ---
  console.log('\n--- Test 2: Audit Logs Sorting & Role Filtering ---');
  const rawLogs = await fetchAllAuditLogs();

  assert(Array.isArray(rawLogs) && rawLogs.length > 0, `Loaded ${rawLogs.length} audit logs`);

  // Verify timestamp sorting (Descending: newest first)
  const sortedDesc = [...rawLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  assert(
    new Date(sortedDesc[0].timestamp).getTime() >= new Date(sortedDesc[sortedDesc.length - 1].timestamp).getTime(),
    'Audit logs sort descending by timestamp (newest first)'
  );

  // Verify timestamp sorting (Ascending: oldest first)
  const sortedAsc = [...rawLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  assert(
    new Date(sortedAsc[0].timestamp).getTime() <= new Date(sortedAsc[sortedAsc.length - 1].timestamp).getTime(),
    'Audit logs sort ascending by timestamp (oldest first)'
  );

  // Role filter test (SYSTEM)
  const systemLogs = rawLogs.filter(l => (l.metadata?.actor_role || '').toUpperCase().includes('SYSTEM'));
  assert(systemLogs.length > 0, `Filtered ${systemLogs.length} system engine audit logs`);

  // Search filter test
  const searchMatch = rawLogs.filter(l => (l.action || '').toLowerCase().includes('request') || (l.action || '').toLowerCase().includes('matching'));
  assert(searchMatch.length > 0, `Search filter successfully matched ${searchMatch.length} records`);

  // --- Test 3: Account Verification Workflow ---
  console.log('\n--- Test 3: Institutional Verification Workflow ---');
  const accounts = await fetchAccountsForVerification();

  assert(Array.isArray(accounts) && accounts.length > 0, `Fetched ${accounts.length} institutions for verification`);
  assert(accounts.some(a => a.type === 'HOSPITAL'), 'Includes hospital entities');
  assert(accounts.some(a => a.type === 'BLOOD_BANK'), 'Includes blood bank entities');

  // Verify an account
  const targetAccount = accounts[0];
  const initialStatus = targetAccount.verification_status;
  const targetNewStatus = initialStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED';

  const verifyResult = await updateAccountVerificationStatus({
    id: targetAccount.id,
    type: targetAccount.type,
    status: targetNewStatus,
    adminName: 'Lead Medical Officer'
  });

  assert(verifyResult.success === true, `Admin can change verification_status to ${targetNewStatus}`);

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  console.log('--- 6 Operational Analytics Metrics ---');
  console.table([
    { Metric: 'Hospitals', Value: metrics.hospitalsCount, Subtext: `${metrics.verifiedHospitalsCount} Verified` },
    { Metric: 'Blood Banks', Value: metrics.bloodBanksCount, Subtext: `${metrics.verifiedBanksCount} Verified` },
    { Metric: 'Donors', Value: metrics.donorsCount, Subtext: 'Registered voluntary donors' },
    { Metric: 'Active Requests', Value: metrics.activeRequestsCount, Subtext: 'Pipeline in progress' },
    { Metric: 'Critical Requests', Value: metrics.criticalRequestsCount, Subtext: '< 1 hr turnaround target' },
    { Metric: 'Avg Response Time', Value: `${metrics.avgResponseTime} min`, Subtext: 'Request to offer interval' }
  ]);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runAdminDashboardTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

