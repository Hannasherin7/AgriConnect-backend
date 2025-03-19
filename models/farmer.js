const mongoose = require("mongoose");

const FarmerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    idProof: { type: String, required: true }, 
    termsAccepted: { type: Boolean, required: true },
    status:{type:String,require:true,default:"pending"},
}, { timestamps: true });

FarmerSchema.index({ email: 1 }); // Index for better performance

module.exports = mongoose.model("Farmer", FarmerSchema);
