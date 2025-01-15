import mongoose from "mongoose";
import crypto from "crypto";
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        requires:true
    },
    email:{
        type:String,
        unique:true,
        requires:true
    },
    password:{
        type:String,
        requires:true
    },
    role:{
        type:String,
        enum:["admin","faculty","student"],
        default:"student"
    },
    resetPasswordToken:{
        type:String,
    },
    resetPasswordExpires:{
        type:Date,
    },
},{
    timestamps:true
});

const User=mongoose.model("User",userSchema);
export default User;

