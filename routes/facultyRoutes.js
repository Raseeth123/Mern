import express from "express";
import { verifyRole } from "../middlewares/verifyRole.js";
import Course from "../models/Course.js";
import User from "../models/User.js"; // Import User model

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
  const { email } = req.body;

  try {
    const student = await User.findOne({ email });
    if (!student || student.role !== "student") {
      return res.status(404).json({ success: false, message: "Student not found or invalid role" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (course.students.includes(student._id)) {
      return res.status(400).json({ success: false, message: "Student is already enrolled in this course" });
    }

    course.students.push(student._id);
    await course.save();

    res.json({ success: true, student: { name: student.name, email: student.email, _id: student._id } });
  } catch (error) {
    console.error(error);
    console.log(error);
    res.status(500).json({ success: false, message: "Error adding student to course", error: error.message });
  }
});



export default router;
