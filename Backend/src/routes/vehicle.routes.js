const express=require('express')
const vehicleController=require('../controllers/vehicle.controller')

const router=express.Router();

router.get("/",vehicleController.getVehicle)
router.post("/create",vehicleController.createVehicle)
router.put("/:id",vehicleController.updateVehicle)
router.delete("/:id",vehicleController.deleteVehicle)

module.exports=router;