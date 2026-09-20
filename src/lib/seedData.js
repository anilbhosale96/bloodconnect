/**
 * LIFE-LINK Emergency Blood Response System
 * Comprehensive Demo Seed Data Generator
 *
 * Seed Data Requirements:
 * 1. 5 Blood Banks in distinct locations/cities, at least 2km apart, with accurate coordinates
 * 2. 10 Voluntary Donors covering all 8 blood groups (O+, O-, A+, A-, B+, B-, AB+, AB-)
 * 3. 3 Emergency Requests with varying urgencies: CRITICAL, HIGH, NORMAL
 * 4. Varied inventory levels (some high, some low, covering all blood groups & components)
 * 5. Institutional & voluntary demo user accounts for instant presentation logins
 */

import { supabase } from './supabase.js';

export const SEED_BLOOD_BANKS = [
  {
    id: 'bb-central-001',
    name: 'Metro Central Regional Blood Bank',
    city: 'Central District, Bangalore',
    address: '14 Millers Road, Vasanth Nagar',
    latitude: 12.9716,
    longitude: 77.5946,
    phone: '080-22214455',
    email: 'central.bloodbank@lifelink.org',
    verification_status: 'VERIFIED',
    operating_hours: '24/7 Emergency Transfusion Unit',
    total_units: 142
  },
  {
    id: 'bb-north-002',
    name: 'Indian Red Cross Society Transfusion Center',
    city: 'North District, Bangalore',
    address: '26/1 Railway Parallel Rd, Malleshwaram',
    latitude: 13.0125,
    longitude: 77.5512,
    phone: '080-23348899',
    email: 'redcross.north@lifelink.org',
    verification_status: 'VERIFIED',
    operating_hours: '24/7 Emergency Service',
    total_units: 98
  },
  {
    id: 'bb-south-003',
    name: 'Rotary TTK Regional Blood Centre',
    city: 'South District, Bangalore',
    address: '107/1 New Hospital Rd, Jayanagar 4th Block',
    latitude: 12.9249,
    longitude: 77.5834,
    phone: '080-26639900',
    email: 'rotary.ttk@lifelink.org',
    verification_status: 'VERIFIED',
    operating_hours: '24/7 Component Separation Facility',
    total_units: 115
  },
  {
    id: 'bb-west-004',
    name: 'Victoria Institute Transfusion Services',
    city: 'West District, Bangalore',
    address: 'K.R. Road, City Market Medical Campus',
    latitude: 12.9620,
    longitude: 77.5750,
    phone: '080-26701122',
    email: 'victoria.transfusion@lifelink.org',
    verification_status: 'VERIFIED',
    operating_hours: '24/7 Government Trauma Hub',
    total_units: 84
  },
  {
    id: 'bb-east-005',
    name: 'Lifeline Regional Blood Centre',
    city: 'East District, Bangalore',
    address: '88 100 Feet Road, Indiranagar',
    latitude: 12.9815,
    longitude: 77.6408,
    phone: '080-25217733',
    email: 'lifeline.east@lifelink.org',
    verification_status: 'PENDING',
    operating_hours: '24/7 Cryo & Apheresis Wing',
    total_units: 67
  }
];

