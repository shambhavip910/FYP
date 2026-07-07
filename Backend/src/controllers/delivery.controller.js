const deliveryModel=require('../models/delivery.model')

async function createdelivery(req,res){
    const {customerName, location, longitude, latitude , demand,  timeWindow, vehicleId,status}=req.body;

    const delivery=await deliveryModel.create({
        customerName, location, longitude, latitude , demand,  timeWindow, vehicleId,status
    })

    res.status(201).json({
        message:"delivery created successfully",
        user:{
            id:delivery._id,
            customerName:delivery.customerName,
            location:delivery.location,
            latitude :delivery.latitude ,
            longitude:delivery.longitude,
            demand:delivery.demand,
            timeWindow:delivery.timeWindow,
            vehicleId:delivery.vehicleId,
            status:delivery.status
        }
    })
}

async function getdelivery(req,res){
    const deliveryentries=await deliveryModel.find();
     res.status(200).json({
        message:"Delivery Entries are:",
         deliveryentries
    })
}

async function deletedelivery(req,res) {

    const deliveryid=req.params.id;
    await deliveryModel.findByIdAndDelete(deliveryid);
    res.send("Deleted Successfully");
}

async function updatedelivery(req,res) {

    const deliveryid=req.params.id;
    const deliverytoupdate=await deliveryModel.findOneAndUpdate({_id:deliveryid},req.body,{new:true});
    res.send("Updated Successfully")
}


module.exports={createdelivery,getdelivery,updatedelivery,deletedelivery};