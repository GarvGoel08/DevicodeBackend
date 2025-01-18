const User = require("../models/User");
const { catchAsyncError } = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const returnToken = (user) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    return token;
};

exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { user_name, company_name, email, password } = req.body;
    if (!user_name || !company_name || !email || !password) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }
    const userNameSame = await User.findOne({ user_name });
    if (userNameSame) {
        return next(new ErrorHandler("A user with that User name already exists", 400));
    }
    const emailSame = await User.findOne({ email });
    if (emailSame) {
        return next(new ErrorHandler("Email already exists", 400));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    req.body.password = hashedPassword;
    const code = Math.floor(100000 + Math.random() * 900000);
    const expiresIn = Date.now() + 5 * 60 * 1000;
    const user = await User.create(req.body);
    const token = returnToken(user);
    res.cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "none",
        secure: true,
    });
    res.status(200).json({
        success: true,
        user,
    });
});

exports.loginUser = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 400));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return next(new ErrorHandler("Invalid email or password", 400));
    }

    const token = returnToken(user);
    res.cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "none",
        secure: true,
    });

    res.status(200).json({
        success: true,
        user,
    });
})

exports.logoutUser = catchAsyncError(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
    });
    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
});

exports.getUser = catchAsyncError(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
});