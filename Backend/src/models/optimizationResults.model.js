const mongoose=require('mongoose')

const optimizationSchema=new mongoose.Schema({
    runId:{type:Number},
    date:{type:Date}, 
    stopsCount:{type:Number}, 
    solutionChosen:{type:String},
    fuelCost:{type:Number}, 
    deliveryTime:{type:Number},
    fuelSaved: { type: Number },
    timeSaved: { type: Number },
    moneySaved: { type: Number },
    workloadScore:{type:String}, 
    status:{
        type:String,
        enum:['Completed','Partial'],
        default:'Partial'
    }, 
    vehicleId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'vehicle'
    }

})

const optimizationModel=mongoose.model("optimization",optimizationSchema)

module.exports=optimizationModel;

