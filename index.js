// api/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// const serverless = require("serverless-http");
const config = require("./config.js");
const routes = require("./routes/app.js");

const app = express();

app.use(express.json());
const corsOptions = {
    origin: "https://movie-app-ruddy-nine.vercel.app",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));


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
// const port = 3001;
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });
// Use routes
app.use("/", routes);
module.exports = app;

