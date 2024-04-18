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
const server = http.createServer(app); // Create HTTP server

const io = require("socket.io")(server); // Integrate Socket.IO with HTTP server

app.use(express.json());
const corsOptions = {
    origin: "https://movie-app-ruddy-nine.vercel.app",
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

let serverInstance = null;

if (process.env.NODE_ENV !== "production") {
    // Development environment
    serverInstance = app.listen(3001, () => {
        console.log("Server is running on port 3001");
    });
} else {
    // Production environment
    serverInstance = server.listen(() => {
        console.log("Server is running");
    });
}

module.exports = { app, serverInstance };
