const express=require('express');

const resultsController=require('../controllers/results.controller')
const router=express.Router();

router.get('/',resultsController.getResults)
router.get('/stats',resultsController.getStats)
router.get('/export',resultsController.exportCSV)
router.get('/:id',resultsController.getResultById)
router.delete('/:id',resultsController.deleteResult)

module.exports=router;