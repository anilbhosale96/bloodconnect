/**
 * LIFE-LINK Automated Test Suite for Request Lifecycle Timeline & Audit Trail
 */

import {
  TIMELINE_STAGES,
  buildTimelineStages,
  getStageStateClasses
} from './src/services/auditService.js';

async function runTimelineTests() {
  console.log('====================================================');
  console.log('      LIFE-LINK Request Timeline Test Suite         ');
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

  // --- Test 1: All 6 Stages Present in Order ---
  console.log('--- Test 1: Verification of 6 Required Stages ---');
  const expectedStages = ['Created', 'Matching', 'Notified', 'Response', 'Reserved', 'Fulfilled'];
  assert(TIMELINE_STAGES.length === 6, `Exact 6 stages defined: ${TIMELINE_STAGES.length}`);

  TIMELINE_STAGES.forEach((stage, idx) => {
    assert(stage.label === expectedStages[idx], `Stage ${idx + 1} is '${expectedStages[idx]}' (got: '${stage.label}')`);
  });

  // --- Test 2: Color Coding Verification ---
  // Constraints: gray = pending, blue = in progress, green = completed
  console.log('\n--- Test 2: Color Coding Rules ---');
  const greenTheme = getStageStateClasses('completed');
  assert(greenTheme.badgeBg.includes('emerald') || greenTheme.badgeBg.includes('green'), 'Completed stage maps to green (emerald)');
  assert(greenTheme.text.includes('emerald') || greenTheme.text.includes('green'), 'Completed stage text is green');

  const blueTheme = getStageStateClasses('in_progress');
  assert(blueTheme.badgeBg.includes('blue'), 'In-progress stage maps to blue');
  assert(blueTheme.text.includes('blue'), 'In-progress stage text is blue');

  const grayTheme = getStageStateClasses('pending');
  assert(grayTheme.badgeBg.includes('slate') || grayTheme.badgeBg.includes('gray'), 'Pending stage maps to gray (slate)');
  assert(grayTheme.text.includes('slate') || grayTheme.text.includes('gray'), 'Pending stage text is gray');

  // --- Test 3: Progression with Sample Audit Logs ---
  console.log('\n--- Test 3: Audit Logs Mapping & Timestamps ---');
  const sampleAuditLogs = [
    {
      id: 'log-1',
      request_id: 'req-101',
      action: 'REQUEST_CREATED',
      timestamp: '2026-09-20T10:00:00.000Z',
      metadata: {
        actor_name: 'Dr. Sarah Rao (Apollo Hospital)',
        actor_role: 'HOSPITAL',
        stage: 'CREATED'
      }
    },
    {
      id: 'log-2',
      request_id: 'req-101',
      action: 'MATCHING_INITIATED',
      timestamp: '2026-09-20T10:00:15.000Z',
      metadata: {
        actor_name: 'Intelligent Matching Engine',
        actor_role: 'SYSTEM',
        stage: 'MATCHING'
      }
    },
    {
      id: 'log-3',
      request_id: 'req-101',
      action: 'BANKS_NOTIFIED',
      timestamp: '2026-09-20T10:00:45.000Z',
      metadata: {
        actor_name: 'Emergency Dispatch Broadcast',
        actor_role: 'SYSTEM',
        stage: 'NOTIFIED'
      }
    },
    {
      id: 'log-4',
      request_id: 'req-101',
      action: 'RESPONSE_ACCEPTED',
      timestamp: '2026-09-20T10:03:20.000Z',
      metadata: {
        actor_name: 'Metro Blood Bank & Trauma Center',
        actor_role: 'BLOOD_BANK',
        stage: 'RESPONSE'
      }
    }
  ];

  const mockRequest = {
    id: 'req-101',
    status: 'RESPONDED', // Should have Created, Matching, Notified, Response complete; Reserved in progress; Fulfilled pending
    blood_group: 'O+',
    count: 2,
    created_at: '2026-09-20T10:00:00.000Z'
  };

  const stages = buildTimelineStages(sampleAuditLogs, mockRequest);

  assert(stages.length === 6, 'Built timeline has 6 stages');

  // Verify states
  assert(stages[0].state === 'completed', 'Stage 1 (Created) is completed (green)');
  assert(stages[1].state === 'completed', 'Stage 2 (Matching) is completed (green)');
  assert(stages[2].state === 'completed', 'Stage 3 (Notified) is completed (green)');
  assert(stages[3].state === 'completed', 'Stage 4 (Response) is completed (green)');
  assert(stages[4].state === 'in_progress', 'Stage 5 (Reserved) is in_progress (blue)');
  assert(stages[5].state === 'pending', 'Stage 6 (Fulfilled) is pending (gray)');

  // Verify timestamps match audit logs
  assert(stages[0].timestamp === '2026-09-20T10:00:00.000Z', 'Stage 1 timestamp matches audit log');
  assert(stages[3].timestamp === '2026-09-20T10:03:20.000Z', 'Stage 4 timestamp matches audit log');

  // Verify actors & actions populated
  assert(stages[0].actorName === 'Dr. Sarah Rao (Apollo Hospital)', `Stage 1 has hospital actor: ${stages[0].actorName}`);
  assert(stages[3].actorName === 'Metro Blood Bank & Trauma Center', `Stage 4 has blood bank actor: ${stages[3].actorName}`);
  assert(stages[0].action != null && stages[0].action.length > 0, 'Stage 1 has explicit action');
  assert(stages[3].action != null && stages[3].action.length > 0, 'Stage 4 has explicit action');

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  console.log('--- Sample Built Timeline Progression ---');
  console.table(stages.map((s, idx) => ({
    Step: `#${idx + 1}`,
    Stage: s.label,
    State: s.state.toUpperCase(),
    Timestamp: s.timestamp ? new Date(s.timestamp).toLocaleTimeString() : '--:--',
    Actor: s.actorName || '--',
    Role: s.actorRole || '--',
    Action: s.action
  })));

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTimelineTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
