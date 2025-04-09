const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getDoctorDashboard, getDoctors } = require("../controllers/doctorController"); // Ensure getDoctors is imported

const router = express.Router();

// ✅ Route to fetch all doctors (for the BookAppointmentPage)
router.get("/", getDoctors);

// ✅ Route for the doctor's dashboard (protected, as it should be)
router.get("/dashboard", protect, getDoctorDashboard);

module.exports = router;