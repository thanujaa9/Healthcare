// doctorController.js

const Doctor = require('../models/Doctor'); // Import the Doctor model

exports.getDoctorDashboard = (req, res) => {
    try {
        res.status(200).json({
            message: "Doctor dashboard accessed",
            doctor: req.user,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ✅ ADD THIS FUNCTION TO FETCH ALL DOCTORS
exports.getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find().select('-password'); // Exclude password for security
        res.status(200).json(doctors);
    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ message: "Failed to fetch doctors", error: error.message });
    }
};