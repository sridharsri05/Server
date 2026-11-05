//index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path")
const mongoSanitize = require("express-mongo-sanitize");

const config = require("./config.js");
const routes = require("./routes/app.js");
const { generalLimiter } = require("./middleware/rateLimiters.js");

const app = express();

// Vercel sits behind one proxy hop; needed so rate limiting sees the real client IP.
app.set("trust proxy", 1);

app.use(express.json({ limit: "100kb" }));
// Strip keys starting with "$" or containing "." from body/query/params (NoSQL operator injection).
app.use(mongoSanitize());


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
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// Explicitly handle all OPTIONS preflight requests
app.options("*", cors(corsOptions));

// Health check: cheap (no DB query), never cached, registered before the rate limiter.
app.get("/health", (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    if (!connected) connectDb().catch(() => {}); // nudge a reconnect; the next check will show it
    res.set("Cache-Control", "no-store");
    res.status(connected ? 200 : 503).json({
        status: "ok",
        db: connected ? "connected" : "disconnected",
        uptime: process.uptime(),
        time: new Date().toISOString(),
    });
});

// General API rate limit (per IP). In-memory => per serverless instance, best effort.
app.use(generalLimiter);

app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB. The connection promise is cached on `global` so warm serverless invocations
// reuse it. If a connect attempt fails (e.g. a slow cold start), the next request that needs the DB
// retries, instead of the instance staying disconnected and hanging requests until Vercel kills them.
mongoose.set("bufferCommands", false); // never queue queries while disconnected: fail fast instead of a 10s 504
function connectDb() {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    if (!global._mongooseConn) {
        global._mongooseConn = mongoose
            .connect(config.MONGODB_URI, {
                serverSelectionTimeoutMS: 8000, // under Vercel's 10s limit, generous enough for cold starts
                socketTimeoutMS: 20000,
                maxPoolSize: 10, // serverless: each instance holds its own pool, keep it small
            })
            .then((m) => {
                console.log("MongoDB connected successfully");
                return m;
            })
            .catch((error) => {
                global._mongooseConn = null; // the next DB request retries
                console.error("MongoDB connection error:", error.message);
                throw error;
            });
    }
    return global._mongooseConn;
}
connectDb().catch(() => {}); // start connecting as soon as the instance boots

// Routes that don't touch MongoDB never wait for it (getLatestMovies only uses it as an optional cache).
const NO_DB = /^\/($|health|tmdb\/|omdb|api\/vapi\/|getLatestMovies|getAddedMovies|getAddedTVShows|favicon)/;
app.use(async (req, res, next) => {
    if (NO_DB.test(req.path)) return next();
    try {
        await connectDb();
        next();
    } catch {
        res.status(503).json({ success: false, message: "Database temporarily unavailable. Please try again." });
    }
});


// Listen only when run directly (`node index.js`, local dev). On Vercel the app is imported
// via module.exports and served by the platform, so it must not call listen itself.
if (require.main === module) {
    const port = 3001;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

// Use routes
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


    // Malformed JSON body etc.
    if (err.type === "entity.parse.failed" || err.status === 400) {
        return res.status(400).json({ success: false, message: "Invalid request body." });
    }

    if (err.name === "MongoError") {
        return res.status(500).json({
            success: false,
            message: "Database error occurred.",
            error: err.message,
        });
    }

    return res.status(500).json({ success: false, message: "Internal server error." });
})

module.exports = app;
