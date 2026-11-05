// controllers / dashboardControllers.js
const dashboard = (req, res) => {
    const role = (req.user.userId && req.user.userId.role) || req.user.role;
    if (role === "admin") {
        // Handle admin-specific logic
        res.json({ message: "Welcome to the admin dashboard", user: req.user });
    } else {
        // Handle regular user logic
        res.json({ message: "Welcome to the user dashboard", user: req.user });
    }
};

module.exports = { dashboard };
