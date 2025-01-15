import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { transporter } from "../config/nodemailer.js";
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
        res.status(500).json({success:false,error:"Error logging in user"});
    }
}

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({success:false,message: "User not found." });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 600000; 
    await user.save();
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `Click to reset password: ${resetURL}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({success:true,message: "Reset email sent." });
  } catch (error) {
    res.status(500).json({success:false,message: "Error sending email." });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({success:false,message: "Invalid token."});

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({success:true,message: "Password reset successful."});
  } catch (error) {
    res.status(500).json({success:false,message: "Error resetting password."});
  }
};
