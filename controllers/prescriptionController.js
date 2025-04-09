const Prescription = require("../models/Prescription");
const path = require("path");
const fs = require("fs");
const Appointment = require("../models/Appointment"); // ✅ Import Appointment model

// Upload prescription for an appointment (Doctor only)
exports.uploadPrescriptionForAppointment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { appointmentId, notes } = req.body; // ✅ Expecting appointmentId
        const doctorId = req.user.id; // Assuming doctor is authenticated

        const appointment = await Appointment.findById(appointmentId); // ✅ Verify appointment exists
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        const newPrescription = new Prescription({
            doctor: doctorId,
            patient: appointment.patient, // ✅ Use patient ID from the appointment
            appointment: appointmentId,   // ✅ Link to the appointment
            prescriptionFile: req.file.path, // Store file path from multer
            notes: notes || "",
        });

        await newPrescription.save();

        res.status(201).json({ message: "Prescription uploaded successfully", prescription: newPrescription });
    } catch (error) {
        console.error("Error uploading prescription:", error);
        res.status(500).json({ message: "Error uploading prescription", error: error.message });
    }
};

// Get prescriptions for a specific patient (using patientId from URL parameter)
exports.getPrescriptionsByPatientId = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patient: req.params.patientId }).populate("doctor", "name");
        res.status(200).json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
    }
};

// Get prescriptions for the logged-in patient
exports.getPatientPrescriptions = async (req, res) => {
    try {
        const patientId = req.user.id; // Get the patient's ID from the authenticated user
        const prescriptions = await Prescription.find({ patient: patientId }).populate("doctor", "name");
        res.status(200).json(prescriptions);
    } catch (error) {
        console.error("Error fetching patient prescriptions:", error);
        res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
    }
};

// Download prescription
exports.downloadPrescription = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ message: "Prescription not found" });
        }

        const filePath = path.join(__dirname, "..", prescription.prescriptionFile);
        fs.access(filePath, fs.constants.R_OK, (err) => {
            if (err) {
                console.error("File not found or not readable:", filePath);
                return res.status(404).json({ message: "Prescription file not found on server." });
            }
            res.download(filePath);
        });
    } catch (error) {
        res.status(500).json({ message: "Error downloading prescription", error: error.message });
    }
};