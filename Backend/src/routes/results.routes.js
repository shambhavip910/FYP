const express = require('express')
const resultsController = require('../controllers/results.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(authenticate)

router.get('/', authorize('admin', 'manager', 'driver'), resultsController.getResults)
router.get('/stats', authorize('admin', 'manager', 'driver'), resultsController.getStats)
router.get('/export', authorize('admin', 'manager'), resultsController.exportCSV)
router.get('/:id', authorize('admin', 'manager', 'driver'), resultsController.getResultById)
router.delete('/:id', authorize('admin', 'manager'), resultsController.deleteResult)

module.exports = router
