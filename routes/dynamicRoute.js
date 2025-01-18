const express = require("express");
const router = express.Router();
const getSchemaDetails = require("../middlewares/getSchemaDetails");
const getProjectDetails = require("../middlewares/getProjectDetails");
const getUserDetails = require("../middlewares/getUserDetails");
const {
  getDynamic,
  postDynamic,
  putDynamic,
  deleteDynamic,
} = require("../controllers/dynamicController");
const getDynamicSchema = require("../middlewares/getDynamicSchema");
const Schema = require("../models/Schema");

router.route("/").get((req, res) => {
  res.send(
    "Welcome to DeviCode, this is a dynamic route, these are used for your APIs"
  );
});

router
  .route("/:schemaId/:route")
  .get(getSchemaDetails, getProjectDetails, getDynamicSchema, getDynamic)
  .post(getSchemaDetails, getProjectDetails, getDynamicSchema, postDynamic)
  .put(getSchemaDetails, getProjectDetails, getDynamicSchema, putDynamic)
  .delete(getSchemaDetails, getProjectDetails, getDynamicSchema, deleteDynamic);

module.exports = router;
