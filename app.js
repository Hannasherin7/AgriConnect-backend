const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const bcrypt = require("bcryptjs"); // Import encryption package
const jwt = require("jsonwebtoken"); // Importing token library

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://hannasherin:Alazhar4@cluster0.agtcb.mongodb.net/DBAgriConnect?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Failed to connect to MongoDB", err));

const generateHashedpswd = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10); // Salt is a cost factor
        return await bcrypt.hash(password, salt);
    } catch (error) {
        console.error("Error generating hashed password", error);
        throw error;
    }
}

//agri.js

const { agrimodel } = require("./models/agri");

app.post("/signup", async (req, res) => {
    try {
        let input = req.body;
        let hashedpswd = await generateHashedpswd(input.password);
        input.password = hashedpswd; // This is for getting hashed password in db

        let agriusers = new agrimodel(input);
        await agriusers.save();
        res.json({ "status": "SIGNUP" });
    } catch (error) {
        console.error("Error during signup", error);
        res.status(500).json({ "status": "error", "message": "Internal Server Error" });
    }
});
   
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const agri = await agrimodel.findOne({ email: email });
        if (!agri) {
            return res.status(404).json({ status: "Error", message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, agri.password);
        if (!isMatch) {
            return res.status(401).json({ status: "Error", message: "Incorrect password" });
        }

        const token = jwt.sign({ email: agri.email }, "task-app", { expiresIn: "1d" });
        res.json({ status: "Success", userid: agri._id, token });
    } catch (error) {
        console.error("Sign-in error:", error); // Log error for debugging
        res.status(500).json({ status: "Error", message: "An error occurred. Please try again." });
    }
});
app.post("/view", (req, res) => {
    const token = req.headers["token"];
    
    jwt.verify(token, process.env.JWT_SECRET || "agriculture-frontend", (error, decoded) => {
        if (error) {
            res.json({ "status": "unauthorized access" });
        } else {
            if (decoded) {
                agrimodel.find().then(
                    (response) => {
                        res.json(response);
                    }
                ).catch(err => {
                    console.error("Error fetching data", err);
                    res.status(500).json({ "status": "error", "message": "Internal Server Error" });
                });
            }
        }
    });
});
app.get("/viewsign", (req, res) => {
    agrimodel.find().then((data) => {
        res.json(data);
    }).catch((error) => {
        console.error("Error fetching data", error);
        res.status(500).json({ "status": "error", "message": "Internal Server Error" });
    });
});

// Delete user by ID
app.delete("/deleteuser/:id", (req, res) => {
    const userId = req.params.id; // Get user ID from request parameters

    agrimodel.findByIdAndDelete(userId)
        .then((deletedUser) => {
            if (!deletedUser) {
                return res.status(404).json({
                    status: "error",
                    message: "User not found",
                });
            }
            res.json({
                status: "success",
                message: "User deleted successfully",
            });
        })
        .catch((error) => {
            console.error("Error deleting user", error);
            res.status(500).json({
                status: "error",
                message: "Internal Server Error",
            });
        });
});

// Define Product Schema
const productSchema = new mongoose.Schema({
    image: String,
    pname: String,
    pdescription: String,
    price: Number,
    quantity: Number,

    category: String,
});

const product = mongoose.model("Product", productSchema);

// Add product route
app.post("/addpro", (req, res) => {
    const input = req.body;
    const product = new Product(input);
    product.save()
        .then(() => {
            console.log("Product added:", product);
            res.json({ "status": "success" });
        })
        .catch((error) => {
            console.log("Error adding product:", error);
            res.json({ "status": "error", "message": error.message });
        });
});

// Search products route
app.post("/searchpro", (req, res) => {
    const input = req.body;
    Product.find(input)
        .then((data) => res.json(data))
        .catch((error) => res.json(error));
});

// Delete product route
app.post("/deletepro", (req, res) => {
    const input = req.body;
    Product.findByIdAndDelete(input._id)
        .then(() => res.json({ "status": "success" }))
        .catch((error) => res.json({ "status": "error", "message": error.message }));
});

// View all products route
app.get("/viewpro", (req, res) => {
    Product.find()
        .then((data) => res.json(data))
        .catch((error) => res.json(error));
});


// Define Product Schema and Model
const productmodel = new mongoose.Schema({
    image: String,
    pname: String,
    pdescription: String,
    price: Number,
    quantity: Number
});
const Product = mongoose.model("Product", productSchema);

// Define Order Schema and Model
const orderSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    address: String,
    paymentMethod: String,
    email: String,
    phone: String,
    orderQuantity: Number,
    date: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// Buy product route (handling "Buy Now")
