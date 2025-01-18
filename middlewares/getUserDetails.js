const User = require("../models/User");
const jwt = require("jsonwebtoken");


const getUserDetails = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Please login to access this resource",
        });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "User Session Expired",
        });
    }
    next();
};

module.exports = getUserDetails;