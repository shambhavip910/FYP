const userModel=require('../models/user.model');
const jwt=require('jsonwebtoken')
const bcrypt=require('bcryptjs')

async function registeruser(req,res) {
    const{fullname,email,password,role="manager"}=req.body;

    const isuserexist=await userModel.findOne({email});

    if(isuserexist){
        return res.status(409).json({message:"User Already Exist"})
    }
    const hash=await bcrypt.hash(password, 10);

    const user=await userModel.create({ 
        fullname,
        email,
        password:hash,
        role
    }) 
    const token= jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET)

    res.cookie("token",token);
    res.status(201).json({
        message:"user registered successfully",
        user:{
            id:user._id,
            fullname:user.fullname,
            email:user.email,
            role:user.role
        }
    })
};

async function loginuser(req, res) {
  const { email, password, role = "manager" } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.cookie("token", token);
  res.status(200).json({
    fullname: user.fullname,
    email: user.email,
    role: user.role,
  });
}
module.exports={registeruser,loginuser};