import express from "express";
import { verifyRole } from "../middlewares/verifyRole.js";
import Course from "../models/Course.js";
import CourseMaterial from "../models/CourseMaterial.js";

const router = express.Router();

router.get("/my-courses", verifyRole("student"), async (req, res) => {
  const studentId = req.user.id;

  try {
    const courses = await Course.find({ students: studentId }).select("title description department faculty");
    res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch courses.", error: error.message });
  }
});

router.get("/course/:courseId", verifyRole("student"), async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
      const isStudentEnrolled = course.students.includes(req.user.id); // req.user contains the authenticated student's ID
      if (!isStudentEnrolled) {
        return res.status(403).json({ success: false, message: "Access denied. You are not enrolled in this course." });
      }
      res.json({ success: true, message:course });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
});


router.get("/course-materials/:courseId", verifyRole("student"), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Fetch only the 'materials' field from CourseMaterial
    const courseMaterial = await CourseMaterial.findOne({ courseId }).select("materials");

    if (!courseMaterial) {
      return res.status(404).json({ success: false, message: "Course materials not found" });
    }

    res.status(200).json({ success: true, materials: courseMaterial.materials }); // Accessing the array
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch course materials" });
  }
});

  
export default router;
