import express from "express";
import { addFaculty } from "../controllers/adminController.js";
import { verifyRole } from "../middlewares/verifyRole.js";

const router = express.Router();

router.post("/addFaculty", verifyRole("admin"), addFaculty);

export default router;
