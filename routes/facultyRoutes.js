import express from "express";
import { verifyRole } from "../middlewares/verifyRole.js";
import { transporter } from "../config/nodemailer.js";
import Course from "../models/Course.js";
import User from "../models/User.js"; 

const router = express.Router();

router.post("/create-course", verifyRole("faculty"), async (req, res) => {
  const { title, description, department } = req.body;
  const facultyId = req.user.id;

  try {
    if (!title || !description || !department) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    const course = new Course({
      title,
      description,
      department,
      faculty: facultyId,
    });

    await course.save();
    res.status(201).json({ success: true, message: "Course created successfully.", course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create course.", error: error.message });
  }
});

router.get("/my-courses", verifyRole("faculty"), async (req, res) => {
  try {
    const courses = await Course.find({ faculty: req.user.id });
    res.status(200).json({ success: true, courses });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Failed to fetch courses.", error: error.message });
  }
});


router.get("/course/:courseId", verifyRole("faculty"), async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId).populate("students", "name email");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    if (course.faculty.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized access to the course" });
    }

    res.status(200).json({ success: true, course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch course details", error: error.message });
  }
});

router.post("/course/:courseId/add-student", verifyRole("faculty"), async (req, res) => {
  const { courseId } = req.params;
  const { email } = req.body; // Expecting an array of emails
  const errors = [];
  const addedStudents = [];

  for (const e of email) {
    try {
      const student = await User.findOne({ email: e.trim() });
      if (!student || student.role !== "student") {
        errors.push({ email: e, message: "Student not found or invalid role" });
        continue;
      }

      const course = await Course.findById(courseId);
      if (!course) {
        errors.push({ email: e, message: "Course not found" });
        continue;
      }

      if (course.students.includes(student._id)) {
        errors.push({ email: e, message: "Student is already enrolled in this course" });
        continue;
      }

      // Add student to course
      course.students.push(student._id);
      await course.save();

      const faculty = await User.findById(req.user.id);

      // Email options
      const mailOptions = {
        from: process.env.EMAIL,
        to: student.email,
        subject: `Welcome to ${course.title}!`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #444; font-weight: bold; text-align: center;">Welcome to ${course.title}!</h2>
            <p><strong>Dear ${student.name},</strong></p>
            <p><strong>You have been successfully enrolled in the course <span style="color: #007BFF;">"${course.title}"</span> by your faculty member <span style="color: #007BFF;">${faculty.name}</span>.</strong></p>
            <p><strong>This course is designed to help you excel and grow in your learning journey. Please log in to your EduSpace account to access the course materials, assignments, and more.</strong></p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://eduspace-portal.com/courses/${course._id}" style="display: inline-block; padding: 10px 20px; font-size: 16px; font-weight: bold; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 4px;">Access Course</a>
            </div>
            <p style="font-weight: bold;">If the button above doesn’t work, use the link below:</p>
            <p style="word-wrap: break-word; font-weight: bold; color: #007BFF;">https://eduspace-portal.com/courses/${course._id}</p>
            <p><strong>We’re excited to have you onboard, and we wish you great success in your studies!</strong></p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 14px; color: #666;"><strong>Please do not reply to this email, as this mailbox is not monitored.</strong></p>
            <p style="font-size: 14px; color: #666;"><strong>Thank you,<br>EduSpace Team</strong></p>
          </div>
        `,
      };
      

      await transporter.sendMail(mailOptions);

      addedStudents.push({
        email: student.email,
        message: `Student ${student.name} (${student.email}) added successfully.`,
        student: { _id: student._id, name: student.name, email: student.email },
      });
    } catch (error) {
      console.error(`Error processing email ${e}:`, error.message);
      errors.push({ email: e, message: error.message });
    }
  }

  res.json({
    success: addedStudents.length > 0,
    addedStudents,
    errors,
  });
});




export default router;
