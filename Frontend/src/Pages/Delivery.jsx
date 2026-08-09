import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../images/logo.png'
import Sidebar from './Sidebar'
import api from '../api'

const emptyDelivery = {
  customerName: '',
  location: '',
  latitude: '',
  longitude: '',
  demand: '',
  timeWindow: '10:00-14:00',
  vehicleId: '',
}

const emptyVehicle = {
  vehicleId: '',
  capacity: '20',
  fuelRate: '8',
  driverName: '',
  maxDistance: '80',
  depotLocation: 'Civil Lines depot, Prayagraj',
}

const statusColor = (status) =>
  status === 'Completed'
    ? 'bg-blue-100 text-blue-700'
    : status === 'Pending'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-[#1a9e75]/10 text-[#1a9e75]'

const Delivery = () => {
  const navigate = useNavigate()
  const [deliveries, setDeliveries] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState(emptyDelivery)
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [dRes, vRes] = await Promise.all([
        api.get('/api/delivery'),
        api.get('/api/vehicle'),
      ])
      setDeliveries(dRes.data.deliveryentries || [])
      setVehicles(vRes.data.vehicleEntries || [])
    } catch (err) {
      setError('Failed to load deliveries/vehicles. Is the Node backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const vehicleLabel = (id) => {
    if (!id) return '—'
    const v = vehicles.find((x) => String(x._id) === String(id))
    return v?.vehicleId || '—'
  }

  async function handleAddDelivery(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      await api.post('/api/delivery/create', {
        customerName: form.customerName,
        location: form.location,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        demand: Number(form.demand) || 0,
        timeWindow: form.timeWindow,
        vehicleId: form.vehicleId || undefined,
        status: 'Queued',
      })
      setForm(emptyDelivery)
      setMessage('Delivery stop added.')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add delivery.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveVehicle(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      await api.post('/api/vehicle/create', {
        vehicleId: vehicleForm.vehicleId,
        capacity: Number(vehicleForm.capacity),
        fuelRate: Number(vehicleForm.fuelRate),
        driverName: vehicleForm.driverName,
        maxDistance: Number(vehicleForm.maxDistance),
        depotLocation: vehicleForm.depotLocation,
      })
      setVehicleForm(emptyVehicle)
      setMessage('Vehicle saved.')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save vehicle.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteDelivery(id) {
    try {
      await api.delete(`/api/delivery/${id}`)
      await loadData()
    } catch (err) {
      setError('Delete failed.')
    }
  }

  async function handleRunOptimization() {
    setError('')
    setMessage('')
    setOptimizing(true)
    try {
      const res = await api.post('/api/optimize/run', { useMlDemand: true })
      setMessage(
        `Optimization complete — ${res.data.result?.paretoCount || 0} Pareto solutions. Opening dashboard…`
      )
      await loadData()
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          'Optimization failed. Start Flask on :5000 and Node on :3000.'
      )
    } finally {
      setOptimizing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] text-gray-500 text-sm">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <div className="p-4">
        <Sidebar />
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl mb-4 shadow-sm">
          <div className="flex items-center gap-2">
            <img src={logo} alt="logo" className="w-7 h-7 object-contain" />
            <span className="text-[#1e3a5f] font-bold text-sm">Delivery Management</span>
          </div>
          <button
            onClick={handleRunOptimization}
            disabled={optimizing}
            className="border border-[#1e3a5f] text-[#1e3a5f] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#1e3a5f]/5 transition disabled:opacity-50"
          >
            {optimizing ? 'Running NSGA-II…' : '+ Run optimization'}
          </button>
        </div>

        {(message || error) && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <form
              onSubmit={handleAddDelivery}
              className="bg-white rounded-xl border border-gray-100 p-5 flex-1 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-[#1e3a5f] mb-4">Add delivery location</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500">Customer name</label>
                  <input
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="Rahul Sharma"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Location</label>
                  <input
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="Civil Lines"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500">Latitude</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="25.435"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Longitude</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="81.846"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Demand (0 = use ML)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.demand}
                    onChange={(e) => setForm({ ...form, demand: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="3"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500">Time window</label>
                  <input
                    required
                    value={form.timeWindow}
                    onChange={(e) => setForm({ ...form, timeWindow: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="10:00-14:00"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Assign vehicle (optional)</label>
                  <select
                    value={form.vehicleId}
                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
                  >
                    <option value="">Auto (NSGA-II)</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.vehicleId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#1e3a5f] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162d4a] transition disabled:opacity-50"
                >
                  Add stop
                </button>
                <button
                  type="button"
                  onClick={() => setForm(emptyDelivery)}
                  className="border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition"
                >
                  Clear
                </button>
              </div>
            </form>

            <form
              onSubmit={handleSaveVehicle}
              className="bg-white rounded-xl border border-gray-100 p-5 w-full md:w-72 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-[#1e3a5f] mb-4">Vehicle configuration</h2>
              <div className="mb-3">
                <label className="text-xs text-gray-500">Vehicle ID</label>
                <input
                  required
                  value={vehicleForm.vehicleId}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="V-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500">Capacity</label>
                  <input
                    required
                    type="number"
                    value={vehicleForm.capacity}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Fuel ₹/km</label>
                  <input
                    required
                    type="number"
                    value={vehicleForm.fuelRate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, fuelRate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500">Driver name</label>
                <input
                  value={vehicleForm.driverName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder="Ramesh Kumar"
                />
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500">Max distance (km)</label>
                <input
                  required
                  type="number"
                  value={vehicleForm.maxDistance}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, maxDistance: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-500">Depot location</label>
                <input
                  value={vehicleForm.depotLocation}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, depotLocation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#1e3a5f] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#162d4a] transition disabled:opacity-50"
              >
                Save vehicle
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm overflow-x-auto">
            <h2 className="text-sm font-semibold text-[#1e3a5f] mb-4">
              Current delivery queue ({deliveries.length})
            </h2>
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
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-400">
                      No deliveries yet. Add stops above, then run optimization.
                    </td>
                  </tr>
                )}
                {deliveries.map((row, idx) => (
                  <tr key={row._id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="py-3 text-gray-400">{idx + 1}</td>
                    <td className="py-3 font-medium text-gray-800">{row.customerName}</td>
                    <td className="py-3 text-gray-500">{row.location}</td>
                    <td className="py-3 text-gray-500">{row.demand ?? 0}</td>
                    <td className="py-3 text-gray-500">{row.timeWindow}</td>
                    <td className="py-3 text-gray-500">{vehicleLabel(row.vehicleId)}</td>
                    <td className="py-3">
                      <span className={`${statusColor(row.status)} px-2 py-0.5 rounded-full text-xs font-medium`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDeleteDelivery(row._id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
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
