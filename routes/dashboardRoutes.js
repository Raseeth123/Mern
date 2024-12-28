import express from "express";
import { verifyRole } from "../middlewares/verifyRole.js";
const router=express.Router();
router.get("/admin-dashboard",verifyRole("admin"),(req,res)=>{
    res.json({success:true,message:"Welcome to the Admin dashboard!"});
});

router.get("/faculty-dashboard",verifyRole("faculty"),(req,res)=>{
    res.json({success:true,message:"Welcome to the Faculty dashboard!"});
});

router.get("/student-dashboard",verifyRole("student"),(req,res)=>{
    res.json({success:true,message:"Welcome to the Student dashboard!"});
});

export default router;