export const SEED_INVENTORY = [
  // Metro Central (bb-central-001) - High Whole Blood, low O- Platelets
  { id: 'inv-101', blood_bank_id: 'bb-central-001', blood_group: 'O+', component_type: 'Whole Blood', available_units: 24, reserved_units: 3 },
  { id: 'inv-102', blood_bank_id: 'bb-central-001', blood_group: 'O+', component_type: 'Platelets', available_units: 14, reserved_units: 2 },
  { id: 'inv-103', blood_bank_id: 'bb-central-001', blood_group: 'O-', component_type: 'PRBC', available_units: 4, reserved_units: 1 },
  { id: 'inv-104', blood_bank_id: 'bb-central-001', blood_group: 'O-', component_type: 'Platelets', available_units: 1, reserved_units: 0 }, // Low
  { id: 'inv-105', blood_bank_id: 'bb-central-001', blood_group: 'A+', component_type: 'PRBC', available_units: 18, reserved_units: 2 },
  { id: 'inv-106', blood_bank_id: 'bb-central-001', blood_group: 'A-', component_type: 'Whole Blood', available_units: 3, reserved_units: 0 },
  { id: 'inv-107', blood_bank_id: 'bb-central-001', blood_group: 'B+', component_type: 'Whole Blood', available_units: 20, reserved_units: 4 },
  { id: 'inv-108', blood_bank_id: 'bb-central-001', blood_group: 'B-', component_type: 'FFP', available_units: 2, reserved_units: 0 },
  { id: 'inv-109', blood_bank_id: 'bb-central-001', blood_group: 'AB+', component_type: 'Platelets', available_units: 12, reserved_units: 1 },
  { id: 'inv-110', blood_bank_id: 'bb-central-001', blood_group: 'AB-', component_type: 'Cryoprecipitate', available_units: 1, reserved_units: 0 }, // Low

  // Indian Red Cross North (bb-north-002) - High Platelets, Low rare groups
  { id: 'inv-201', blood_bank_id: 'bb-north-002', blood_group: 'O-', component_type: 'Platelets', available_units: 6, reserved_units: 1 },
  { id: 'inv-202', blood_bank_id: 'bb-north-002', blood_group: 'O+', component_type: 'Platelets', available_units: 18, reserved_units: 3 },
  { id: 'inv-203', blood_bank_id: 'bb-north-002', blood_group: 'A+', component_type: 'Platelets', available_units: 15, reserved_units: 0 },
  { id: 'inv-204', blood_bank_id: 'bb-north-002', blood_group: 'B+', component_type: 'Whole Blood', available_units: 10, reserved_units: 1 },
  { id: 'inv-205', blood_bank_id: 'bb-north-002', blood_group: 'B-', component_type: 'Whole Blood', available_units: 0, reserved_units: 0 }, // Critically empty
  { id: 'inv-206', blood_bank_id: 'bb-north-002', blood_group: 'AB-', component_type: 'PRBC', available_units: 2, reserved_units: 0 },

  // Rotary TTK South (bb-south-003) - Balanced reserves
  { id: 'inv-301', blood_bank_id: 'bb-south-003', blood_group: 'B+', component_type: 'Whole Blood', available_units: 16, reserved_units: 2 },
  { id: 'inv-302', blood_bank_id: 'bb-south-003', blood_group: 'O+', component_type: 'PRBC', available_units: 22, reserved_units: 5 },
  { id: 'inv-303', blood_bank_id: 'bb-south-003', blood_group: 'O-', component_type: 'Platelets', available_units: 4, reserved_units: 1 },
  { id: 'inv-304', blood_bank_id: 'bb-south-003', blood_group: 'A+', component_type: 'FFP', available_units: 14, reserved_units: 0 },
  { id: 'inv-305', blood_bank_id: 'bb-south-003', blood_group: 'AB+', component_type: 'Whole Blood', available_units: 8, reserved_units: 1 },

  // Victoria Institute West (bb-west-004) - High Trauma PRBC
  { id: 'inv-401', blood_bank_id: 'bb-west-004', blood_group: 'O-', component_type: 'PRBC', available_units: 8, reserved_units: 2 },
  { id: 'inv-402', blood_bank_id: 'bb-west-004', blood_group: 'O+', component_type: 'PRBC', available_units: 28, reserved_units: 4 },
  { id: 'inv-403', blood_bank_id: 'bb-west-004', blood_group: 'A+', component_type: 'PRBC', available_units: 12, reserved_units: 1 },
  { id: 'inv-404', blood_bank_id: 'bb-west-004', blood_group: 'A+', component_type: 'FFP', available_units: 1, reserved_units: 0 }, // Low
  { id: 'inv-405', blood_bank_id: 'bb-west-004', blood_group: 'AB-', component_type: 'Platelets', available_units: 1, reserved_units: 0 },

  // Lifeline Regional East (bb-east-005) - East corridor community
  { id: 'inv-501', blood_bank_id: 'bb-east-005', blood_group: 'O+', component_type: 'Whole Blood', available_units: 12, reserved_units: 1 },
  { id: 'inv-502', blood_bank_id: 'bb-east-005', blood_group: 'B+', component_type: 'PRBC', available_units: 15, reserved_units: 2 },
  { id: 'inv-503', blood_bank_id: 'bb-east-005', blood_group: 'O-', component_type: 'Platelets', available_units: 3, reserved_units: 0 },
  { id: 'inv-504', blood_bank_id: 'bb-east-005', blood_group: 'A-', component_type: 'PRBC', available_units: 2, reserved_units: 0 },
  { id: 'inv-505', blood_bank_id: 'bb-east-005', blood_group: 'AB+', component_type: 'FFP', available_units: 6, reserved_units: 0 }
];

