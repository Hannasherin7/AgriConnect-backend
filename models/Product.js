const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    text: String,
    rating: Number,
});

const ProductSchema = new mongoose.Schema({
    pname: String,
    pdescription: String,
    price: Number,
    quantity: Number,
    image: String,
    feedbacks: [FeedbackSchema], // Array of feedbacks
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;