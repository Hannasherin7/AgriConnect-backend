const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    image: String,
    pname: String,
    pdescription: String,
    price: Number,
    quantity: Number,
    category: String,
});

const productmodel = mongoose.model("Product", productSchema);

module.exports = {productmodel};