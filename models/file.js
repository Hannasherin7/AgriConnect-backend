const mongoose = require("mongoose");
const uploadSchema = new mongoose.Schema({
    email: { type: String, required: true },
    filePath: { type: String, required: false },
});

const UploadModel = mongoose.model('Upload', uploadSchema);
module.exports={UploadModel}
