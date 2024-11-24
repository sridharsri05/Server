//index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path")

const config = require("./config.js");
const routes = require("./routes/app.js");

const app = express();

app.use(express.json());
const allowedOrigins = [
    "http://localhost:5173", // For development
    "https://movienexus-ruddy-nine.vercel.app", // For production
];

// Dynamically configure CORS based on the request origin
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            // Allow requests with no origin (like mobile apps or Postman)
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    preflightContinue: false,
    optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose
    .connect(config.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });
// const port = 3001;
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });
// // Use routes
app.use("/", routes);

// Custom 404 Handler for Unknown Routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

app.use((err, req, res, next) => {
    console.error("Error:", err.message); // Log the error for debugging

    // Handle CORS errors
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "CORS policy does not allow this origin.",
        });
    }


    if (err.name === "MongoError") {
        return res.status(500).json({
            success: false,
            message: "Database error occurred.",
            error: err.message,
        });
    }
})

module.exports = app;

