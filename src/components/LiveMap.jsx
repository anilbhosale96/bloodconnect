import React, { useState, useMemo } from 'react';
import {
  Shield,
  Building2,
  Radio
} from 'lucide-react';
import { DEMO_BLOOD_BANKS_LOCATIONS } from '../services/commandCenterService.js';

// Geographic bounds of Metro Bangalore
// Lat: ~12.87 to 13.08, Lon: ~77.52 to 77.68
const MAP_BOUNDS = {
  minLat: 12.87,
  maxLat: 13.08,
  minLon: 77.52,
  maxLon: 77.68
};

// Convert GPS coordinates into SVG viewBox percentages (0 to 1000 x 0 to 650)
function projectCoords(lat, lon) {
  const defaultLat = 12.9716;
  const defaultLon = 77.5946;
  const validLat = typeof lat === 'number' ? lat : defaultLat;
  const validLon = typeof lon === 'number' ? lon : defaultLon;

  const x = ((validLon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * 900 + 50;
  const y = ((MAP_BOUNDS.maxLat - validLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 550 + 50;
  return { x: Math.max(40, Math.min(960, x)), y: Math.max(40, Math.min(610, y)) };
}

/**
 * Interactive Live Tactical Map for Emergency Command Center.
 *
 * Visualizes:
 * - Hospital emergency locations with urgency color coding (Red = CRITICAL, Amber = HIGH, Green = NORMAL)
 * - Blood bank distribution depots & available reserves
 * - Active dispatch transit vectors connecting blood banks to hospitals
 * - Distance radius circles (5km, 10km, 20km)
 * - Interactive node selection
 *
 * @param {Object} props
 * @param {Array<Object>} props.requests - Active emergency requests
 * @param {Object} [props.selectedRequest] - Currently focused request
 * @param {Function} [props.onSelectRequest] - Callback when hospital node is clicked
 */
export default function LiveMap({
  requests = [],
  selectedRequest = null,
  onSelectRequest
}) {
  const [showRadar, setShowRadar] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Blood banks positions
  const bloodBanks = DEMO_BLOOD_BANKS_LOCATIONS;

  // Compute active connection vectors between blood banks and hospitals with responses
  const activeVectors = useMemo(() => {
    return requests
      .filter((r) => r.units_offered > 0 || r.status === 'RESERVED' || r.status === 'NOTIFIED')
      .map((req, idx) => {
        const hospPos = projectCoords(req.latitude, req.longitude);
        const bank = bloodBanks[idx % bloodBanks.length];
        const bankPos = projectCoords(bank.latitude, bank.longitude);
        return {
          id: `vec-${req.id}-${bank.id}`,
          request: req,
          bank,
          x1: bankPos.x,
          y1: bankPos.y,
          x2: hospPos.x,
          y2: hospPos.y,
          urgency: req.urgency
        };
      });
  }, [requests, bloodBanks]);

  return (
    <div className="relative bg-slate-950 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col text-white">
      {/* Top Map Control Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>GEO-TACTICAL RADAR</span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Bangalore Metro Grid • 20km Active Radius
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowRadar((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              showRadar
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radar Sweep</span>
          </button>

          <div className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
            {requests.length} Emergencies Active
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/10] max-h-[500px] overflow-hidden select-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <svg
          viewBox="0 0 1000 650"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(51, 65, 85, 0.25)"
                strokeWidth="1"
              />
            </pattern>

            {/* Glowing gradient for CRITICAL emergency */}
            <radialGradient id="critical-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            {/* Glowing gradient for HIGH emergency */}
            <radialGradient id="high-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            {/* Radar sweep animation */}
            <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="90%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          <rect width="1000" height="650" fill="url(#grid)" />

          {/* Distance Concentric Radar Rings (5km, 10km, 20km) */}
          <circle
            cx="500"
            cy="325"
            r="120"
            fill="none"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="505" y="210" fill="#475569" fontSize="11" fontFamily="monospace">
            5 KM
          </text>

          <circle
            cx="500"
            cy="325"
            r="230"
            fill="none"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="505" y="100" fill="#475569" fontSize="11" fontFamily="monospace">
            10 KM
          </text>

          <circle
            cx="500"
            cy="325"
            r="320"
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
          />
          <text x="505" y="20" fill="#64748b" fontSize="11" fontFamily="monospace">
            20 KM (RULE RADIUS)
          </text>

          {/* Crosshairs */}
          <line x1="500" y1="20" x2="500" y2="630" stroke="#1e293b" strokeWidth="1" />
          <line x1="20" y1="325" x2="980" y2="325" stroke="#1e293b" strokeWidth="1" />

          {/* Animated Radar Sweep Cone */}
          {showRadar && (
            <g className="origin-center animate-[spin_8s_linear_infinite]" style={{ transformOrigin: '500px 325px' }}>
              <path
                d="M 500 325 L 750 150 A 320 320 0 0 0 500 5 Z"
                fill="url(#radarSweep)"
              />
            </g>
          )}

          {/* Active Response Logistics Vectors (Transit Lines) */}
          {activeVectors.map((vec) => {
            const isCritical = vec.urgency === 'CRITICAL';
            const strokeColor = isCritical ? '#ef4444' : '#3b82f6';
            return (
              <g key={vec.id}>
                {/* Connecting Arc/Line */}
                <line
                  x1={vec.x1}
                  y1={vec.y1}
                  x2={vec.x2}
                  y2={vec.y2}
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  strokeOpacity="0.75"
                  className="animate-pulse"
                />
                {/* Moving Courier Pulse Marker */}
                <circle
                  cx={(vec.x1 + vec.x2) / 2}
                  cy={(vec.y1 + vec.y2) / 2}
                  r="4"
                  fill={strokeColor}
                  className="animate-ping"
                />
              </g>
            );
          })}

          {/* Blood Bank Nodes (Logistics Depots) */}
          {bloodBanks.map((bank) => {
            const pos = projectCoords(bank.latitude, bank.longitude);
            return (
              <g
                key={bank.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode({ type: 'BANK', ...bank, ...pos })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Outer depot halo */}
                <circle r="16" fill="#0284c7" fillOpacity="0.2" />
                <circle r="10" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
                {/* Diamond center */}
                <rect
                  x="-3"
                  y="-3"
                  width="6"
                  height="6"
                  fill="#ffffff"
                  transform="rotate(45)"
                />
                {/* Label */}
                <text
                  y="24"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {bank.name.split(' ')[0]} Hub
                </text>
              </g>
            );
          })}

          {/* Hospital Emergency Nodes */}
          {requests.map((req) => {
            const pos = projectCoords(req.latitude, req.longitude);
            const isSelected = selectedRequest?.id === req.id;
            const isCritical = req.urgency === 'CRITICAL';
            const isHigh = req.urgency === 'HIGH';

            const pinColor = isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#10b981';
            const pulseR = isCritical ? 24 : 18;

            return (
              <g
                key={req.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => onSelectRequest && onSelectRequest(req)}
                onMouseEnter={() => setHoveredNode({ type: 'HOSPITAL', ...req, ...pos })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Emergency Pulsing Waves */}
                <circle
                  r={pulseR}
                  fill={pinColor}
                  fillOpacity="0.3"
                  className={isCritical ? 'animate-ping' : ''}
                />

                {/* Selection Ring */}
                {isSelected && (
                  <circle
                    r="20"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r="11"
                  fill={pinColor}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="shadow-lg"
                />

                {/* Blood Group Icon / Text */}
                <text
                  y="3.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  {req.blood_group}
                </text>

                {/* Overhead Badge */}
                <g transform="translate(0, -18)">
                  <rect
                    x="-20"
                    y="-9"
                    width="40"
                    height="13"
                    rx="4"
                    fill={pinColor}
                  />
                  <text
                    y="0.5"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    {req.count}U • {req.urgency}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Node Hover Telemetry Tooltip */}
        {hoveredNode && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-700 text-white p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1 max-w-xs transition-all"
            style={{
              left: `${Math.min(75, Math.max(10, (hoveredNode.x / 1000) * 100))}%`,
              top: `${Math.min(65, Math.max(15, (hoveredNode.y / 650) * 100))}%`
            }}
          >
            <div className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
              {hoveredNode.type === 'HOSPITAL' ? (
                <Building2 className="w-4 h-4 text-red-400" />
              ) : (
                <Shield className="w-4 h-4 text-sky-400" />
              )}
              <span>{hoveredNode.hospital_name || hoveredNode.name}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {hoveredNode.hospital_city || hoveredNode.city}
            </div>
            {hoveredNode.type === 'HOSPITAL' ? (
              <div className="pt-1 border-t border-slate-800 text-[11px] flex items-center justify-between gap-3">
                <span className="font-bold text-red-400">
                  {hoveredNode.blood_group} ({hoveredNode.count} Units)
                </span>
                <span className="font-semibold text-emerald-400">
                  {hoveredNode.percent_fulfilled}% Fulfilled
                </span>
              </div>
            ) : (
              <div className="pt-1 border-t border-slate-800 text-[11px] flex items-center justify-between gap-3">
                <span className="text-slate-300">Available Stock:</span>
                <span className="font-bold text-sky-400">
                  {hoveredNode.total_units} Units
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Bottom Legend */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-900/90 border-t border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <span className="text-slate-300 font-semibold">Critical Request</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-300 font-semibold">High Urgency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-semibold">Normal Urgency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-sky-500" />
            <span className="text-slate-300 font-semibold">Blood Bank Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-400" />
            <span className="text-slate-300 font-semibold">Active Transit Vector</span>
          </div>
        </div>

        <div className="text-slate-400 text-[11px] font-mono">
          Click any hospital node to focus request
        </div>
      </div>
    </div>
  );
}
