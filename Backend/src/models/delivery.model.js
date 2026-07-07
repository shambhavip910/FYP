const mongoose=require('mongoose')

const deliverySchema= new mongoose.Schema({
    customerName:{ type: String },
    location: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    demand: { type: Number },
    timeWindow: { type: String },
    vehicleId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'vehicle'
    },
    status:{
        type:String,
        enum: ['Queued', 'Pending', 'Completed'] , 
        default: 'Queued',
    },
    createdAt: Date
})

const deliveryModel=mongoose.model("delivery",deliverySchema);

module.exports=deliveryModel;