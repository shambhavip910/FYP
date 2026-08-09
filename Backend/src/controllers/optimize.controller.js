const axios = require('axios')
const deliveryModel = require('../models/delivery.model')
const vehicleModel = require('../models/vehicle.model')
const optimizationModel = require('../models/optimizationResults.model')

const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://localhost:5000'
const DEPOT_LAT = Number(process.env.DEPOT_LAT || 25.4358)
const DEPOT_LNG = Number(process.env.DEPOT_LNG || 81.8463)

const optimizer = axios.create({
    baseURL: OPTIMIZER_URL,
    timeout: 180000,
})

function normalizeTimeWindow(tw) {
    if (!tw) return '09:00-17:00'
    return String(tw).replace(/\s+/g, '').replace('–', '-')
}

function pickBalancedIndex(solutions) {
    if (!solutions.length) return 0
    const norms = solutions.map((s) => {
        const f = s.fitness || {}
        return {
            fuel: Number(f.fuel_cost) || 0,
            time: Number(f.delivery_time) || 0,
            work: Number(f.workload_balance) || 0,
        }
    })
    const maxFuel = Math.max(...norms.map((n) => n.fuel), 1)
    const maxTime = Math.max(...norms.map((n) => n.time), 1)
    const maxWork = Math.max(...norms.map((n) => n.work), 1)

    let bestIdx = 0
    let bestScore = Infinity
    norms.forEach((n, i) => {
        const score = (n.fuel / maxFuel) + (n.time / maxTime) + (n.work / maxWork)
        if (score < bestScore) {
            bestScore = score
            bestIdx = i
        }
    })
    return bestIdx
}

function labelForIndex(i) {
    return `Solution ${String.fromCharCode(65 + (i % 26))}`
}

function buildHistoryFields(solutions, selectedIndex, stopsCount) {
    const chosen = solutions[selectedIndex]
    const fuels = solutions.map((s) => Number(s.fitness.fuel_cost) || 0)
    const times = solutions.map((s) => Number(s.fitness.delivery_time) || 0)
    const baselineFuel = Math.max(...fuels)
    const baselineTime = Math.max(...times)
    const fuelCost = Number(chosen.fitness.fuel_cost) || 0
    const deliveryTimeHours = Number(chosen.fitness.delivery_time) || 0
    const deliveryTimeMin = Math.round(deliveryTimeHours * 60)
    const moneySaved = Math.max(0, Math.round(baselineFuel - fuelCost))
    const fuelSaved = baselineFuel > 0
        ? Math.round(((baselineFuel - fuelCost) / baselineFuel) * 100)
        : 0
    const timeSaved = Math.max(0, Math.round((baselineTime - deliveryTimeHours) * 60))
    const workload = Number(chosen.fitness.workload_balance) || 0

    return {
        stopsCount,
        solutionChosen: labelForIndex(selectedIndex),
        selectedIndex,
        fuelCost: Math.round(fuelCost),
        deliveryTime: deliveryTimeMin,
        fuelSaved,
        timeSaved,
        moneySaved,
        workloadScore: String(workload),
        status: 'Completed',
        paretoCount: solutions.length,
    }
}

