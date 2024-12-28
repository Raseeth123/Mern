import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const register=async(req,res)=>{
    const {name,email,password,role}=req.body;
    try{
        const existingUser=await User.findOne({email});
        if(existingUser) return res.status(400).json({success:false,message:"Email already exists"});
        const hashedPassword=await bcrypt.hash(password,10);
        const user=new User({name,email,password:hashedPassword,role});
        await user.save();
        res.status(201).json({success:true,message:"User Registered Successfully"});
    }
    catch(error){
        res.status(500).json({success:false,message:error.message});
    }
}

export const login=async(req,res)=>{
    const {email,password}=req.body;
    try{
        const user=await User.findOne({email});
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});
        const isPasswordValid=await bcrypt.compare(password,user.password);
        if(!isPasswordValid) return res.status(400).json({success:false,message:"Invalid Credentials"});
        const token=jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{
            expiresIn:"1h",
        });
        res.status(200).json({success:true,message:token});
    }
    catch(error){
        res.status(500).json({error:"Error logging in user"});
    }
}