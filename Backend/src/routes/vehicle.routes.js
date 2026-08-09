const express = require('express')
const vehicleController = require('../controllers/vehicle.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(authenticate)

router.get('/', authorize('admin', 'manager', 'driver'), vehicleController.getVehicle)
router.post('/create', authorize('admin', 'manager'), vehicleController.createVehicle)
router.put('/:id', authorize('admin', 'manager'), vehicleController.updateVehicle)
router.delete('/:id', authorize('admin', 'manager'), vehicleController.deleteVehicle)

module.exports = router
