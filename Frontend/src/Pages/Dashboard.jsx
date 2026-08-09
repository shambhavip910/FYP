import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../images/logo.png";
import Sidebar from "./Sidebar";
import api from "../api";
import { canEditOperations, getRole } from "../auth";

const COLORS = ["#185FA5", "#639922", "#993C1D", "#7C3AED", "#0F766E"];

function projectPoints(depot, deliveries, width = 300, height = 200, pad = 24) {
  const pts = [
    { lat: depot.lat, lng: depot.lng },
    ...deliveries.map((d) => ({ lat: d.lat, lng: d.lng })),
  ];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);

  const toXY = (lat, lng) => ({
    x: pad + ((lng - minLng) / lngSpan) * (width - 2 * pad),
    y: pad + ((maxLat - lat) / latSpan) * (height - 2 * pad),
  });

  return { toXY };
}

function RouteMap({ depot, deliveries, routes, vehicles }) {
  if (!depot || !deliveries?.length) {
    return (
      <div className="h-[200px] rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-400">
        Run an optimization to see routes
      </div>
    );
  }

  const { toXY } = projectPoints(depot, deliveries);
  const depotXY = toXY(depot.lat, depot.lng);
  const byId = Object.fromEntries(deliveries.map((d) => [d.id, d]));

  return (
    <div style={{ background: "#dff0df", borderRadius: 8, height: 200, overflow: "hidden" }}>
      <svg width="100%" height="200" viewBox="0 0 300 200">
        <rect width="300" height="200" fill="#dff0df" />
        {(routes || []).map((route, ri) => {
          const color = COLORS[ri % COLORS.length];
          const coords = [
            depotXY,
            ...route.map((id) => {
              const d = byId[id];
              return d ? toXY(d.lat, d.lng) : depotXY;
            }),
            depotXY,
          ];
          const points = coords.map((c) => `${c.x},${c.y}`).join(" ");
          return (
            <g key={ri}>
              <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4,2" />
              {route.map((id) => {
                const d = byId[id];
                if (!d) return null;
                const p = toXY(d.lat, d.lng);
                return <circle key={`${ri}-${id}`} cx={p.x} cy={p.y} r="5" fill={color} stroke="white" strokeWidth="2" />;
              })}
            </g>
          );
        })}
        <circle cx={depotXY.x} cy={depotXY.y} r="7" fill="#185FA5" stroke="white" strokeWidth="2" />
        <text x={depotXY.x + 8} y={depotXY.y - 6} fontSize="9" fill="#0C447C" fontWeight="500">
          Depot
        </text>
        {(vehicles || []).map((v, i) => (
          <text key={v.id || i} x={8} y={16 + i * 12} fontSize="9" fill={COLORS[i % COLORS.length]}>
            {v.id || `V${i + 1}`}
          </text>
        ))}
      </svg>
    </div>
  );
}

function ParetoChart({ solutions, selectedIndex }) {
  if (!solutions?.length) {
    return <div className="h-[120px] flex items-center justify-center text-xs text-gray-400">No Pareto data</div>;
  }

  const fuels = solutions.map((s) => Number(s.fitness?.fuel_cost) || 0);
  const times = solutions.map((s) => Number(s.fitness?.delivery_time) || 0);
  const minF = Math.min(...fuels);
  const maxF = Math.max(...fuels);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);

  const points = solutions.map((s, i) => {
    const f = Number(s.fitness?.fuel_cost) || 0;
    const t = Number(s.fitness?.delivery_time) || 0;
    const x = 30 + ((t - minT) / Math.max(maxT - minT, 1e-6)) * 200;
    const y = 95 - ((f - minF) / Math.max(maxF - minF, 1e-6)) * 80;
    return { x, y, i };
  });

  const sorted = [...points].sort((a, b) => a.x - b.x);
  const polylineStr = sorted.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width="100%" height="120" viewBox="0 0 260 120">
      <line x1="25" y1="8" x2="25" y2="100" stroke="#ddd" strokeWidth="1" />
      <line x1="25" y1="100" x2="250" y2="100" stroke="#ddd" strokeWidth="1" />
      <text x="2" y="12" fontSize="9" fill="#888">Fuel</text>
      <text x="220" y="114" fontSize="9" fill="#888">Time →</text>
      <polyline points={polylineStr} fill="none" stroke="#185FA5" strokeWidth="1.5" strokeDasharray="3,2" />
      {points.map((p) => (
        <circle
          key={p.i}
          cx={p.x}
          cy={p.y}
          r={p.i === selectedIndex ? 6 : 4}
          fill={p.i === selectedIndex ? "#185FA5" : "#993C1D"}
          opacity={p.i === selectedIndex ? 1 : 0.7}
        />
      ))}
    </svg>
  );
}

function workloadBars(solution, vehicles) {
  const routes = solution?.route || [];
  const counts = routes.map((r) => r.length);
  const max = Math.max(...counts, 1);
  return routes.map((r, i) => ({
    name: vehicles?.[i]?.driverName || vehicles?.[i]?.id || `Driver ${i + 1}`,
    pct: Math.round((r.length / max) * 100),
    stops: r.length,
    color: COLORS[i % COLORS.length],
  }));
}

