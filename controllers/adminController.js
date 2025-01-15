import User from "../models/User.js";
import Faculty from "../models/Faculty.js";
import bcrypt from "bcryptjs";
export const addFaculty = async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "faculty", 
    });
    await newUser.save();
    const newFaculty = new Faculty({
      name,
      email,
      department,
    });
    await newFaculty.save();

    res.status(201).json({success:true,message: "Faculty added successfully." });
  } catch (error) {
    res.status(500).json({success:false,message: "Server error." });
  }
};
