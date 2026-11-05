// middleware/requireAdmin.js - must run after authenticateToken.
// The JWT payload is { userId: { _id, role, ... }, role }, and generateToken only fills userId, so read the role from there.
function requireAdmin(req, res, next) {
    const role = (req.user && req.user.userId && req.user.userId.role) || (req.user && req.user.role);
    if (role !== "admin") {
        return res.status(403).json({ error: "Forbidden", message: "Admin access required" });
    }
    next();
}

module.exports = requireAdmin;
