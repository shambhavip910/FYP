import { useState, useEffect } from "react";
import logo from "../images/logo.png";
import Sidebar from "./Sidebar";
import api from "../api";

export default function ResultsHistory() {
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [resResults, resStats] = await Promise.all([
        api.get("/api/result"),
        api.get("/api/result/stats"),
      ]);
      setResults(resResults.data.result || []);
      setStats(resStats.data.stats?.[0] || null);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    window.location.href = "http://localhost:3000/api/result/export";
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/api/result/${id}`);
      setResults((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatRunId(id) {
    return `#${String(id).padStart(3, "0")}`;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      {/* Sidebar */}
      <div className="p-4">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 p-4">
        {/* Topbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl mb-4 shadow-sm">
          <div className="flex items-center gap-2">
            <img src={logo} alt="logo" className="w-7 h-7 object-contain" />
            <span className="text-[#1e3a5f] font-bold text-sm">
              Results & History
            </span>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-[#1e3a5f] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162d4a] transition"
          >
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total runs", value: stats?.totalRuns ?? 0, sub: "all time" },
            {
              label: "Avg fuel saved",
              value: `${Math.round(stats?.avgFuelSaved || 0)}%`,
              sub: "vs baseline",
            },
            {
              label: "Avg time saved",
              value: `${Math.round(stats?.avgTimeSaved || 0)} min`,
              sub: "per run",
            },
            {
              label: "Total ₹ saved",
              value: `₹${Math.round(stats?.totalMoneySaved || 0)}`,
              sub: "cumulative",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
            >
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className="text-xl font-semibold text-[#1e3a5f]">
                {s.value}
              </div>
              <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* History table */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm overflow-x-auto mb-4">
          <h3 className="text-sm font-semibold text-[#1e3a5f] mb-4">
            Optimization run history
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-2 font-medium">Run ID</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Stops</th>
                <th className="pb-2 font-medium">Solution chosen</th>
                <th className="pb-2 font-medium">Fuel cost</th>
                <th className="pb-2 font-medium">Delivery time</th>
                <th className="pb-2 font-medium">Workload</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-400">
                    No runs yet. Optimize from the Deliveries page.
                  </td>
                </tr>
              )}
              {results.map((run) => (
                <tr
                  key={run._id}
                  className="border-b last:border-0 hover:bg-gray-50 transition"
                >
                  <td className="py-3 text-gray-500">
                    {formatRunId(run.runId)}
                  </td>
                  <td className="py-3 text-gray-500">{formatDate(run.date)}</td>
                  <td className="py-3 text-gray-500">{run.stopsCount}</td>
                  <td className="py-3 font-medium text-gray-800">
                    {run.solutionChosen}
                  </td>
                  <td className="py-3 text-gray-500">₹{run.fuelCost}</td>
                  <td className="py-3 text-gray-500">{run.deliveryTime} min</td>
                  <td className="py-3 text-gray-500">{run.workloadScore}</td>
                  <td className="py-3">
                    <span className="bg-[#1a9e75]/10 text-[#1a9e75] text-xs font-medium px-2 py-0.5 rounded-full">
                      {run.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(run._id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm h-48 flex items-center justify-center">
            <p className="text-xs text-gray-400">
              Fuel cost trend — chart here
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm h-48 flex items-center justify-center">
            <p className="text-xs text-gray-400">
              Time saved per run — chart here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
