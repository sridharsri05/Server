// api/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// const serverless = require("serverless-http");
const config = require("./config.js");
const routes = require("./routes/app.js");

const app = express();

app.use(express.json());
const allowedOrigins = ['http://localhost:5173']; // Add any other origins as needed

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests from allowedOrigins, '*' for any origin
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));


// Connect to MongoDB
mongoose
    .connect(config.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

// Use routes
app.use("/", routes);
module.exports = app;

