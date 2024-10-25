const mongoose = require('mongoose');

// Define Feedback Schema
const FeedbackSchema = new mongoose.Schema({
    text: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 } // Rating should be between 1 and 5
});

// Define Product Schema
const ProductSchema = new mongoose.Schema({
    pname: { type: String, required: true },
    email: { type: String, required: true },
    pdescription: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String },
    feedbacks: [FeedbackSchema], // Array of feedbacks
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
});

// Create Product model
const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
