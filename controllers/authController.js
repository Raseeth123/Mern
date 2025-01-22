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
      subject: "Reset Your Password - EduSpace",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #444; font-weight: bold;">Password Reset Request</h2>
          <p><strong>Dear User,</strong></p>
          <p><strong>We received a request to reset the password for your account. If you made this request, please click the button below to reset your password:</strong></p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetURL}" style="display: inline-block; padding: 10px 20px; font-size: 16px; font-weight: bold; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 4px;">Reset Password</a>
          </div>
          <p><strong>If the button above doesn’t work, click the link below:</strong></p>
          <p style="word-wrap: break-word; font-weight: bold; color: #007BFF;">${resetURL}</p>
          <p><strong>If you did not request this password reset, please ignore this email. This link will expire shortly for your security.</strong></p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666;"><strong>Please do not reply to this email, as it is not monitored.</strong></p>
          <p style="font-size: 14px; color: #666;"><strong>Thank you,<br>EduSpace Team</strong></p>
        </div>
      `,
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
    if (!user) return res.status(400).json({success:false,message: "Invalid token "});

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
