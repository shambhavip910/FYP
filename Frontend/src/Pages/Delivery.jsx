import React from 'react'
import logo from '../images/logo.png'
import Sidebar from './Sidebar'

const Delivery = () => {
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
            <span className="text-[#1e3a5f] font-bold text-sm">Delivery Management</span>
          </div>
          <button className="border border-[#1e3a5f] text-[#1e3a5f] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#1e3a5f]/5 transition">
            + Run optimization
          </button>
        </div>

        <div className="flex flex-col gap-4">

          {/* Top two cards */}
          <div className="flex gap-4 flex-col md:flex-row">

            {/* Add delivery location */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex-1 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1e3a5f] mb-4">📍 Add delivery location</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500">Customer name</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="Rahul Sharma" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Location</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="Civil Lines, P" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500">Latitude</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="25.435" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Longitude</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="81.846" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Demand (units)</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500">Time window</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="10:00 - 14:00" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Assign vehicle</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition bg-white">
                    <option>Vehicle 1</option>
                    <option>Vehicle 2</option>
                    <option>Vehicle 3</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="bg-[#1e3a5f] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162d4a] transition">Add stop</button>
                <button className="border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition">Clear</button>
              </div>
            </div>

            {/* Vehicle configuration */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 w-full md:w-72 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1e3a5f] mb-4">🚛 Vehicle configuration</h2>
              <div className="mb-3">
                <label className="text-xs text-gray-500">Vehicle ID</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="V-001" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500">Capacity (units)</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="20" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Fuel rate (₹/km)</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="8" />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500">Driver name</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="Ramesh Kumar" />
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500">Max distance (km)</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="80" />
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-500">Depot location</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition" placeholder="Civil Lines depot, Prayagraj" />
              </div>
              <button className="w-full bg-[#1e3a5f] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162d4a] transition">
                Save vehicle
              </button>
            </div>

          </div>

          {/* Delivery queue */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm overflow-x-auto">
            <h2 className="text-sm font-semibold text-[#1e3a5f] mb-4">≡ Current delivery queue</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b text-xs">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Demand</th>
                  <th className="pb-2 font-medium">Time window</th>
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, name: "Rahul Sharma", loc: "Civil Lines", demand: 3, time: "10:00-14:00", vehicle: "V-001", status: "Queued", statusColor: "bg-[#1a9e75]/10 text-[#1a9e75]" },
                  { id: 2, name: "Priya Singh", loc: "Allahpur", demand: 5, time: "11:00-15:00", vehicle: "V-002", status: "Queued", statusColor: "bg-[#1a9e75]/10 text-[#1a9e75]" },
                  { id: 3, name: "Amit Gupta", loc: "Naini", demand: 2, time: "09:00-12:00", vehicle: "V-001", status: "Pending", statusColor: "bg-amber-100 text-amber-700" },
                  { id: 4, name: "Sunita Verma", loc: "Phaphamau", demand: 4, time: "13:00-17:00", vehicle: "V-003", status: "Queued", statusColor: "bg-[#1a9e75]/10 text-[#1a9e75]" },
                ].map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="py-3 text-gray-400">{row.id}</td>
                    <td className="py-3 font-medium text-gray-800">{row.name}</td>
                    <td className="py-3 text-gray-500">{row.loc}</td>
                    <td className="py-3 text-gray-500">{row.demand}</td>
                    <td className="py-3 text-gray-500">{row.time}</td>
                    <td className="py-3 text-gray-500">{row.vehicle}</td>
                    <td className="py-3">
                      <span className={`${row.statusColor} px-2 py-0.5 rounded-full text-xs font-medium`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Delivery