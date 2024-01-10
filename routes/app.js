// routes/app.js

const express = require("express");
const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const authenticateToken = require("../middleware/authenticateToken");
const exampleController = require("../controllers/exampleController");
const router = express.Router();

// Auth Routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Protected Route
router.get("/dashboard", authenticateToken, dashboardController.dashboard);
router.get("/getusers", exampleController.getAllUsers);

module.exports = router;
