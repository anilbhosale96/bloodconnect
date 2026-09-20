# Google Maps API Setup Guide for BloodConnect

To enable live GPS route rendering and realtime courier movement on the BloodConnect Emergency Response Network, follow these steps to configure the Google Maps Platform API.

---

## 1. Google Cloud Platform (GCP) Configuration

1. Log in to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project or create a new project named **BloodConnect**.
3. Navigate to **APIs & Services** > **Library**.
4. Search for and **ENABLE** the following two APIs:
   - **Maps JavaScript API** (Required for map rendering, markers, and vector tiles)
   - **Directions API** (Required for live vehicle driving routes and turn-by-turn geometry)
   - *(Optional)* **Places API** (For location autocomplete)

---

## 2. API Key Generation & Restrictions

1. Go to **APIs & Services** > **Credentials**.
2. Click **+ CREATE CREDENTIALS** > **API key**.
3. Under **Key restrictions**:
   - Set **Application restrictions** to **Websites (HTTP referrers)**.
   - Add your authorized domains:
     - `http://localhost:*`
     - `https://bloodconnect-six.vercel.app/*`
     - `https://*.vercel.app/*`
   - Under **API restrictions**, select:
     - *Maps JavaScript API*
     - *Directions API*
4. Copy your generated API key.

---

## 3. Environment Variable Configuration

### Local Development
In your `.env.local` file, add:
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCbmgzXaAv6EJgHWBsLctKK0cScYagMI0M
```

### Vercel Production Deployment
In the Vercel Dashboard for project **bloodconnect**:
1. Go to **Settings** > **Environment Variables**.
2. Add a new variable:
   - **Key**: `VITE_GOOGLE_MAPS_API_KEY`
   - **Value**: `AIzaSyCbmgzXaAv6EJgHWBsLctKK0cScYagMI0M`
   - **Environment**: Production, Preview, Development.
3. Save and redeploy.

---

## 4. Fallback Architecture

If `VITE_GOOGLE_MAPS_API_KEY` is missing or fails billing verification:
- BloodConnect automatically switches to the **Vector Route Schematic & Live Distance Engine**.
- Displays source address, destination hospital, dynamic distance countdown, and ETA without showing broken map tiles.
