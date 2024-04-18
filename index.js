// // api/index.js
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");

// // const serverless = require("serverless-http");
// const config = require("./config.js");
// const routes = require("./routes/app.js");

// const app = express();

// app.use(express.json());
// const corsOptions = {
//     origin: "https://movie-app-ruddy-nine.vercel.app",
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
//     preflightContinue: false,
//     optionsSuccessStatus: 204
// };

// app.use(cors(corsOptions));


// // Connect to MongoDB
// mongoose
//     .connect(config.MONGODB_URI)
//     .then(() => {
//         console.log("MongoDB connected successfully");
//     })
//     .catch((error) => {
//         console.error("MongoDB connection error:", error);
//     });
// // const port = 3001;
// // app.listen(port, () => {
// //     console.log(`Server is running on port ${port}`);
// // });
// // // Use routes
// app.use("/", routes);
// module.exports = app;

// api/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http"); // Require http module

const config = require("./config.js");
const routes = require("./routes/app.js");

const app = express();
const io = require("socket.io")(); // Integrate Socket.IO

app.use(express.json());
const corsOptions = {
    origin: ["https://movie-app-ruddy-nine.vercel.app", "http://localhost:5173"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
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

// Integrate Socket.IO with Express app
io.attach(app);

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("A user connected");

    // Emit user status
    socket.emit("userStatus", { status: "online" });

    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected");
        // Emit user status update upon disconnect
        socket.emit("userStatus", { status: "offline" });
    });
});

// Use routes
app.use("/", routes);

module.exports = app;
