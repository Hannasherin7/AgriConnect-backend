const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const bcrypt = require("bcryptjs"); // Import encryption package
const jwt = require("jsonwebtoken"); // Importing token library
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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


app.get('/getUserDetails', (req, res) => {
    const email = req.query.email;
    // Fetch user from database using email
    User.findOne({ email: email }, (err, user) => {
        if (err) return res.status(500).send({ message: 'Server error' });
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.send(user);
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
    email: String,
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


// Fetch all products excluding those sold by the logged-in user
app.get("/viewpro2", async (req, res) => {
    const userEmail = req.user.email; // Assuming you are using JWT and have middleware to set req.user

    try {
        const products = await Product.find({ 
            email: { $ne: userEmail }, // Exclude products sold by the logged-in user
            quantity: { $gt: 0 } // Only include products in stock
        });
        res.json(products);
    } catch (error) {
        res.json(error);
    }
});


// Define Product Schema and Model
const productmodel = new mongoose.Schema({
    image: String,
    email: String,
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

app.get("/viewORD", (req, res) => {
    console.log("hiii")
    const sellerEmail = req.query.email; // Retrieve the seller email from query parameters
    
    // Check if the email is provided
    if (!sellerEmail) {
        return res.status(400).json({ message: "Seller email is required" });
    }

    // Fetch orders that match the provided seller email
    Order.find()
        .populate('productId') // Populate product details
        .then((orders) => {
            // Filter orders based on the seller's email
            const filteredOrders = orders.filter(order => 
                order.productId.email && order.productId.email.toLowerCase() === sellerEmail.toLowerCase()
            );

            // Prepare order details to send as a response
            const orderDetails = filteredOrders.map(order => ({
                orderId: order._id,
                productName: order.productId.pname, // Fetch product name
                productId: order.productId._id, // Fetch product ID
                userName: order.name, // Include user name
                userEmail: order.email, // Include user email (customer)
                userPhone: order.phone, // Include user phone
                address: order.address, // Include delivery address
                pincode: order.pincode, // Include pincode
                quantity: order.orderQuantity, // Include quantity
                price: order.productId.price // Fetch product price
            }));

            // Log filtered orders to the console
            console.log("Filtered Order Details for seller:", sellerEmail, orderDetails);

            // Send the filtered orders as a response
            res.json(orderDetails);
        })
        .catch((error) => {
            console.error("Error fetching orders:", error);
            res.status(500).json({ message: "Error fetching orders", error });
        });
});








//View all orders route---------------------------------------------------------------------------
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

            // Log the order details to console
            console.log("Fetched Order Details: ", orderDetails);

            // Send the order details as a response
            res.json(orderDetails);
        })
        .catch((error) => {
            console.error("Error fetching orders:", error);
            res.status(500).json({ message: "Error fetching orders", error });
        });
});



// Assuming you have already set up your express server and required mongoose

// // View orders route based on email
// app.get("/vieworders", (req, res) => {
//     console.log("hiii")
//     const userEmail = req.query.email; // Get email from query parameters
//     console.log(userEmail)
//     Order.find({ email: userEmail }) // Find orders by user email
//         .populate('productId') // Populate product details

//         .then((orders) => {
//             // Return the orders with product details
//             const orderDetails = orders.map(order => ({
//                 orderId: order._id,
//                 productName: order.productId.pname, // Fetch product name
//                 productId: order.productId._id, // Fetch product ID
//                 userName: order.name, // Include user name
//                 userEmail: order.email,
//                 userPhone: order.phone,
//                 address: order.address,
//                 pincode: order.pincode, // Include pincode
//                 quantity: order.orderQuantity,
//                 price: order.productId.price // Fetch product price
//             }));
//             console.log(orderDetails)
//             res.json(orderDetails);
//         })
//         .catch((error) => {
//             console.error("Error fetching orders:", error);
//             res.status(500).json({ message: "Error fetching orders", error });
//         });
// });

app.get("/viewORD13123", (req, res) => {
    console.log(req.query.email)
    const userEmail = req.query.email; // Get email from query parameters
    console.log("User email: ", userEmail);
    // Step 1: Find products associated with the user email
    Product.find({ email: userEmail })
        .then(products => {
            // If no products found, send an error response
            if (products.length === 0) {
                return res.status(404).json({ message: "No products found for this user." });
            }

            // Get the product IDs for the found products
            const productIds = products.map(product => product._id);
            console.log("Found product IDs: ", productIds);

            // Step 2: Find orders associated with these product IDs
            return Order.find({ productId: { $in: productIds } }).populate('productId');
        })
        .then(orders => {
            // If no orders found, send a message
            if (orders.length === 0) {
                return res.status(404).json({ message: "No orders found for the user's products." });
            }

            // Step 3: Format the order details
            const orderDetails = orders.map(order => ({
                orderId: order._id,
                productName: order.productId.pname, // Fetch product name from populated product
                productId: order.productId._id, // Fetch product ID
                userName: order.name, // Customer name
                userEmail: order.email, // Customer email
                userPhone: order.phone, // Customer phone
                address: order.address, // Customer address
                pincode: order.pincode, // Customer pincode
                quantity: order.orderQuantity, // Order quantity
                price: order.productId.price // Product price from populated product
            }));

            console.log("Order Details: ", orderDetails);
            res.json(orderDetails); // Send the order details as response
        })
        .catch(error => {
            console.error("Error fetching orders: ", error);
            res.status(500).json({ message: "Error fetching orders", error });
        });
});



// Fetch orders by user email
app.get('/orders/:email', async (req, res) => {
    const userEmail = req.params.email;

    try {
        const orders = await Order.find({ email: userEmail }); // Adjust your query based on your Order schema
        if (orders.length === 0) {
            return res.status(404).json({ status: "Error", message: "No orders found for this user." });
        }
        res.status(200).json({ status: "Success", orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ status: "Error", message: "An error occurred while fetching orders." });
    }
});

// // View orders route based on email new
// app.get("/vieworders", (req, res) => {
//     const userEmail = req.query.email; // Get email from query parameters

//     Order.find({ email: userEmail }) // Find orders by user email
//         .populate('productId') // Populate product details
//         .then((orders) => {
//             // Return the orders with product details
//             const orderDetails = orders.map(order => ({
//                 orderId: order._id,
//                 productName: order.productId.pname, // Fetch product name
//                 productId: order.productId._id, // Fetch product ID
//                 userName: order.name, // Include user name
//                 userEmail: order.email,
//                 userPhone: order.phone,
//                 address: order.address,
//                 pincode: order.pincode, // Include pincode
//                 quantity: order.orderQuantity,
//                 price: order.productId.price // Fetch product price
//             }));
//             res.json(orderDetails);
//         })
//         .catch((error) => {
//             console.error("Error fetching orders:", error);
//             res.status(500).json({ message: "Error fetching orders", error });
//         });
// });



app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    next();
});


