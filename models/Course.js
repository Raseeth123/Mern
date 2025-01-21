import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: { type: String, required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // References to User schema
}, { timestamps: true });

export default mongoose.model("Course", courseSchema);
