const dashboard = (req, res) => {
    const { role } = req.user;
    if (role === "admin") {
        // Handle admin-specific logic
        res.json({ message: "Welcome to the admin dashboard", user: req.user });
    } else {
        // Handle regular user logic
        res.json({ message: "Welcome to the user dashboard", user: req.user });
    }
};

module.exports = { dashboard };
