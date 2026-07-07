const express=require('express');
const adminController=require('../controllers/admin.controller')

const router=express.Router();

router.get('/users',adminController.getUsers)
router.get('/stats',adminController.getStats)
router.put('/user/:id',adminController.updateRole)
router.delete('/user/:id',adminController.deleteUser)

module.exports=router;