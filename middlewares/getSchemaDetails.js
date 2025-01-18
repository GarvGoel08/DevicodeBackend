const Schema = require("../models/Schema");

const getSchemaDetails = async (req, res, next) => {
    const schema = await Schema.findById(req.params.schemaId);
    if (!schema) {
        return res.status(404).json({
            success: false,
            message: "Schema not found",
        });
    }
    req.schema = schema;
    req.project_id = schema.project_id;
    next();
};

module.exports = getSchemaDetails;