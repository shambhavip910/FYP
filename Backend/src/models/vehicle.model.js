const mongoose=require('mongoose')

const vehicleSchema=new mongoose.Schema({
    vehicleId: { type:String}, 
    capacity: { type:Number},
    fuelRate: { type:Number},
    driverName: { type:String},
    maxDistance: { type:Number},
    depotLocation: { type:String}
})

const vehicleModel=mongoose.model("vehicle",vehicleSchema);

module.exports=vehicleModel;