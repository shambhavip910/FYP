const express = require('express')
const optimizeController = require('../controllers/optimize.controller')

const router = express.Router()

router.post('/run', optimizeController.runOptimization)
router.get('/latest', optimizeController.getLatest)
router.put('/:id/select', optimizeController.selectSolution)

module.exports = router
