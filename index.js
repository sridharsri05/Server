// api/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// const serverless = require("serverless-http");
const config = require("./config.js");
const routes = require("./routes/app.js");

const app = express();

app.use(express.json());
// const corsOptions = {
//     origin: ["https://movie-app-ruddy-nine.vercel.app","http://localhost:5173"],
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
//     preflightContinue: false,
//     optionsSuccessStatus: 204
// };

const corsOptions = {
    origin: function (origin, callback) {
        // Check if the origin is in the allowed origins list
        if (
            ["https://movie-app-ruddy-nine.vercel.app", "http://localhost:5173"].indexOf(origin) !== -1 ||
            !origin
        ) {
            // Allow the request
            callback(null, true);
        } else {
            // Reject the request
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204
};


app.use(cors(corsOptions));


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
module.exports = app;

