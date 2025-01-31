import express from "express";
import { addFaculty } from "../controllers/adminController.js";
import { verifyRole } from "../middlewares/verifyRole.js";
import multer from "multer";
import path from "path";
import csvParser from "csv-parser";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import { transporter } from "../config/nodemailer.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    if (ext !== ".csv") {
      return cb(new Error("Only CSV files are allowed!"));
    }
    cb(null, true);
  },
});

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "raw", folder: "csv_uploads" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

const parseCsvFile = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = streamifier
      .createReadStream(buffer)
      .pipe(csvParser({ headers: false }))
      .on("data", (data) => {
        const row = Object.values(data);
        results.push(row);
      })
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

const router = express.Router();

router.post("/addFaculty", verifyRole("admin"), addFaculty);

router.post("/upload-batch", upload.single("csvFile"), async (req, res) => {
  const success = [];
  const error = [];

  try {
    const uploadResult = await uploadToCloudinary(req.file.buffer);
    console.log("File uploaded to Cloudinary:", uploadResult.url);

    const parsedData = await parseCsvFile(req.file.buffer);

    for (let i = 0; i < parsedData.length; i++) {
      const obj = {
        email: parsedData[i][0],
        name: parsedData[i][1],
        password: "12345678",
        role: "faculty",
        department: parsedData[i][2],
        id: parsedData[i][3],
      };

      const { email, name, password, role, department, id } = obj;

      if (!email || !name || !password || !role || !department || !id) {
        error.push({ location: email || `Row ${i+1}`, message: "Missing Attributes" });
        continue;
      }

      try {
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const user = new User({ name, email, password: hashedPassword, role });
          await user.save();

          const newFaculty = new Faculty({
            id,
            name,
            email,
            department,
          });
          await newFaculty.save();

          const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Welcome to EduSpace Portal - Faculty Registration Confirmation",
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
                <h2 style="color: #444; font-weight: bold;">Welcome to EduSpace!</h2>
                <p><strong>Dear ${name},</strong></p>
                <p><strong>We are pleased to inform you that you have been successfully added as a faculty member to the EduSpace portal.</strong></p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="http://localhost:3000/login" style="display: inline-block; padding: 10px 20px; font-size: 16px; font-weight: bold; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 4px;">Login to EduSpace</a>
                </div>
                <p><strong>If the button above doesn’t work, click the link below to log in:</strong></p>
                <p style="word-wrap: break-word; font-weight: bold; color: #007BFF;">http://localhost:3000/login</p>
                <p><strong>To get started, please use the following credentials:</strong></p>
                <ul style="list-style-type: none; padding-left: 0;">
                  <li><strong>Email:</strong> ${email}</li>
                  <li><strong>Temporary Password:</strong> ${password}</li>
                </ul>
                <p><strong>For security purposes, we recommend updating your password upon first login.</strong></p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
                <p style="font-size: 14px; color: #666;"><strong>Please do not reply to this email, as it is not monitored.</strong></p>
                <p style="font-size: 14px; color: #666;"><strong>Thank you,<br>EduSpace Team</strong></p>
              </div>
            `,
          };

          await transporter.sendMail(mailOptions);
          success.push(email);
        } else {
          error.push({ location:email, message: "User already exists." });
        }
      } catch (err) {
        console.error(`Error processing email ${email}:`, err);
        error.push({ location:email, message: "Error saving user: " + err.message });
      }
    }

    res.status(200).json({
      message: "File uploaded and parsed successfully!",
      cloudinaryUrl: uploadResult.url,
      success,
      error,
    });
  } catch (err) {
    console.error("Error uploading or parsing file:", err);
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
});


router.post("/upload-studentbatch",upload.single("csvFile"),async(req,res)=>{
  const success = [];
  const error = [];
  try{
    const uploadResult = await uploadToCloudinary(req.file.buffer);
    console.log("File uploaded to Cloudinary:", uploadResult.url);
    const parsedData = await parseCsvFile(req.file.buffer);
    const {batchName}=req.body;
    console.log(batchName);
    console.log(parsedData);
    for(let i=0;i<parsedData.length;i++){
      const obj={
        id:parsedData[i][0],
        name:parsedData[i][1],
        email:parsedData[i][2],
        password:"12345678",
        department:parsedData[i][3],
      };
      const {id,name,email,password,department}=obj;
      if(!id || !name || !email || !password || !department){
        error.push({ location: email || `Row ${i+1}`, message: "Missing Attributes" });
        continue;
      }

    }
    res.status(200).json({
      message: "File uploaded and parsed successfully!",
      cloudinaryUrl: uploadResult.url,
      success,
      error,
    });
  }
  catch (error) {
    res.status(500).json({ success: false, message: "Failed to upload batch." });
}
})

export default router;
