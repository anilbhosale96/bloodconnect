# BloodConnect — Emergency Blood & Platelet Response Network

BloodConnect is a real-time emergency blood and platelet dispatch coordination platform powered by the **Google Maps Platform** and **Supabase**. It provides Swiggy-style live delivery tracking, GPS resource radar for compatible blood banks and donors, and immediate emergency response dispatching.

**Live Production Deployment:** [https://bloodconnect-six.vercel.app](https://bloodconnect-six.vercel.app)

---

## Key Features Built & Implemented

### 1. Swiggy-Style Live GPS Location Tracking (`/request-tracking`)
- **Real-Time GPS Route Streaming**: Live animated ambulance/bike delivery marker moving smoothly along real street polylines between blood bank dispatch hubs and hospital trauma docks.
- **Dynamic Delivery Telemetry**:
  - **Live Countdown ETA**: Real-time remaining transit time (e.g., 6 mins).
  - **Distance Remaining**: Precision odometer countdown (e.g., 1.8 km).
  - **Moving Courier Speed**: Real-time speed calculations (e.g., 38 km/h).
  - **Cold Chain Sensor**: Continuous live cold box temperature monitoring (3.8°C – 4.2°C) ensuring blood viability.
- **Interactive Controls**: One-click recentering (`🎯 Recenter Courier`), simulation pause/resume, and delivery confirmation handover.

### 2. Kolhapur & Maharashtra Resource Radar Map (`/map-view`)
- **Full Viewport Google Maps Canvas**: Sized to fill 100% of the viewport height (`calc(100vh - 64px)`) with no cutoff or squashed views.
- **Custom Facility Markers**:
  - 🏥 **Hospitals**: Custom red cross badges with emergency dock locations.
  - 🩸 **Blood Banks**: Teal blood drop pins displaying available unit counts.
  - 👤 **Verified Donors**: Indigo donor badges with emergency on-call status.
- **Interactive Radius Radar**: Dynamic 5km, 10km, and 25km circular search radiuses.
- **`[⛶ Full Map View]` Toggle**: One-click toggle to hide sidebar panels and expand the Google Map to 100% full screen width.

### 3. One-Click Fullscreen Map Modal Across All Dashboards
- **Global Header**: High-visibility `[Live Map]` button with animated emerald GPS radar dot available on every screen.
- **Hospital Dashboard (`/hospital`)**: Dedicated `[Live Map Radar]` and full-width Emergency Radar quick card.
- **Donor Dashboard (`/donor`)**: `[Live Emergency Map]` button and local shortage radar card.
- **Blood Bank Dashboard (`/bloodbank`)**: `[Live Dispatch Map]` action button.
- **Admin Dashboard (`/admin`)**: `[Live Network Map]` statewide radar.
- **Full-Screen Modal**: Clicking any map button opens an immediate 100% viewport modal overlay with tabs for Resource Radar and Live Swiggy Tracking, plus `Esc` key and `[✕ Close Map]` support.

---

## Demo Credentials (1-Click Login on `/login`)

| Role | Email | Password | Quick Action |
| :--- | :--- | :--- | :--- |
| **Hospital** | `hospital@cityhosp.org` | `Hospital@123` | Create emergency blood requests, monitor live deliveries |
| **Blood Bank** | `contact@citybloodbank.org` | `BloodBank@123` | Accept requests, dispatch units, stream GPS tracking |
| **Donor** | `donor@gmail.com` | `Donor@123` | View emergency alerts within 10 km, toggle emergency availability |
| **Admin** | `admin@lifelink.org` | `Admin@123` | Statewide blood network radar, verify institutions |

---

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Vite
- **Mapping & Geolocation**: Google Maps JavaScript API (Marker, Polyline, Circle, Directions)
- **Backend / Auth**: Supabase PostgreSQL & Realtime Events
- **Hosting**: Vercel Production
