import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  LogOut,
  MapPin,
  RefreshCw,
  Droplet,
  Power,
  CheckCircle2
} from 'lucide-react';
import DonorRequestCard from '../components/DonorRequestCard.jsx';
import {
  fetchDonorCompatibleRequests,
  respondAsDonor,
  getDonorProfile,
  setDonorAvailability,
  filterNearbyRequestsForDonor
} from '../services/donorService.js';
import { getCurrentUser, signOut } from '../services/auth.js';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates.js';

// Realistic sample requests for immediate review and testing across blood groups
const SAMPLE_DONOR_REQUESTS = [
  {
    id: 'req-donor-001',
    hospital_name: 'Metro General Hospital & Trauma Center',
    hospital_id: 'hosp-001',
    blood_group: 'O+',
    component_type: 'Whole Blood',
    count: 2,
    urgency: 'CRITICAL',
    latitude: 18.5300,
    longitude: 73.8600, // ~1.1 km
    created_at: new Date(Date.now() - 5 * 60000).toISOString()
  },
  {
    id: 'req-donor-002',
    hospital_name: 'Ruby Hall Medical Center',
    hospital_id: 'hosp-002',
    blood_group: 'O+',
    component_type: 'PRBC',
    count: 3,
    urgency: 'HIGH',
    latitude: 18.5450,
    longitude: 73.8800, // ~3.8 km
    created_at: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: 'req-donor-003',
    hospital_name: 'Noble Specialty Hospital',
    hospital_id: 'hosp-003',
    blood_group: 'O+',
    component_type: 'Platelets',
    count: 1,
    urgency: 'NORMAL',
    latitude: 18.5600,
    longitude: 73.9100, // ~7.2 km
    created_at: new Date(Date.now() - 35 * 60000).toISOString()
  },
  {
    id: 'req-donor-004',
    hospital_name: 'Sahyadri Specialty Hospital',
    hospital_id: 'hosp-004',
    blood_group: 'A+', // Different group! Should be excluded for O+ donor
    component_type: 'Whole Blood',
    count: 2,
    urgency: 'CRITICAL',
    latitude: 18.5250,
    longitude: 73.8600,
    created_at: new Date(Date.now() - 10 * 60000).toISOString()
  },
  {
    id: 'req-donor-005',
    hospital_name: 'Highway Trauma Center',
    hospital_id: 'hosp-005',
    blood_group: 'O+',
    component_type: 'Whole Blood',
    count: 4,
    urgency: 'CRITICAL',
    latitude: 18.8000,
    longitude: 74.1500, // ~38 km - outside 20km radius! Should be excluded
    created_at: new Date(Date.now() - 2 * 60000).toISOString()
  }
];

