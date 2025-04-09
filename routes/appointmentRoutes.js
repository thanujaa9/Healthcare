const express = require('express');
const {
    createAppointment,
    getAllAppointments,
    getPatientAppointments,
    getAppointmentsByDoctor,
    updateAppointmentStatus,
    deleteAppointment,
    getDoctorAppointments // ✅ Import the new function
} = require('../controllers/appointmentController');
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Create an appointment (protected route for patients)
router.post('/book', protect, authorizeRoles('patient'), createAppointment);

// 📌 Get all appointments (Assuming this is for internal use, protect as needed)
router.get("/all", protect, authorizeRoles('admin'), getAllAppointments); // Keep if needed, adjust role if not

// 📌 Get appointments for the logged-in patient (protected route for patients)
router.get('/patient', protect, authorizeRoles('patient'), getPatientAppointments);

// 📌 Get appointments by doctor ID (protected route for doctors to view their schedule or specific appointments)
router.get('/doctor/:doctorId', protect, authorizeRoles('doctor'), getAppointmentsByDoctor);

// ✅ NEW ROUTE TO FETCH APPOINTMENTS FOR THE LOGGED-IN DOCTOR (protected route for doctors)
router.get('/doctor', protect, authorizeRoles('doctor'), getDoctorAppointments);

// 📌 Update appointment status (protected route for doctors)
router.put('/update-status/:appointmentId', protect, authorizeRoles('doctor'), updateAppointmentStatus);

// 📌 Delete an appointment (protected route for patients and doctors)
router.delete('/delete/:appointmentId', protect, authorizeRoles('patient', 'doctor'), deleteAppointment);

module.exports = router;