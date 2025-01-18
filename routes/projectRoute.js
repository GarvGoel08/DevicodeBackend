// proejectRoute.js
// Complete CRUD Operation
const express = require("express");
const { createProject, getProject, deleteProject, updateProject, getUserProducts } = require("../controllers/projectController");
const router = express.Router();
const getUserDetails = require("../middlewares/getUserDetails");

router.route("/createProject").post(getUserDetails, createProject);
router.route("/getProject/:id").get(getUserDetails, getProject);
router.route("/getUserProducts").get(getUserDetails, getUserProducts);
// Add Functionality to delete schemas from database
router.route("/deleteProject/:id").delete(getUserDetails, deleteProject);
// To be worked on
// router.route("/updateProject/:id").put(getUserDetails, updateProject);
module.exports = router;