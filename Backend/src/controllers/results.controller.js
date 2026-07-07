const optimizationModel=require('../models/optimizationResults.model')
const {Parser} =require('json2csv')
const parser=new Parser();

async function getResults(req,res){
    const result=await optimizationModel.find();
    res.status(200).json({
        message:"The Results are:",
        result
    })
}

async function getResultById(req,res){
    const result=await optimizationModel.findById(req.params.id);
    res.status(200).json({
        message:"The Results are:",
        result
    })
}

async function deleteResult(req,res){
    const result=await optimizationModel.findByIdAndDelete(req.params.id);
     res.status(200).json({
        message:"Deleted Successfully",
    })
} 

async function getStats(req,res){
    const stats=await optimizationModel.aggregate([
        {
            $group:{
                _id:null,
                "totalRuns": {$sum:1},
                "avgFuelSaved": {$avg:"$fuelSaved"},
                "avgTimeSaved": {$avg:"$timeSaved"},
                "totalMoneySaved": {$sum:"$moneySaved"}
            }
        }
    ])
    res.status(200).json({
        message:"The Stats are:",
        stats
    })
}

async function exportCSV(req,res){
    const result=await optimizationModel.find();
    const csv=parser.parse(result);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
    res.send(csv)
}

module.exports={getStats,getResults,getResultById,deleteResult,exportCSV}