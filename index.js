//index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path")

const config = require("./config.js");
const routes = require("./routes/app.js");

const app = express();

app.use(express.json());
const corsOptions = {
    origin: "https://movienexus-ruddy-nine.vercel.app",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    preflightContinue: false,
    optionsSuccessStatus: 204
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
module.exports = app;

