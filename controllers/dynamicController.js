const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Helper function to build query for non-hashed fields
const buildQueryForNonHashed = (req, methodRestrictions) => {
  const query = {};
  const methodRestrictionsSameSchema = methodRestrictions.filter(
    (restriction) => restriction.type === "SAME_SCHEMA"
  );

  methodRestrictionsSameSchema.forEach((restriction) => {
    let incomingValue;

    switch (restriction.location) {
      case "query":
        incomingValue = req.query[restriction.attribute_name];
        break;
      case "body":
        incomingValue = req.body[restriction.attribute_name];
        break;
      case "headers":
        incomingValue = req.headers[restriction.attribute_name.toLowerCase()];
        break;
      case "cookies":
        const token = req.cookies[restriction.attribute_name];
        if (!token) throw new Error("JWT token not found in cookies");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        incomingValue = decoded[restriction.attribute_name];
        break;
      default:
        throw new Error(
          `Invalid restriction location: ${restriction.location}`
        );
    }

    const schemaField = req.schema.fields.find(
      (field) => field.name === restriction.field_name
    );

    if (!schemaField?.isHashed) {
      query[restriction.field_name] = incomingValue;
    }
  });

  return query;
};

// Helper function to validate RELEVANT_SCHEMA
const validateRelevantSchema = async (req, methodRestrictions) => {
  const relevantSchemaRestrictions = methodRestrictions.filter(
    (restriction) => restriction.type === "RELEVANT_SCHEMA"
  );

  for (const restriction of relevantSchemaRestrictions) {
    let incomingValue;

    switch (restriction.related_schema_id.location) {
      case "query":
        incomingValue = req.query[restriction.related_schema_id.attribute_name];
        break;
      case "body":
        incomingValue = req.body[restriction.related_schema_id.attribute_name];
        break;
      case "headers":
        incomingValue =
          req.headers[
            restriction.related_schema_id.attribute_name.toLowerCase()
          ];
        break;
      case "cookies":
        const token = req.cookies[restriction.related_schema_id.attribute_name];
        if (!token) throw new Error("JWT token not found in cookies");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        incomingValue = decoded[restriction.related_schema_id.attribute_name];
        break;
      default:
        throw new Error(
          `Invalid restriction location: ${restriction.related_schema_id.location}`
        );
    }

    const { user_name, project_name } = req.project;
    const relatedSchemaName =
      `${user_name}_${project_name}_${restriction.related_schema_name}`.replace(
        /\s+/g,
        "_"
      );

    // Fetch Related Schema Model
    const RelatedModel =
      mongoose.models[relatedSchemaName] ||
      mongoose.model(
        relatedSchemaName,
        new mongoose.Schema({}, { strict: false })
      );

    const relatedRecords = await RelatedModel.findById(incomingValue);

    let incomingFieldValue;
    switch (restriction.location) {
      case "query":
        incomingFieldValue = req.query[restriction.attribute_name];
        break;
      case "body":
        incomingFieldValue = req.body[restriction.attribute_name];
        break;
      case "headers":
        incomingFieldValue =
          req.headers[restriction.attribute_name.toLowerCase()];
        break;
      case "cookies":
        incomingFieldValue = req.cookies[restriction.attribute_name];
        break;
      default:
        throw new Error(
          `Invalid restriction location: ${restriction.location}`
        );
    }
    if (!relatedRecords) {
      throw new Error(
        `No records found in the related schema: ${relatedSchemaName}`
      );
    }

    const schemaField = req.schema.fields.find(
      (field) => field.name === restriction.field_name
    );


    const isValid = () => {
      const relatedFieldValue = relatedRecords[restriction.field_name];

      console.log(incomingFieldValue, relatedFieldValue);
      if (schemaField?.isHashed) {
        return bcrypt.compareSync(incomingFieldValue, relatedFieldValue);
      }
      
      return incomingFieldValue === relatedFieldValue;
    }

    const validity = isValid();

    if (!validity) {
      throw new Error(`Validation failed for field: ${restriction.field_name}`);
    }
  }

  return true;
};

