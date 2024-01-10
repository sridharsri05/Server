// api/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http");
const config = require("../config.js");
const routes = require("../routes/app.js");

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: "*",
        credentials: true,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        allowedHeaders: "Content-Type, Authorization",
    })
);

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
module.exports.handler = serverless(app);