async function runOptimization(req, res) {
    try {
        const statusFilter = req.body?.statusFilter || ['Queued', 'Pending']
        const useMlDemand = req.body?.useMlDemand !== false

        let deliveries = await deliveryModel.find({ status: { $in: statusFilter } })
        const vehicles = await vehicleModel.find()

        if (!deliveries.length) {
            // Re-run support: if queue is empty after a prior run, use all stops
            deliveries = await deliveryModel.find()
        }

        if (!deliveries.length) {
            return res.status(400).json({
                error: 'No deliveries found. Add delivery stops first.',
            })
        }
        if (!vehicles.length) {
            return res.status(400).json({
                error: 'No vehicles configured. Save at least one vehicle first.',
            })
        }

        const depot = {
            lat: Number(req.body?.depot?.lat ?? DEPOT_LAT),
            lng: Number(req.body?.depot?.lng ?? DEPOT_LNG),
        }

        const deliveryPayload = deliveries.map((d, index) => ({
            id: index + 1,
            mongoId: String(d._id),
            customerName: d.customerName,
            location: d.location,
            lat: d.latitude,
            lng: d.longitude,
            demand: useMlDemand ? 0 : (d.demand || 0),
            time_window: normalizeTimeWindow(d.timeWindow),
            historical_orders: Math.max(50, (d.demand || 3) * 80),
        }))

        let enriched
        try {
            const predictRes = await optimizer.post('/predict/batch', {
                depot,
                deliveries: deliveryPayload,
                context: req.body?.mlContext || {},
            })
            enriched = predictRes.data.deliveries
        } catch (err) {
            // Fallback without ML if predictor is unavailable
            enriched = deliveryPayload.map((d) => ({
                ...d,
                demand: Math.max(1, Number(d.demand) || Number(deliveries.find(
                    (x) => String(x._id) === d.mongoId
                )?.demand) || 1),
                predicted_demand: null,
                predicted_orders: null,
                predicted_delivery_time_minutes: null,
                demand_source: 'user',
            }))
        }

        // Prefer stored user demand unless explicitly forcing ML
        if (!useMlDemand) {
            enriched = enriched.map((e) => {
                const original = deliveries.find((d) => String(d._id) === e.mongoId)
                return {
                    ...e,
                    demand: Math.max(1, Number(original?.demand) || e.predicted_demand || 1),
                    demand_source: 'user',
                }
            })
        } else {
            // Hybrid: keep user demand when provided (>0), else ML
            enriched = enriched.map((e) => {
                const original = deliveries.find((d) => String(d._id) === e.mongoId)
                const userDemand = Number(original?.demand)
                if (userDemand > 0) {
                    return {
                        ...e,
                        demand: userDemand,
                        demand_source: 'user',
                    }
                }
                return e
            })
        }

        const optimizePayload = {
            depot,
            deliveries: enriched.map((e) => ({
                id: e.id,
                lat: e.lat,
                lng: e.lng,
                demand: e.demand,
                time_window: e.time_window || normalizeTimeWindow(
                    deliveries.find((d) => String(d._id) === e.mongoId)?.timeWindow
                ),
            })),
            vehicles: vehicles.map((v) => ({
                id: v.vehicleId || String(v._id),
                capacity: Number(v.capacity) || 20,
                fuel_rate: Number(v.fuelRate) || 8,
                max_distance: Number(v.maxDistance) || 80,
            })),
        }

        const optimizeRes = await optimizer.post('/optimize', optimizePayload)
        const rawSolutions = optimizeRes.data.solutions || []

        if (!rawSolutions.length) {
            return res.status(500).json({ error: 'Optimizer returned no solutions' })
        }

        const solutions = rawSolutions.map((s, i) => ({
            label: labelForIndex(i),
            route: s.route,
            fitness: s.fitness,
        }))

        const selectedIndex = pickBalancedIndex(solutions)
        const history = buildHistoryFields(solutions, selectedIndex, deliveries.length)
        const last = await optimizationModel.findOne().sort({ runId: -1 }).lean()
        const runId = (last?.runId || 0) + 1

        const record = await optimizationModel.create({
            runId,
            date: new Date(),
            ...history,
            depot,
            solutions,
            deliveries: enriched.map((e) => ({
                id: e.id,
                mongoId: e.mongoId,
                customerName: e.customerName,
                location: e.location,
                lat: e.lat,
                lng: e.lng,
                demand: e.demand,
                predictedDemand: e.predicted_demand,
                predictedOrders: e.predicted_orders,
                predictedDeliveryTimeMinutes: e.predicted_delivery_time_minutes,
                demandSource: e.demand_source,
                timeWindow: e.time_window,
            })),
            vehicles: vehicles.map((v) => ({
                id: v.vehicleId || String(v._id),
                mongoId: String(v._id),
                capacity: v.capacity,
                fuelRate: v.fuelRate,
                maxDistance: v.maxDistance,
                driverName: v.driverName,
            })),
        })

        await deliveryModel.updateMany(
            { _id: { $in: deliveries.map((d) => d._id) } },
            { $set: { status: 'Completed' } }
        )

        return res.status(200).json({
            message: 'Optimization completed',
            result: record,
        })
    } catch (err) {
        const detail = err.response?.data?.error || err.message
        console.error('Optimization failed:', detail)
        return res.status(502).json({
            error: 'Optimization failed',
            detail,
            hint: `Ensure the Flask optimizer is running at ${OPTIMIZER_URL}`,
        })
    }
}

async function getLatest(req, res) {
    const result = await optimizationModel.findOne().sort({ date: -1, runId: -1 })
    if (!result) {
        return res.status(404).json({ error: 'No optimization runs yet' })
    }
    return res.status(200).json({ result })
}

async function selectSolution(req, res) {
    const { id } = req.params
    const selectedIndex = Number(req.body?.selectedIndex)
    const result = await optimizationModel.findById(id)
    if (!result) {
        return res.status(404).json({ error: 'Run not found' })
    }
    if (
        Number.isNaN(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex >= result.solutions.length
    ) {
        return res.status(400).json({ error: 'Invalid selectedIndex' })
    }

    const history = buildHistoryFields(
        result.solutions,
        selectedIndex,
        result.stopsCount
    )
    Object.assign(result, history)
    await result.save()

    return res.status(200).json({
        message: 'Solution selected',
        result,
    })
}

module.exports = {
    runOptimization,
    getLatest,
    selectSolution,
}