export const SEED_DONORS = [
  {
    id: 'donor-001',
    profile_id: 'demo-user-donor-001',
    name: 'Rahul Verma',
    blood_group: 'O+',
    phone: '+91 98450 11201',
    city: 'Central Bangalore',
    latitude: 12.9720,
    longitude: 77.5950,
    is_available: true,
    last_donation_date: '2026-05-14',
    total_donations: 4
  },
  {
    id: 'donor-002',
    profile_id: 'demo-user-donor',
    name: 'Priya Sharma',
    blood_group: 'O-',
    phone: '+91 98450 22302',
    city: 'Indiranagar, Bangalore',
    latitude: 12.9780,
    longitude: 77.6400,
    is_available: true,
    last_donation_date: '2026-04-10',
    total_donations: 7
  },
  {
    id: 'donor-003',
    profile_id: 'demo-user-donor-003',
    name: 'Amit Patel',
    blood_group: 'A+',
    phone: '+91 98450 33403',
    city: 'Jayanagar, Bangalore',
    latitude: 12.9300,
    longitude: 77.5850,
    is_available: true,
    last_donation_date: '2026-07-20',
    total_donations: 3
  },
  {
    id: 'donor-004',
    profile_id: 'demo-user-donor-004',
    name: 'Sneha Rao',
    blood_group: 'A-',
    phone: '+91 98450 44504',
    city: 'Malleshwaram, Bangalore',
    latitude: 12.9980,
    longitude: 77.5700,
    is_available: true,
    last_donation_date: '2026-03-05',
    total_donations: 5
  },
  {
    id: 'donor-005',
    profile_id: 'demo-user-donor-005',
    name: 'Vikram Singh',
    blood_group: 'B+',
    phone: '+91 98450 55605',
    city: 'Koramangala, Bangalore',
    latitude: 12.9350,
    longitude: 77.6200,
    is_available: true,
    last_donation_date: '2026-06-18',
    total_donations: 2
  },
  {
    id: 'donor-006',
    profile_id: 'demo-user-donor-006',
    name: 'Deepa Nair',
    blood_group: 'B-',
    phone: '+91 98450 66706',
    city: 'Whitefield, Bangalore',
    latitude: 12.9698,
    longitude: 77.7500,
    is_available: true,
    last_donation_date: '2026-05-02',
    total_donations: 6
  },
  {
    id: 'donor-007',
    profile_id: 'demo-user-donor-007',
    name: 'Karthik Iyer',
    blood_group: 'AB+',
    phone: '+91 98450 77807',
    city: 'Hebbal, Bangalore',
    latitude: 13.0350,
    longitude: 77.5970,
    is_available: true,
    last_donation_date: '2026-01-12',
    total_donations: 8
  },
  {
    id: 'donor-008',
    profile_id: 'demo-user-donor-008',
    name: 'Ananya Joshi',
    blood_group: 'AB-',
    phone: '+91 98450 88908',
    city: 'Rajajinagar, Bangalore',
    latitude: 12.9900,
    longitude: 77.5550,
    is_available: true,
    last_donation_date: '2026-04-22',
    total_donations: 4
  },
  {
    id: 'donor-009',
    profile_id: 'demo-user-donor-009',
    name: 'Rohan Kulkarni',
    blood_group: 'O+',
    phone: '+91 98450 99009',
    city: 'Basavanagudi, Bangalore',
    latitude: 12.9420,
    longitude: 77.5740,
    is_available: false, // Currently resting
    last_donation_date: '2026-08-30',
    total_donations: 9
  },
  {
    id: 'donor-010',
    profile_id: 'demo-user-donor-010',
    name: 'Pooja Hegde',
    blood_group: 'A+',
    phone: '+91 98450 10110',
    city: 'HSR Layout, Bangalore',
    latitude: 12.9120,
    longitude: 77.6440,
    is_available: true,
    last_donation_date: '2026-06-04',
    total_donations: 3
  }
];

