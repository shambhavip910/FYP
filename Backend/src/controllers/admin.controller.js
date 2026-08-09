const userModel=require('../models/user.model')

async function getUsers(req,res){
    const users=await userModel.find();
    res.status(200).json({
        message:"All User Details:",
        users
    })
}

async function updateRole(req,res){
    const user=await userModel.findByIdAndUpdate(req.params.id,{role:req.body.role},{new:true});
     res.status(200).json({
        message:"User Updated Successfully",
    })
}

async function deleteUser(req,res) {
    const user=await userModel.findByIdAndDelete(req.params.id);
     res.status(200).json({
        message:"User Deleted Successfully",
    })
}

async function getStats(req,res){
    const totalUsers=await userModel.countDocuments();
    const driversCount=await userModel.countDocuments({role:'driver'});
    const managersCount=await userModel.countDocuments({role:'manager'});
    const adminsCount=await userModel.countDocuments({role:'admin'});
    res.status(200).json({
        totalUsers,
        driversCount,
        managersCount,
        adminsCount
    });
}

module.exports={getUsers,updateRole,deleteUser,getStats};