// Route to get sold products of a specific user
app.get("/soldproducts/:userId", (req, res) => {
    const { userId } = req.params;

    Product.find({ userId: userId }) // Find products sold by the specified user
        .then((products) => {
            if (!products.length) {
                return res.status(404).json({ status: "error", message: "No sold products found." });
            }
            res.json({ status: "success", products });
        })
        .catch((error) => {
            console.error("Error fetching sold products:", error);
            res.status(500).json({ status: "error", message: error.message });
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

//strt

const {UploadModel} =require("./models/file");


app.post("/addfile",(req,res)=>{
    let input=req.body
    let file=new UploadModel(input)
    file.save()
    console.log(file)
    res.json({"status":"success"})
})

// Directory setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Created 'uploads' directory.");
} else {
    console.log("'uploads' directory exists.");
}

// Multer storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Ensure the absolute path is used
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

// Enable CORS for all routes
app.use(cors());

// Serve the files statically from the uploads directory
app.use('/files', express.static(uploadDir)); // This line allows you to access files via /files/<filename>

// File upload route
app.post('/upload', upload.single('file'), (req, res) => {
    console.log("Received request: POST /upload");

    if (!req.file) {
        console.log("No file received in the request");
        return res.status(400).send({ message: 'No file uploaded.' });
    }

    const email = req.body.email; // Get the email from the request body
    console.log("Email received:", email); // Log the email
    console.log("File uploaded:", req.file);
    
    // Save file and email logic here if needed
    res.send({ status: 'success', message: 'File uploaded successfully', filePath: req.file.path });
});


// Endpoint to fetch all uploaded files
app.get('/files', (req, res) => {
    const directoryPath = path.join(__dirname, 'uploads/');
  
    // Read the directory for files
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
  
        // Return the list of files
        res.send(files);
    });
});

//end 


//farmer


const FarmerModel = require("./models/farmer");

// Register Farmer
app.post("/registerFarmer", async (req, res) => {
    try {
        const { name, email, phone, termsAccepted } = req.body;
        const idProof = req.file ? req.file.path : null;

        if (!name || !email || !phone || !idProof || !termsAccepted) {
            return res.status(400).json({ status: "error", message: "All fields are required" });
        }
        
        let existingFarmer = await FarmerModel.findOne({ email });
        if (existingFarmer) {
            if (existingFarmer.status === "rejected") {
                await FarmerModel.deleteOne({ email });
            } else {
                return res.status(400).json({ status: "error", message: "Farmer already registered" });
            }
        }
        
        const newFarmer = new FarmerModel({ name, email, phone, idProof, termsAccepted, status: "pending" });
        await newFarmer.save();
        res.status(201).json({ status: "success", message: "Farmer registered. Awaiting admin approval." });
    } catch (error) {
        console.error("Error during farmer registration", error);
        res.status(500).json({ status: "error", message: "Failed to register farmer" });
    }
});

// Get All Farmers (For Admin)
app.get("/getAllFarmers", async (req, res) => {
    try {
        const farmers = await FarmerModel.find();
        res.json({ status: "success", data: farmers });
    } catch (error) {
        console.error("Error retrieving farmers", error);
        res.status(500).json({ status: "error", message: "Failed to retrieve farmers" });
    }
});

// Update Farmer Status
app.post("/updateFarmerStatus", async (req, res) => {
    const { farmerId, status } = req.body;
    try {
        await FarmerModel.findByIdAndUpdate(farmerId, { status });
        res.json({ status: "success", message: "Farmer status updated successfully" });
    } catch (error) {
        console.error("Error updating farmer status", error);
        res.status(500).json({ status: "error", message: "Failed to update status" });
    }
});

// Check Farmer Approval Before Selling Products
app.get("/checkFarmerStatus/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const farmer = await FarmerModel.findOne({ email });

        if (!farmer) return res.status(404).json({ status: "error", message: "Farmer not found" });

        res.json({ status: "success", farmerStatus: farmer.status });
    } catch (error) {
        console.error("Error checking farmer status", error);
        res.status(500).json({ status: "error", message: "Error checking farmer status" });
    }
});


app.listen(7000,()=>{
    console.log("server started")
})