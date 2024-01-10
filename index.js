// api/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// const serverless = require("serverless-http");
const config = require("./config.js");
const routes = require("./routes/app.js");

const app = express();
const port = 5000;
app.use(express.json());
app.use(cors());

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
app.listen(port, () => {
    console.log(`App listening at port ${port}`);
})
module.exports = app;

