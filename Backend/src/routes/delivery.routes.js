const express=require('express')

const deliveryController=require('../controllers/delivery.controller')

const router=express.Router();

router.post('/create',deliveryController.createdelivery)
router.get('/',deliveryController.getdelivery)
router.put('/:id',deliveryController.updatedelivery)
router.delete('/:id',deliveryController.deletedelivery)

module.exports=router;