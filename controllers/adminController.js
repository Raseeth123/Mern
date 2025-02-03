import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import bcrypt from "bcryptjs";
import { transporter } from "../config/nodemailer.js";
export const addFaculty = async (req, res) => {
  const {id,name, email, department } = req.body;

  if (!id || !name || !email || !department) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const existingUser = await User.findOne({ email });
    const existingFaculty = await Faculty.findOne({ $or: [{ email }, { id }] });
    if (existingUser) {
      return res.status(400).json({success:true,message: "Email is already in use." });
    }
    else if(existingFaculty){
      return res.status(400).json({success:true,message: "Faculty Id or Email is already present." });
    }
    const hashedPassword = await bcrypt.hash("12345678", 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "faculty", 
    });
    await newUser.save();
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
          <p><strong>Your EduSpace account is ready for use, and you can now access the platform to manage your courses, interact with students, and leverage all available tools designed to enhance your teaching experience.</strong></p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="http://localhost:3000/login" style="display: inline-block; padding: 10px 20px; font-size: 16px; font-weight: bold; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 4px;">Login to EduSpace</a>
          </div>
          <p><strong>If the button above doesn’t work, click the link below to log in:</strong></p>
          <p style="word-wrap: break-word; font-weight: bold; color: #007BFF;">http://localhost:3000/login</p>
          <p><strong>To get started, please use the following credentials:</strong></p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Temporary Password:</strong>12345678</li>
          </ul>
          <p><strong>For security purposes, we recommend updating your password upon first login.</strong></p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666;"><strong>Please do not reply to this email, as it is not monitored.</strong></p>
          <p style="font-size: 14px; color: #666;"><strong>Thank you,<br>EduSpace Team</strong></p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    res.status(201).json({success:true,message: "Faculty added successfully." });
  } catch (error) {
    res.status(500).json({success:false,message: "Server error." });
  }
};
