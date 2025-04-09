const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { createZoomMeeting } = require('../services/zoomService'); // Import Zoom function

// 📌 Create a new appointment (Now correctly uses authenticated patient ID)
exports.createAppointment = async (req, res) => {
    try {
        const { doctorId, date, reason } = req.body;
        const patientId = req.user.id; // Get patient ID from authenticated user

        // Check if patient and doctor exist
        const patient = await User.findById(patientId);
        const doctor = await Doctor.findById(doctorId);

        if (!patient || !doctor) {
            return res.status(404).json({ message: "Patient or Doctor not found" });
        }

        // ✅ Create appointment WITHOUT Zoom link (Handled in updateAppointmentStatus)
        const newAppointment = new Appointment({
            patient: patientId,
            doctor: doctorId,
            date,
            reason,
            status: "Pending",     // ✅ Default to 'pending'
            zoomLink: null         // ✅ No Zoom link yet
        });

        await newAppointment.save();
        res.status(201).json({ message: "Appointment booked successfully, waiting for doctor approval", newAppointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error booking appointment", error: error.message });
    }
};

// 📌 Get all appointments (Admin or Doctor)
exports.getAllAppointments = async (req, res) => {
    try {
        // Fetch appointments from database
        const appointments = await Appointment.find().populate("doctor patient");
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 📌 Get appointments for a specific patient (based on logged-in user ID)
exports.getPatientAppointments = async (req, res) => {
    try {
        const patientId = req.user.id; // Get the patient's ID from the authenticated user

        const appointments = await Appointment.find({ patient: patientId })
            .populate('doctor', 'name specialization')
            .select('doctor date reason status zoomLink');

        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching patient appointments:", error);
        res.status(500).json({ message: "Error fetching appointments", error: error.message });
    }
};

// 📌 Get appointments for a specific doctor
exports.getAppointmentsByDoctor = async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctor: req.params.doctorId }).populate('patient', 'name').select('patient date reason status zoomLink');
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching appointments", error: error.message });
    }
};

// ✅ NEW FUNCTION TO GET APPOINTMENTS FOR THE LOGGED-IN DOCTOR
exports.getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user._id; // Get doctor ID from authenticated user

        const appointments = await Appointment.find({ doctor: doctorId })
            .populate('patient', 'name') // Populate patient name
            .select('patient date reason status zoomLink'); // Select relevant fields

        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching doctor's appointments:", error);
        res.status(500).json({ message: "Failed to fetch doctor's appointments", error: error.message });
    }
};

// 📌 Approve an appointment
exports.approveAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // ✅ Ensure status is explicitly set
        appointment.status = "approved";
        await appointment.save();

        res.json({ message: "Appointment status updated to 'approved'", appointment });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { appointmentId } = req.params;

        // Check if the status is provided
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        // Fetch appointment and populate doctor details
        const appointment = await Appointment.findById(appointmentId).populate('doctor', 'name email');

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // ✅ Prevent unnecessary updates if the status is already set
        if (appointment.status === status) {
            return res.status(400).json({ message: `Appointment is already in '${status}' status` });
        }

        // ✅ Only create Zoom meeting if doctor accepts the appointment and no link exists
        if (status === 'Accepted' && !appointment.zoomLink) {
            const doctorName = appointment.doctor.name; // Get doctor's name
            const appointmentDateTime = new Date(appointment.date);
            const appointmentDate = appointmentDateTime.toISOString().split('T')[0];
            const appointmentTime = appointmentDateTime.toISOString().split('T')[1].substring(0, 5);

            // Call Zoom API with doctor's name, date, and time
            const meetingResponse = await createZoomMeeting(doctorName, appointmentDate, appointmentTime);

            if (meetingResponse && meetingResponse.join_url) {
                appointment.zoomLink = meetingResponse.join_url; // ✅ Store Zoom link in DB
            } else {
                console.error("Failed to create Zoom meeting:", meetingResponse);
                return res.status(500).json({ message: "Failed to create Zoom meeting" });
            }
        }

        // ✅ Ensure the status is updated correctly
        appointment.status = status;
        await appointment.save();

        res.status(200).json({ message: `Appointment status updated to '${appointment.status}'`, appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating appointment status", error: error.message });
    }
};


// 📌 Delete an appointment
exports.deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        res.status(200).json({ message: "Appointment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting appointment", error: error.message });
    }
};