export default function Dashboard() {
  const [run, setRun] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const canEdit = canEditOperations(getRole());

  const loadLatest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/optimize/latest");
      const result = res.data.result;
      setRun(result);
      setSelectedIndex(result.selectedIndex ?? 0);
    } catch (err) {
      if (err.response?.status === 404) {
        setRun(null);
        setError("No optimization yet. Add deliveries and click Run optimization.");
      } else {
        setError("Could not load latest run. Is the Node backend running?");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  const solutions = run?.solutions || [];
  const selected = solutions[selectedIndex] || solutions[0];

  const metrics = useMemo(() => {
    if (!run || !selected) {
      return { totalStops: 0, totalVehicles: 0, fuelCost: 0, fuelSaved: 0, avgTime: 0, timeSaved: 0, paretoSols: 0 };
    }
    return {
      totalStops: run.stopsCount || 0,
      totalVehicles: run.vehicles?.length || 0,
      fuelCost: run.fuelCost || Math.round(selected.fitness?.fuel_cost || 0),
      fuelSaved: run.fuelSaved || 0,
      avgTime: run.deliveryTime || Math.round((selected.fitness?.delivery_time || 0) * 60),
      timeSaved: run.timeSaved || 0,
      paretoSols: run.paretoCount || solutions.length,
    };
  }, [run, selected, solutions.length]);

  const drivers = useMemo(
    () => workloadBars(selected, run?.vehicles),
    [selected, run]
  );

  async function handleSelect(index) {
    setSelectedIndex(index);
    if (!canEdit || !run?._id) return;
    setSaving(true);
    try {
      const res = await api.put(`/api/optimize/${run._id}/select`, { selectedIndex: index });
      setRun(res.data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] text-gray-500 text-sm">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <div className="p-4">
        <Sidebar />
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl mb-4 shadow-sm">
          <div className="flex items-center gap-2 font-medium text-sm">
            <img src={logo} alt="logo" className="w-7 h-7 object-contain" />
            <span className="text-[#1e3a5f] font-bold">Smart Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-md bg-[#1a9e75]/10 text-[#1a9e75] font-medium">
              {run ? `NSGA-II · Run #${String(run.runId).padStart(3, "0")}` : "Awaiting run"}
            </span>
            {canEdit && (
              <Link
                to="/deliveries"
                className="text-xs px-3 py-1.5 rounded-lg border border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
              >
                Manage deliveries
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-amber-50 text-amber-800 border border-amber-100">
            {error}{" "}
            {canEdit && (
              <Link to="/deliveries" className="underline font-medium">
                Go to Deliveries
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total stops", value: metrics.totalStops, sub: `${metrics.totalVehicles} vehicles` },
            { label: "Fuel cost", value: `₹${Number(metrics.fuelCost).toLocaleString()}`, sub: `↓ ${metrics.fuelSaved}% vs worst Pareto` },
            { label: "Delivery time", value: `${metrics.avgTime} min`, sub: `↓ ${metrics.timeSaved} min vs worst` },
            { label: "Pareto sols", value: metrics.paretoSols, sub: "trade-offs" },
          ].map((m, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">{m.label}</div>
              <div className="text-xl font-semibold text-[#1e3a5f]">{m.value}</div>
              <div className="text-xs text-gray-400 mt-1">{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-4 mb-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-3">Route map</div>
            <RouteMap
              depot={run?.depot}
              deliveries={run?.deliveries}
              routes={selected?.route}
              vehicles={run?.vehicles}
            />
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-3">
              Select solution {saving ? "(saving…)" : ""}
            </div>
            {!solutions.length && (
              <p className="text-xs text-gray-400">No solutions available.</p>
            )}
            {solutions.slice(0, 8).map((s, i) => {
              const color = COLORS[i % COLORS.length];
              const stops = (s.route || []).reduce((a, r) => a + r.length, 0);
              return (
                <div
                  key={s.label || i}
                  onClick={() => handleSelect(i)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border mb-2 cursor-pointer transition"
                  style={{
                    border: selectedIndex === i ? `1.5px solid ${color}` : "1px solid #e5e7eb",
                    background: selectedIndex === i ? `${color}12` : "#fff",
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{s.label || `Solution ${i + 1}`}</div>
                    <div className="text-xs text-gray-400">
                      {stops} stops · workload {s.fitness?.workload_balance}
                    </div>
                  </div>
                  <span className="text-xs font-semibold" style={{ color }}>
                    ₹{Math.round(s.fitness?.fuel_cost || 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-2">Pareto front</div>
            <ParetoChart solutions={solutions} selectedIndex={selectedIndex} />
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-4">Driver workload</div>
            {drivers.length === 0 && (
              <p className="text-xs text-gray-400">No workload data.</p>
            )}
            {drivers.map((d, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <div className="text-xs text-gray-500 w-20 truncate">{d.name}</div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: d.color }} />
                </div>
                <div className="text-xs text-gray-400 w-12 text-right">{d.stops} stops</div>
              </div>
            ))}
            <div className="text-xs text-gray-400 mt-2">Balanced by NSGA-II workload objective</div>
          </div>
        </div>
      </div>
    </div>
  );
}