export const SEED_EMERGENCY_REQUESTS = [
  {
    id: 'req-seed-001',
    hospital_id: 'hosp-manipal-001',
    hospital_name: 'Manipal Emergency & Trauma Care',
    hospital_city: 'Indiranagar, Bangalore',
    latitude: 12.9784,
    longitude: 77.6408,
    blood_group: 'O-',
    component_type: 'Platelets',
    count: 3,
    quantity: 3,
    urgency: 'CRITICAL',
    status: 'NOTIFIED',
    match_count: 5,
    response_count: 2,
    units_offered: 2,
    percent_fulfilled: 67,
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    deadline: new Date(Date.now() + 35 * 60000).toISOString(),
    top_responder: 'Metro Central Regional Blood Bank',
    notes: 'Severe trauma admission from Old Airport Road pileup. Immediate platelet transfusion needed.'
  },
  {
    id: 'req-seed-002',
    hospital_id: 'hosp-apollo-002',
    hospital_name: 'Apollo Specialty Hospital',
    hospital_city: 'Jayanagar, Bangalore',
    latitude: 12.9298,
    longitude: 77.5834,
    blood_group: 'B+',
    component_type: 'Whole Blood',
    count: 2,
    quantity: 2,
    urgency: 'HIGH',
    status: 'RESERVED',
    match_count: 8,
    response_count: 2,
    units_offered: 2,
    percent_fulfilled: 100,
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    deadline: new Date(Date.now() + 95 * 60000).toISOString(),
    top_responder: 'Rotary TTK Regional Blood Centre',
    notes: 'Emergency vascular surgery scheduled for 15:30. Blood units reserved in transit.'
  },
  {
    id: 'req-seed-003',
    hospital_id: 'hosp-stmarthas-003',
    hospital_name: "St. Martha's Hospital",
    hospital_city: 'Nrupathunga Rd, Bangalore',
    latitude: 12.9719,
    longitude: 77.5868,
    blood_group: 'A+',
    component_type: 'PRBC',
    count: 2,
    quantity: 2,
    urgency: 'NORMAL',
    status: 'SEARCHING',
    match_count: 6,
    response_count: 0,
    units_offered: 0,
    percent_fulfilled: 0,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    deadline: new Date(Date.now() + 5 * 3600000).toISOString(),
    top_responder: null,
    notes: 'Scheduled oncological surgery preparation. PRBC units required before morning rounds.'
  }
];

export const DEMO_USERS = [
  {
    role: 'hospital',
    label: 'Hospital Emergency Director',
    email: 'hospital@lifelink.org',
    password: 'Hospital123!',
    fullName: 'Dr. Arvind Rao',
    organization: 'Manipal Emergency & Trauma Care',
    portalUrl: '/hospital',
    profile: {
      id: 'demo-user-hospital',
      email: 'hospital@lifelink.org',
      role: 'hospital',
      full_name: 'Dr. Arvind Rao',
      hospital_name: 'Manipal Emergency & Trauma Care',
      city: 'Bangalore'
    }
  },
  {
    role: 'blood_bank',
    label: 'Blood Bank Officer',
    email: 'bloodbank@lifelink.org',
    password: 'BloodBank123!',
    fullName: 'Sunita Deshmukh',
    organization: 'Metro Central Regional Blood Bank',
    portalUrl: '/blood-bank',
    profile: {
      id: 'demo-user-bloodbank',
      email: 'bloodbank@lifelink.org',
      role: 'blood_bank',
      full_name: 'Sunita Deshmukh',
      blood_bank_name: 'Metro Central Regional Blood Bank',
      city: 'Bangalore'
    }
  },
  {
    role: 'donor',
    label: 'Universal Donor (O-)',
    email: 'donor@lifelink.org',
    password: 'Donor123!',
    fullName: 'Priya Sharma',
    organization: 'Voluntary Life-Link Donor Network',
    portalUrl: '/donor',
    profile: {
      id: 'demo-user-donor',
      email: 'donor@lifelink.org',
      role: 'donor',
      full_name: 'Priya Sharma',
      blood_group: 'O-',
      city: 'Indiranagar, Bangalore'
    }
  },
  {
    role: 'admin',
    label: 'System Administrator',
    email: 'admin@lifelink.org',
    password: 'Password123!',
    fullName: 'Director Vikram Mehta',
    organization: 'Life-Link Command Central',
    portalUrl: '/admin',
    profile: {
      id: 'demo-user-admin',
      email: 'admin@lifelink.org',
      role: 'admin',
      full_name: 'Director Vikram Mehta'
    }
  }
];

