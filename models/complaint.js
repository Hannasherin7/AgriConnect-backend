const mongoose = require("mongoose");

const schema = mongoose.Schema({
    complaint: { type: String, required: true },
});

let complaintmodel = mongoose.model("complaints", schema);
module.exports = { complaintmodel };
