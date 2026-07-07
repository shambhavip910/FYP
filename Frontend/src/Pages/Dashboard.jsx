import { useState } from "react";
import logo from "../images/logo.png";
import Sidebar from "./Sidebar";

// Dummy data - replace with API calls when Bhoomi's engine is ready
const dummyMetrics = {
  totalStops: 24,
  totalVehicles: 3,
  fuelCost: 1240,
  fuelSaved: 18,
  avgTime: 42,
  timeSaved: 11,
  paretoSols: 12,
};

const dummySolutions = [
  { id: 1, label: "Solution A", desc: "Min fuel · 8 stops", value: "₹1,240", color: "#185FA5", tag: "blue" },
  { id: 2, label: "Solution B", desc: "Min time · 9 stops", value: "38 min", color: "#639922", tag: "green" },
  { id: 3, label: "Solution C", desc: "Balanced · 7 stops", value: "Balanced", color: "#993C1D", tag: "amber" },
];

const dummyDrivers = [
  { name: "Driver 1", pct: 72, color: "#185FA5" },
  { name: "Driver 2", pct: 65, color: "#639922" },
  { name: "Driver 3", pct: 58, color: "#993C1D" },
];

// Simple SVG route map (replace with Leaflet later)
function RouteMap() {
  return (
    <div style={{ background: "#dff0df", borderRadius: 8, height: 200, overflow: "hidden" }}>
      <svg width="100%" height="200" viewBox="0 0 300 200">
        <rect width="300" height="200" fill="#dff0df" />
        <line x1="0" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="4" />
        <line x1="150" y1="0" x2="150" y2="200" stroke="rgba(255,255,255,0.5)" strokeWidth="4" />
        {/* Route V1 */}
        <polyline points="150,100 70,60 40,120 100,150 150,100" fill="none" stroke="#185FA5" strokeWidth="2" strokeDasharray="4,2" />
        {/* Route V2 */}
        <polyline points="150,100 210,50 270,70 245,130 150,100" fill="none" stroke="#639922" strokeWidth="2" strokeDasharray="4,2" />
        {/* Route V3 */}
        <polyline points="150,100 175,155 230,168 270,140 150,100" fill="none" stroke="#993C1D" strokeWidth="2" strokeDasharray="4,2" />
        {/* Depot */}
        <circle cx="150" cy="100" r="7" fill="#185FA5" stroke="white" strokeWidth="2" />
        <text x="155" y="96" fontSize="9" fill="#0C447C" fontWeight="500">Depot</text>
        {/* V1 stops */}
        <circle cx="70" cy="60" r="5" fill="#185FA5" stroke="white" strokeWidth="2" />
        <circle cx="40" cy="120" r="5" fill="#185FA5" stroke="white" strokeWidth="2" />
        <circle cx="100" cy="150" r="5" fill="#185FA5" stroke="white" strokeWidth="2" />
        {/* V2 stops */}
        <circle cx="210" cy="50" r="5" fill="#639922" stroke="white" strokeWidth="2" />
        <circle cx="270" cy="70" r="5" fill="#639922" stroke="white" strokeWidth="2" />
        <circle cx="245" cy="130" r="5" fill="#639922" stroke="white" strokeWidth="2" />
        {/* V3 stops */}
        <circle cx="175" cy="155" r="5" fill="#993C1D" stroke="white" strokeWidth="2" />
        <circle cx="230" cy="168" r="5" fill="#993C1D" stroke="white" strokeWidth="2" />
        <circle cx="270" cy="140" r="5" fill="#993C1D" stroke="white" strokeWidth="2" />
      </svg>
    </div>
  );
}

// Simple SVG Pareto chart
function ParetoChart() {
  const points = [
    { x: 40, y: 20 }, { x: 70, y: 33 }, { x: 100, y: 45 },
    { x: 130, y: 57 }, { x: 160, y: 68 }, { x: 190, y: 79 }, { x: 220, y: 88 },
  ];
  const selected = points[3];
  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width="100%" height="120" viewBox="0 0 260 120">
      <line x1="25" y1="8" x2="25" y2="100" stroke="#ddd" strokeWidth="1" />
      <line x1="25" y1="100" x2="250" y2="100" stroke="#ddd" strokeWidth="1" />
      <text x="2" y="12" fontSize="9" fill="#888">Fuel</text>
      <text x="220" y="114" fontSize="9" fill="#888">Time →</text>
      <polyline points={polylineStr} fill="none" stroke="#185FA5" strokeWidth="1.5" strokeDasharray="3,2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === 3 ? 6 : 4}
          fill={i === 3 ? "#185FA5" : "#993C1D"} opacity={i === 3 ? 1 : 0.7} />
      ))}
      <circle cx={selected.x} cy={selected.y} r="10" fill="none" stroke="#185FA5" strokeWidth="1.5" />
      <text x={selected.x + 6} y={selected.y - 4} fontSize="8" fill="#185FA5">selected</text>
    </svg>
  );
}


export default function Dashboard() {
  const [selectedSolution, setSelectedSolution] = useState(1);
  const metrics = dummyMetrics;

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">

      {/* Sidebar */}
      <div className="p-4">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 p-4">

        {/* Topbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl mb-4 shadow-sm">
          <div className="flex items-center gap-2 font-medium text-sm">
            <img src={logo} alt="logo" className="w-7 h-7 object-contain" />
            <span className="text-[#1e3a5f] font-bold">Smart Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-md bg-[#1a9e75]/10 text-[#1a9e75] font-medium">
              NSGA-II optimized
            </span>
            <div className="w-7 h-7 rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f] flex items-center justify-center text-xs font-semibold">
              SM
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total stops", value: metrics.totalStops, sub: `${metrics.totalVehicles} vehicles` },
            { label: "Fuel cost", value: `₹${metrics.fuelCost.toLocaleString()}`, sub: `↓ ${metrics.fuelSaved}% saved` },
            { label: "Avg time", value: `${metrics.avgTime} min`, sub: `↓ ${metrics.timeSaved} min` },
            { label: "Pareto sols", value: metrics.paretoSols, sub: "trade-offs" },
          ].map((m, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">{m.label}</div>
              <div className="text-xl font-semibold text-[#1e3a5f]">{m.value}</div>
              <div className="text-xs text-gray-400 mt-1">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Map + Solutions */}
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-4 mb-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-3">🗺 Route map</div>
            <RouteMap />
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-3">≡ Select solution</div>
            {dummySolutions.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSolution(s.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border mb-2 cursor-pointer transition"
                style={{
                  border: selectedSolution === s.id ? `1.5px solid ${s.color}` : "1px solid #e5e7eb",
                  background: selectedSolution === s.id ? `${s.color}12` : "#fff",
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{s.label}</div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                </div>
                <span className="text-xs font-semibold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pareto + Workload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-2">📈 Pareto front</div>
            <ParetoChart />
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-4">👥 Driver workload</div>
            {dummyDrivers.map((d, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <div className="text-xs text-gray-500 w-14">{d.name}</div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: d.color }} />
                </div>
                <div className="text-xs text-gray-400 w-8 text-right">{d.pct}%</div>
              </div>
            ))}
            <div className="text-xs text-gray-400 mt-2">ⓘ Balanced by NSGA-II fitness fn</div>
          </div>
        </div>

      </div>
    </div>
  );
}

