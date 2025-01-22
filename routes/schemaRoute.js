const getProjectDetails = require("../middlewares/getProjectDetails");
const getUserDetails = require("../middlewares/getUserDetails");
const Schema = require("../models/Schema");
const express = require("express");
const router = express.Router();
const {
  createSchema,
  getSchema,
  deleteSchema,
  updateSchema,
  getUserSchemas,
  getAllData,
} = require("../controllers/schemaController");

router
  .route("/createSchema")
  .post(getProjectDetails, getUserDetails, createSchema);
router
  .route("/getSchema/:id")
  .get(getUserDetails, getSchema);
router.route("/getUserSchemas").get(getUserDetails, getUserSchemas);
router
  .route("/deleteSchema/:id")
  .delete(getUserDetails, deleteSchema);
// To be worked on
router.route("/updateSchema/:id").put(getUserDetails, updateSchema);
router.route("/getAllDocs/:id").get(getUserDetails, getAllData);
module.exports = router;
