const mongoose = require("mongoose");

// Define Order Schema
const orderSchema = new mongoose.Schema({
    name: String, // Customer's name
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    address: String,
    pincode: String, // Added pin code field
    paymentMethod: String,
    email: String,
    phone: String,
    orderQuantity: Number,
    date: { type: Date, default: Date.now }
});

// Define Product Schema
const productSchema = new mongoose.Schema({
    image: String,
    email: String,
    pname: String,
    pdescription: String,
    price: Number,
    quantity: Number
});

// Create Models
const Order = mongoose.model("Order", orderSchema);
const Product = mongoose.model("Product", productSchema);
