const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { uploadPrescriptionForAppointment, getPatientPrescriptions, downloadPrescription } = require("../controllers/prescriptionController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware"); // ✅ Import authorizeRoles

// Route to upload prescription for an appointment (Doctor only)
router.post("/upload/:appointmentId", protect, authorizeRoles('doctor'), upload.single("prescriptionFile"), uploadPrescriptionForAppointment); // ✅ Added :appointmentId

// Route to get prescriptions for the logged-in patient
router.get("/patient", protect, authorizeRoles('patient'), getPatientPrescriptions); // ✅ Added authorizeRoles

// Route to download prescription (accessible to both patient and doctor who have access to the prescription)
router.get("/download/:id", protect, authorizeRoles('patient', 'doctor'), downloadPrescription); // ✅ Added protect and authorizeRoles

module.exports = router;