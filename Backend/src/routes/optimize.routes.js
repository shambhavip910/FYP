const express = require('express')
const optimizeController = require('../controllers/optimize.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(authenticate)

router.post('/run', authorize('admin', 'manager'), optimizeController.runOptimization)
router.get('/latest', authorize('admin', 'manager', 'driver'), optimizeController.getLatest)
router.put('/:id/select', authorize('admin', 'manager'), optimizeController.selectSolution)

module.exports = router
