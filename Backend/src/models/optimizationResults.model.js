const mongoose = require('mongoose')

const solutionSchema = new mongoose.Schema({
    label: { type: String },
    route: { type: [[Number]], default: [] },
    fitness: {
        fuel_cost: { type: Number },
        delivery_time: { type: Number },
        workload_balance: { type: Number },
    },
}, { _id: false })

const deliverySnapshotSchema = new mongoose.Schema({
    id: { type: Number },
    mongoId: { type: String },
    customerName: { type: String },
    location: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    demand: { type: Number },
    predictedDemand: { type: Number },
    predictedOrders: { type: Number },
    predictedDeliveryTimeMinutes: { type: Number },
    demandSource: { type: String },
    timeWindow: { type: String },
}, { _id: false })

const vehicleSnapshotSchema = new mongoose.Schema({
    id: { type: String },
    mongoId: { type: String },
    capacity: { type: Number },
    fuelRate: { type: Number },
    maxDistance: { type: Number },
    driverName: { type: String },
}, { _id: false })

const optimizationSchema = new mongoose.Schema({
    runId: { type: Number },
    date: { type: Date, default: Date.now },
    stopsCount: { type: Number },
    solutionChosen: { type: String },
    selectedIndex: { type: Number, default: 0 },
    fuelCost: { type: Number },
    deliveryTime: { type: Number },
    fuelSaved: { type: Number },
    timeSaved: { type: Number },
    moneySaved: { type: Number },
    workloadScore: { type: String },
    status: {
        type: String,
        enum: ['Completed', 'Partial'],
        default: 'Completed',
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vehicle',
    },
    depot: {
        lat: { type: Number },
        lng: { type: Number },
    },
    solutions: { type: [solutionSchema], default: [] },
    deliveries: { type: [deliverySnapshotSchema], default: [] },
    vehicles: { type: [vehicleSnapshotSchema], default: [] },
    paretoCount: { type: Number },
})

const optimizationModel = mongoose.model('optimization', optimizationSchema)

module.exports = optimizationModel
