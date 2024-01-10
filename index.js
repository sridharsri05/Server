var express = require("express");
var mongoose = require("mongoose");
var cors = require("cors");
var config = require("./config.js");
var routes = require("./routes/app.js");

var app = express();
var port = 3000;

app.use(express.json());
app.use(
    cors({
        origin: "*",
        credentials: true,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        allowedHeaders: "Content-Type, Authorization",
    }),
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

// Start the server
app.listen(port, function () {
    console.log("Server is running at http://localhost:" + port);
});
