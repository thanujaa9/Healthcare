const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true },
    hospitalAffiliation: { type: String }, // ✅ Added hospitalAffiliation
    bio: { type: String },                 // ✅ Added bio
    role: {
        type: String,
        enum: ['doctor'],
        default: 'doctor'
    }
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;