const SEED_STORAGE_KEY = 'lifelink_seed_data_v1';

/**
 * Checks whether demo data has already been initialized in local storage.
 * @returns {boolean}
 */
export function isDataSeeded() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(SEED_STORAGE_KEY) !== null;
}

/**
 * Returns currently stored seed data or built-in defaults.
 * @returns {Object}
 */
export function getSeedData() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SEED_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading seed data from localStorage:', e);
    }
  }

  return {
    bloodBanks: SEED_BLOOD_BANKS,
    inventory: SEED_INVENTORY,
    donors: SEED_DONORS,
    emergencyRequests: SEED_EMERGENCY_REQUESTS,
    demoUsers: DEMO_USERS,
    seededAt: new Date().toISOString()
  };
}

/**
 * Seeds demo data into Supabase if accessible, and caches locally
 * for instantaneous offline / zero-network presentation safety.
 *
 * @returns {Promise<{ success: boolean, counts: Object, message: string }>}
 */
export async function seedDemoData() {
  const counts = {
    bloodBanks: SEED_BLOOD_BANKS.length,
    inventory: SEED_INVENTORY.length,
    donors: SEED_DONORS.length,
    requests: SEED_EMERGENCY_REQUESTS.length
  };

  const payload = {
    bloodBanks: SEED_BLOOD_BANKS,
    inventory: SEED_INVENTORY,
    donors: SEED_DONORS,
    emergencyRequests: SEED_EMERGENCY_REQUESTS,
    demoUsers: DEMO_USERS,
    seededAt: new Date().toISOString()
  };

  // 1. Save to localStorage for instant client reactivity
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SEED_STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem('lifelink_demo_blood_banks', JSON.stringify(SEED_BLOOD_BANKS));
      localStorage.setItem('lifelink_demo_inventory', JSON.stringify(SEED_INVENTORY));
      localStorage.setItem('lifelink_demo_donors', JSON.stringify(SEED_DONORS));
      localStorage.setItem('lifelink_demo_requests', JSON.stringify(SEED_EMERGENCY_REQUESTS));
    } catch (err) {
      console.warn('Failed saving seed data to localStorage:', err);
    }
  }

  // 2. Attempt upserts into Supabase tables where permissible
  try {
    await Promise.allSettled([
      supabase.from('blood_banks').upsert(SEED_BLOOD_BANKS),
      supabase.from('inventory').upsert(SEED_INVENTORY),
      supabase.from('donors').upsert(SEED_DONORS),
      supabase.from('emergency_requests').upsert(SEED_EMERGENCY_REQUESTS)
    ]);
  } catch {
    // If Supabase RLS is enforcing auth, client-side seed data remains active
    console.info('Supabase database sync completed with local storage fallback active.');
  }

  return {
    success: true,
    counts,
    message: `Successfully seeded ${counts.bloodBanks} Blood Banks, ${counts.donors} Donors, ${counts.requests} Emergency Requests, and ${counts.inventory} Inventory items.`
  };
}

/**
 * Resets local demo state back to pristine empty state.
 */
export function resetDemoData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SEED_STORAGE_KEY);
    localStorage.removeItem('lifelink_demo_blood_banks');
    localStorage.removeItem('lifelink_demo_inventory');
    localStorage.removeItem('lifelink_demo_donors');
    localStorage.removeItem('lifelink_demo_requests');
  }
}
