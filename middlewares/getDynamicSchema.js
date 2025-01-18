const mongoose = require("mongoose");

const getDynamicSchema = (req, res, next) => {
    try {
        const user_name = req.project.user_name.replace(/\s+/g, "_");
        const project_name = req.project.project_name.replace(/\s+/g, "_");
        const schema_name = req.schema.schema_name.replace(/\s+/g, "_");

        const formattedSchemaName = `${user_name}_${project_name}_${schema_name}`;

        const dynamicSchemaDefinition = {};
        req.schema.fields.forEach((field) => {
            dynamicSchemaDefinition[field.name] = {
                type: mongoose.Schema.Types[field.type] || String,
                required: field.isRequired || false,
                unique: field.isUnique || false,
            };
        });

        let DynamicModel;
        if (mongoose.models[formattedSchemaName]) {
            DynamicModel = mongoose.models[formattedSchemaName];
        } else {
            const dynamicSchema = new mongoose.Schema(dynamicSchemaDefinition, { timestamps: true });
            DynamicModel = mongoose.model(formattedSchemaName, dynamicSchema);
        }

        req.dynamicModel = DynamicModel;

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = getDynamicSchema;