app.post("/order", (req, res) => {
    const { productId, address, paymentMethod, email, phone, orderQuantity } = req.body;

    // Find the product by ID
    Product.findById(productId)
        .then((product) => {
            if (product && product.quantity >= orderQuantity) {
                // Reduce the product quantity by the ordered amount
                product.quantity -= orderQuantity;

                // Save the updated product quantity
                product.save()
                    .then(() => {
                        // Create a new order with all the details
                        const newOrder = new Order({
                            productId: product._id,
                            address,
                            paymentMethod,
                            email,
                            phone,
                            orderQuantity
                        });

                        // Save the order
                        newOrder.save()
                            .then(() => res.json({ status: "success", message: "Order placed successfully!" }))
                            .catch((error) => res.json({ status: "error", message: error.message }));
                    })
                    .catch((error) => res.json({ status: "error", message: error.message }));
            } else {
                res.json({ status: "error", message: "Product out of stock or insufficient quantity." });
            }
        })
        .catch((error) => res.json({ status: "error", message: error.message }));
});

// Fetch all products
app.get("/viewpro", (req, res) => {
    Product.find()
        .then((products) => res.json(products))
        .catch((error) => res.json(error));
});
// View all orders route
app.get("/vieworders", (req, res) => {
    Order.find()
        .populate('productId') // Populate product details
        .then((orders) => {
            // Return the orders with product details
            const orderDetails = orders.map(order => ({
                orderId: order._id,
                productName: order.productId.pname, // Fetch product name
                productId: order.productId._id, // Fetch product ID
                userName: order.name, // Include user name
                userEmail: order.email,
                userPhone: order.phone,
                address: order.address,
                pincode: order.pincode, // Include pincode
                quantity: order.orderQuantity,
                price: order.productId.price // Fetch product price
            }));
            res.json(orderDetails);
        })
        .catch((error) => {
            console.error("Error fetching orders:", error);
            res.status(500).json({ message: "Error fetching orders", error });
        });
});


//recepe

const {recipemodel}=require("./models/recipe")
app.post("/addrec",(req,res)=>{
    let input=req.body
    let recipe=new recipemodel(input)
    recipe.save()
    console.log(recipe)
    res.json({"status":"success"})
})

app.post("/searchrec",(req,res)=>{
    let input=req.body
    recipemodel.find(input).then((data)=>{
        res.json(data)
    }
    ).catch((error)=>{
        res.json(error)
    })
})

app.post("/deleterec",(req,res)=>{
    let input=req.body
    recipemodel.findByIdAndDelete(input._id).then(
        (response)=>{
            res.json({"status":"success"})
        }
    ).catch(
        (error)=>{
            res.json({"status":"error"})
        }
    )
}) 


app.get("/viewrec",(req,res)=>{
    recipemodel.find().then((data)=>{
        res.json(data)
    }).catch((error)=>{
        res.json(error)
    })
})

//tip

const {tipmodel} =require("./models/tip");


app.post("/addtip",(req,res)=>{
    let input=req.body
    let tip=new tipmodel(input)
    tip.save()
    console.log(tip)
    res.json({"status":"success"})
})

app.post("/searchtip",(req,res)=>{
    let input=req.body
    tipmodel.find(input).then((data)=>{
        res.json(data)
    }
    ).catch((error)=>{
        res.json(error)
    })
})

app.post("/deletetip",(req,res)=>{
    let input=req.body
    tipmodel.findByIdAndDelete(input._id).then(
        (response)=>{
            res.json({"status":"success"})
        }
    ).catch(
        (error)=>{
            res.json({"status":"error"})
        }
    )
}) 


app.get("/viewtips",(req,res)=>{
    tipmodel.find().then((data)=>{
        res.json(data)
    }).catch((error)=>{
        res.json(error)
    })
})
const {complaintmodel} =require("./models/complaint");

// POST route to add complaints
app.post("/addcom", (req, res) => {
    const { complaint } = req.body; // Only extract complaint

    // Validate input
    if (!complaint) {
        return res.status(400).json({ status: "error", message: "Complaint is required" });
    }

    // Create a new complaint document
    const newComplaint = new complaintmodel({
        complaint: complaint,
        // Removed datec from the document
    });

    // Save the complaint to the database
    newComplaint.save()
        .then(() => {
            res.json({ status: "success", message: "Complaint registered successfully" });
        })
        .catch((error) => {
            console.error("Error saving complaint:", error);
            res.status(500).json({ status: "error", message: "Failed to register complaint" });
        });
});



app.get("/viewcom",(req,res)=>{
    complaintmodel.find().then((data)=>{
        res.json(data)
    }).catch((error)=>{
        res.json(error)
    })
})
 //delete user
 app.post("/deleteuser", (req, res) => {
    let input = req.body;
    console.log("Received delete request for ID:", input._id); // Log the received ID
    agrimodel.findByIdAndDelete(input._id)
        .then((response) => {
            if (response) {
                res.json({ "status": "success" });
            } else {
                console.error("User not found with ID:", input._id); // Log if user not found
                res.json({ "status": "error", message: "User not found" });
            }
        })
        .catch((error) => {
            console.error("Error deleting user:", error); // Log the error
            res.json({ "status": "error", message: error.message }); // Return the error message
        });
});


app.listen(7000,()=>{
    console.log("server started")
})