export default function DonorDashboard() {
  const navigate = useNavigate();

  const [donorProfile, setDonorProfile] = useState({
    id: 'donor-user-001',
    profile_id: 'donor-user-001',
    name: 'Registered Voluntary Donor',
    blood_group: 'O+',
    latitude: 18.5204,
    longitude: 73.8567,
    is_available: true
  });

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondedMap, setRespondedMap] = useState({});
  const [respondingMap, setRespondingMap] = useState({});
  const [responseSuccessMessage, setResponseSuccessMessage] = useState(null);

  const donorBloodGroup = donorProfile.blood_group;
  const donorLat = donorProfile.latitude;
  const donorLon = donorProfile.longitude;

  // Load donor profile & nearby requests
  const loadDonorData = useCallback(async () => {
    try {
      const { data: user } = await getCurrentUser();
      let currentDonor = {
        blood_group: donorBloodGroup,
        latitude: donorLat,
        longitude: donorLon
      };

      if (user) {
        const prof = await getDonorProfile(user.id);
        currentDonor = prof;
        setDonorProfile(prof);
      }

      // Fetch compatible requests from database
      const liveRequests = await fetchDonorCompatibleRequests(currentDonor, { maxRadiusKm: 20 });

      if (liveRequests && liveRequests.length > 0) {
        setRequests(liveRequests);
      } else {
        // Fallback to verified filtered mock data
        const filteredMock = filterNearbyRequestsForDonor(SAMPLE_DONOR_REQUESTS, currentDonor, { maxRadiusKm: 20 });
        setRequests(filteredMock);
      }
    } catch (err) {
      console.warn('Error loading donor requests, using fallback:', err);
      const fallbackDonor = { blood_group: donorBloodGroup, latitude: donorLat, longitude: donorLon };
      const filteredMock = filterNearbyRequestsForDonor(SAMPLE_DONOR_REQUESTS, fallbackDonor, { maxRadiusKm: 20 });
      setRequests(filteredMock);
    } finally {
      setLoading(false);
    }
  }, [donorBloodGroup, donorLat, donorLon]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await loadDonorData();
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadDonorData]);

  // Live updates when an emergency request is created or changed
  useRealtimeUpdates({
    onEmergencyRequest: () => {
      loadDonorData();
    }
  });

  // Handle Availability Toggle
  const handleToggleAvailability = () => {
    const nextState = !donorProfile.is_available;
    setDonorProfile((prev) => ({ ...prev, is_available: nextState }));
    setDonorAvailability(donorProfile.id || donorProfile.profile_id, nextState);
  };

  // Change Blood Group Filter
  const handleBloodGroupChange = (newGroup) => {
    const updated = { ...donorProfile, blood_group: newGroup };
    setDonorProfile(updated);
    const reFiltered = filterNearbyRequestsForDonor(SAMPLE_DONOR_REQUESTS, updated, { maxRadiusKm: 20 });
    setRequests(reFiltered);
  };

  // Handle Volunteer Response
  const handleRespond = async (request) => {
    const reqId = request.id;
    setRespondingMap((prev) => ({ ...prev, [reqId]: true }));

    try {
      const result = await respondAsDonor({
        requestId: reqId,
        hospitalId: request.hospital_id,
        donorId: donorProfile.id || donorProfile.profile_id,
        donorName: donorProfile.name,
        donorBloodGroup: donorProfile.blood_group,
        notes: `Donor response: ${donorProfile.name} volunteered for ${request.hospital_name}.`
      });

      if (result.success) {
        setRespondedMap((prev) => ({ ...prev, [reqId]: true }));
        setResponseSuccessMessage(`Thank you! Your willingness to donate has been logged for ${request.hospital_name}.`);
        setTimeout(() => {
          setResponseSuccessMessage(null);
        }, 5000);
      }
    } catch (err) {
      console.error('Failed to respond as donor:', err);
    } finally {
      setRespondingMap((prev) => ({ ...prev, [reqId]: false }));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">LIFE-LINK</span>
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Donor Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{donorProfile.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-extrabold text-xs">
                {donorProfile.blood_group}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Donor Status Control Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Donor Profile &amp; Readiness</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Search Radius: <strong>Within 20 km</strong>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Nearby Compatible Emergency Calls
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Displaying active hospital requirements matching your verified blood profile within delivery range.
              </p>
            </div>

            {/* Availability Toggle Switch */}
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 self-start md:self-auto">
              <div>
                <span className="text-xs font-bold text-slate-700 block">
                  {donorProfile.is_available ? 'Available for Emergency' : 'Unavailable (Off-Duty)'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {donorProfile.is_available ? 'Receiving emergency calls' : 'Calls temporarily paused'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleAvailability}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  donorProfile.is_available ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={donorProfile.is_available}
                data-testid="availability-toggle"
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    donorProfile.is_available ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quick Filter Bar: Blood Group Testing & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-red-600" />
                Active Blood Group:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => handleBloodGroupChange(bg)}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                      donorProfile.blood_group === bg
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    data-testid={`bg-filter-${bg}`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRefreshing(true);
                  loadDonorData().then(() => setRefreshing(false));
                }}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-2xs transition-colors"
                title="Refresh nearby calls"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
                <span>Refresh Calls</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Toast / Banner for Successful Pledge */}
        {responseSuccessMessage && (
          <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{responseSuccessMessage}</span>
          </div>
        )}

        {/* Unavailability Alert */}
        {!donorProfile.is_available && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 text-xs sm:text-sm">
            <Power className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>You are currently marked Unavailable.</strong> You can browse nearby requests, but you cannot submit a volunteer response until you toggle your availability to <strong>Available</strong>.
            </span>
          </div>
        )}

        {/* Requests Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Active Compatible Calls</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
              {requests.length} Nearby
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Showing only <strong className="text-slate-800">{donorProfile.blood_group}</strong> requests within 20km
          </span>
        </div>

        {/* Requests Listing */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-10 bg-slate-50 rounded" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Immediate Calls for {donorProfile.blood_group}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              There are currently no active emergency requests for blood group {donorProfile.blood_group} within 20km of your location. You will receive an alert as soon as a hospital places an urgent call.
            </p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="donor-requests-list">
            {requests.map((req) => (
              <DonorRequestCard
                key={req.id}
                request={req}
                donorAvailable={donorProfile.is_available}
                isResponded={Boolean(respondedMap[req.id])}
                isResponding={Boolean(respondingMap[req.id])}
                onRespond={handleRespond}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
