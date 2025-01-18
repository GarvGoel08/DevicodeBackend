// User Route 
const express = require("express");
const { registerUser, loginUser, getUser, logoutUser } = require("../controllers/userController");
const getUserDetails  = require("../middlewares/getUserDetails");
const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(getUserDetails, logoutUser);
router.route("/getUser").get(getUserDetails, getUser);
router.route("/").get((req, res) => {
    res.send("Welcome to DeviCode, this is user route");
});

module.exports = router;