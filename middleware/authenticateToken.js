// middleware/authenticateToken.js
const jwtUtils = require("../utils/jwtUtils");

function authenticateToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: "Unauthorized",message:"token is not present" });
    }

    try {
        const decoded = jwtUtils.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized",message:" token invalid" });
    }
}

module.exports = authenticateToken;
