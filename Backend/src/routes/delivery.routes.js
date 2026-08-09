const express = require('express')
const deliveryController = require('../controllers/delivery.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(authenticate)

router.get('/', authorize('admin', 'manager', 'driver'), deliveryController.getdelivery)
router.post('/create', authorize('admin', 'manager'), deliveryController.createdelivery)
router.put('/:id', authorize('admin', 'manager'), deliveryController.updatedelivery)
router.delete('/:id', authorize('admin', 'manager'), deliveryController.deletedelivery)

module.exports = router
