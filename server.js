import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();
const app=express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
const PORT=process.env.PORT||5000;
app.listen(PORT,()=>{
    connectDB();
    console.log('server started at http://localhost:'+PORT);
})