// GET Dynamic
exports.getDynamic = async (req, res) => {
  try {
    const { methodsList } = req.schema;
    const route = req.params.route;

    const methodDetails = methodsList.find(
      (method) => method.route_name === route && method.method === "READ"
    );
    if (!methodDetails) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized operation" });
    }

    const isValid = await validateRelevantSchema(
      req,
      methodDetails.restrictions
    );
    if (!isValid) {
      return res
        .status(403)
        .json({ success: false, message: "Validation failed" });
    }

    const query = buildQueryForNonHashed(req, methodDetails.restrictions);
    if (req.query.id) {
      query._id = req.query.id;
    }

    const records = req.query.id
      ? [await req.dynamicModel.findById(req.query.id)]
      : await req.dynamicModel.find(query);

    if (!records.length || records.some((record) => !record)) {
      return res.status(404).json({ success: false, message: "No data found" });
    }

    for (const restriction of methodDetails.restrictions) {
      const schemaField = req.schema.fields.find(
        (field) => field.name === restriction.field_name
      );
      if (schemaField?.isHashed) {
        const incomingValue =
          req.body[restriction.attribute_name] ||
          req.query[restriction.attribute_name];
        const isValid = records.some((record) =>
          bcrypt.compareSync(incomingValue, record[restriction.field_name])
        );
        if (!isValid) {
          return res
            .status(403)
            .json({ success: false, message: "Restriction check failed" });
        }
      }
    }
    if (records.length === 1 && methodDetails.sendToken) {
      const token = jwt.sign(
        { [methodDetails.tokenName]: records[0].id },
        process.env.JWT_SECRET,
        {
          expiresIn: `${methodDetails.expireInDays}d`,
        }
      );

      res.cookie(methodDetails.tokenName, token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(
          Date.now() + methodDetails.expireInDays * 24 * 60 * 60 * 1000
        ),
      });
    }

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADD Dynamic
exports.postDynamic = async (req, res) => {
  try {
    const { methodsList } = req.schema;
    const route = req.params.route;

    const methodDetails = methodsList.find(
      (method) => method.route_name === route && method.method === "CREATE"
    );
    if (!methodDetails) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized operation" });
    }

    const isValid = await validateRelevantSchema(
      req,
      methodDetails.restrictions
    );
    if (!isValid) {
      return res
        .status(403)
        .json({ success: false, message: "Validation failed" });
    }
    const query = buildQueryForNonHashed(req, methodDetails.restrictions);

    const records = await req.dynamicModel.find(query);

    for (const restriction of methodDetails.restrictions) {
      const schemaField = req.schema.fields.find(
        (field) => field.name === restriction.field_name
      );
      if (schemaField?.isHashed) {
        const incomingValue = req.body[restriction.attribute_name];
        const isValid = records.some((record) =>
          bcrypt.compareSync(incomingValue, record[restriction.field_name])
        );
        if (!isValid) {
          return res
            .status(403)
            .json({ success: false, message: "Restriction check failed" });
        }
      }
    }

    const { fields } = req.schema;

    for (const field of fields) {
      if (field.isHashed && req.body[field.name]) {
        req.body[field.name] = await bcrypt.hash(req.body[field.name], 10);
      }
    }

    const newData = await req.dynamicModel.create(req.body);

    if (methodDetails.sendToken && newData) {
      const token = jwt.sign(
        { [methodDetails.tokenName]: newData.id },
        process.env.JWT_SECRET,
        {
          expiresIn: `${methodDetails.expireInDays}d`,
        }
      );
      res.cookie(methodDetails.tokenName, token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(
          Date.now() + methodDetails.expireInDays * 24 * 60 * 60 * 1000
        ),
      });
    }

    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Dynamic
exports.putDynamic = async (req, res) => {
  try {
    const { methodsList } = req.schema;
    const route = req.params.route;

    const methodDetails = methodsList.find(
      (method) => method.route_name === route && method.method === "UPDATE"
    );
    if (!methodDetails) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized operation" });
    }

    const isValid = await validateRelevantSchema(
      req,
      methodDetails.restrictions
    );
    if (!isValid) {
      return res
        .status(403)
        .json({ success: false, message: "Validation failed" });
    }
    const query = buildQueryForNonHashed(req, methodDetails.restrictions);

    const records = await req.dynamicModel.find(query);

    if (!records.length) {
      return res.status(404).json({ success: false, message: "No data found" });
    }

    for (const restriction of methodDetails.restrictions) {
      const schemaField = req.schema.fields.find(
        (field) => field.name === restriction.field_name
      );
      if (schemaField?.isHashed) {
        const incomingValue = req.body[restriction.attribute_name];
        const isValid = records.some((record) =>
          bcrypt.compareSync(incomingValue, record[restriction.field_name])
        );
        if (!isValid) {
          return res
            .status(403)
            .json({ success: false, message: "Restriction check failed" });
        }
      }
    }

    const { fields } = req.schema;

    for (const field of fields) {
      if (field.isHashed && req.body[field.name]) {
        req.body[field.name] = await bcrypt.hash(req.body[field.name], 10);
      }
    }

    const updatedData = await req.dynamicModel.findOneAndUpdate(
      query,
      req.body,
      { new: true }
    );

    if (methodDetails.sendToken && updatedData) {
      const token = jwt.sign(
        { [methodDetails.tokenName]: updatedData.id },
        process.env.JWT_SECRET,
        {
          expiresIn: `${methodDetails.expireInDays}d`,
        }
      );
      res.cookie(methodDetails.tokenName, token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(
          Date.now() + methodDetails.expireInDays * 24 * 60 * 60 * 1000
        ),
      });
    }

    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Dynamic
exports.deleteDynamic = async (req, res) => {
  try {
    const { methodsList } = req.schema;
    const route = req.params.route;

    const methodDetails = methodsList.find(
      (method) => method.route_name === route && method.method === "DELETE"
    );
    if (!methodDetails) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized operation" });
    }

    const isValid = await validateRelevantSchema(
      req,
      methodDetails.restrictions
    );
    if (!isValid) {
      return res
        .status(403)
        .json({ success: false, message: "Validation failed" });
    }

    const query = buildQueryForNonHashed(req, methodDetails.restrictions);

    const records = await req.dynamicModel.find(query);

    if (!records.length) {
      return res.status(404).json({ success: false, message: "No data found" });
    }

    for (const restriction of methodDetails.restrictions) {
      const schemaField = req.schema.fields.find(
        (field) => field.name === restriction.field_name
      );
      if (schemaField?.isHashed) {
        const incomingValue = req.body[restriction.attribute_name];
        const isValid = records.some((record) =>
          bcrypt.compareSync(incomingValue, record[restriction.field_name])
        );
        if (!isValid) {
          return res
            .status(403)
            .json({ success: false, message: "Restriction check failed" });
        }
      }
    }

    const deletedData = await req.dynamicModel.findOneAndDelete(query);

    res
      .status(200)
      .json({ success: true, message: "Data deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
