const vehicalModel=require('../models/vehicle.model')

async function createVehicle(req,res) {
    const{vehicleId,capacity,fuelRate,driverName,maxDistance, depotLocation}=req.body;

    const vehicle=await vehicalModel.create({
        vehicleId,capacity,fuelRate,driverName,maxDistance, depotLocation
    })

    res.status(201).json({
        message:"Vehicle Created Successfully",
        vehicle:{
            _id:vehicle._id,
            vehicleId:vehicle.vehicleId,
            capacity:vehicle.capacity,
            fuelRate:vehicle.fuelRate,
            driverName:vehicle.driverName,
            maxDistance:vehicle.maxDistance,
            depotLocation:vehicle.depotLocation
        }
    })
}

async function getVehicle(req,res) {
    const vehicleEntries=await vehicalModel.find();
    res.status(200).json({
        message:"Vehicle Entries Are:",
        vehicleEntries
    }) 
}

async function deleteVehicle(req,res){
    const vehicleId=req.params.id;
    await vehicalModel.findByIdAndDelete(vehicleId);
    res.status(200).json({
        message:"Vehicle Deleted Successfully"
    })
}

async function updateVehicle(req,res) {
    const vehicleId=req.params.id;
    await vehicalModel.findByIdAndUpdate(vehicleId,req.body,{new: true});
    res.status(200).json({
        message:"Vehicle Updated Successfully"
    })
}

module.exports={createVehicle,updateVehicle,getVehicle,deleteVehicle};