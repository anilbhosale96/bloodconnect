import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- BloodConnect Google Maps Live Tracking Test Suite ---');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// Test 1: Check SQL Schema file
const sqlPath = path.join(__dirname, '../supabase_live_tracking_schema.sql');
assert(fs.existsSync(sqlPath), 'supabase_live_tracking_schema.sql exists');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');
assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.live_tracking'), 'Schema contains live_tracking table');
assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.request_status_history'), 'Schema contains request_status_history table');
assert(sqlContent.includes('hospital_latitude DOUBLE PRECISION') && sqlContent.includes('hospital_longitude DOUBLE PRECISION'), 'Schema has hospital latitude and longitude coordinates');
assert(sqlContent.includes('latitude DOUBLE PRECISION') && sqlContent.includes('longitude DOUBLE PRECISION'), 'Schema has live courier latitude and longitude');
assert(sqlContent.includes('eta TEXT') && sqlContent.includes('distance_remaining DOUBLE PRECISION'), 'Schema has eta and distance_remaining');
assert(sqlContent.includes('ALTER PUBLICATION supabase_realtime ADD TABLE public.live_tracking'), 'Schema enables realtime publication on live_tracking');

// Test 2: Check figma.js content
const figmaJsPath = path.join(__dirname, 'public/assets/figma.js');
assert(fs.existsSync(figmaJsPath), 'figma.js exists in public/assets');
const figmaContent = fs.readFileSync(figmaJsPath, 'utf8');

assert(figmaContent.includes('getGoogleMapsApiKey'), 'getGoogleMapsApiKey function present');
assert(figmaContent.includes('loadGoogleMapsApi'), 'loadGoogleMapsApi function present');
assert(figmaContent.includes('EnhancedGoogleMapsLiveTracking'), 'EnhancedGoogleMapsLiveTracking component defined');
assert(figmaContent.includes('"request-tracking":EnhancedGoogleMapsLiveTracking'), 'Router maps request-tracking to EnhancedGoogleMapsLiveTracking');

// Test 3: Check 8-stage Delivery Lifecycle
const stages = ['Created', 'Matching', 'Match Found', 'Accepted', 'Blood Prepared', 'In Transit', 'Arriving', 'Delivered'];
stages.forEach(st => {
  assert(figmaContent.includes(st), `Lifecycle stage "${st}" is supported in tracking engine`);
});

// Test 4: Check Interactive Controls
assert(figmaContent.includes('Resume Movement') || figmaContent.includes('Start Delivery'), 'Start/Resume Movement control present');
assert(figmaContent.includes('Pause Simulation') || figmaContent.includes('Pause Transit'), 'Pause Transit/Simulation control present');
assert(figmaContent.includes('Mark as Delivered'), 'Mark as Delivered control present');
assert(figmaContent.includes('Simulation') || figmaContent.includes('Demo Tracking'), 'Demo Tracking simulation mode present');

// Test 5: Check Fallback Mode Support
assert(figmaContent.includes('Realtime GPS Route Telemetry Active') || figmaContent.includes('Live Telemetry Fallback'), 'Graceful GPS Telemetry fallback display present');

// Test 6: Check Hospital Dashboard integration
assert(figmaContent.includes('Track Blood 🚨'), 'Hospital dashboard includes Track Blood 🚨 button');

// Test 7: Verify .env.local exists and is ignored by git
const envPath = path.join(__dirname, '.env.local');
assert(fs.existsSync(envPath), '.env.local exists in bloodconnect');
const envContent = fs.readFileSync(envPath, 'utf8');
assert(envContent.includes('VITE_GOOGLE_MAPS_API_KEY='), 'VITE_GOOGLE_MAPS_API_KEY defined in .env.local');

const gitignorePath = path.join(__dirname, '.gitignore');
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
assert(gitignoreContent.includes('.env.local'), '.gitignore protects .env.local from git commits');

console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Google Maps Live Tracking checks PASSED successfully!');
}
