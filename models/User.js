import mongoose from "mongoose";

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
},{
    timestamps:true
});

const User=mongoose.model("User",userSchema);
export default User;