const SchemaModel = require("../models/Schema");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { catchAsyncError } = require("../middlewares/catchAsyncError");
const Project = require("../models/Project");

exports.createSchema = catchAsyncError(async (req, res, next) => {
    const { schema_name, fields } = req.body;

    if (!schema_name || !fields || !Array.isArray(fields)) {
        return next(new ErrorHandler("Please provide schema_name and fields array", 400));
    }

    const existingSchema = await SchemaModel.findOne({ schema_name, project_id: req.project._id });
    if (existingSchema) {
        return next(new ErrorHandler("A schema with the same name already exists", 400));
    }
    const user_name = req.user.user_name.replace(/\s+/g, "_");
    const project_name = req.project.project_name.replace(/\s+/g, "_");
    const formattedSchemaName = `${user_name}_${project_name}_${schema_name.replace(/\s+/g, "_")}`;

    const dynamicFields = {};
    fields.forEach((field) => {
        const { name, type, isRequired, isUnique, isHashed } = field;
        if (!name || !type) {
            return next(new ErrorHandler("Each field must have a name and type", 400));
        }

        dynamicFields[name] = {
            type: mongoose.Schema.Types[type.toUpperCase()] || String,
            required: isRequired || false,
            unique: isUnique || false,
        };

        if (isHashed) {
            dynamicFields[name].select = false;
        }
    });

    const dynamicSchema = new mongoose.Schema(dynamicFields, { timestamps: true });
    const DynamicModel = mongoose.model(formattedSchemaName, dynamicSchema);

    const newSchema = await SchemaModel.create({
        schema_name,
        fields,
        project_id: req.project._id,
    });

    res.status(201).json({
        success: true,
        message: "Schema created successfully",
        schema: newSchema,
        dynamicSchemaName: formattedSchemaName,
    });
});

exports.getSchema = catchAsyncError(async (req, res, next) => {
    const schema = await SchemaModel.findById(req.params.id);
    if (!schema) {
        return next(new ErrorHandler("Schema not found", 404));
    }
    res.status(200).json({
        success: true,
        schema,
    });
});

exports.deleteSchema = catchAsyncError(async (req, res, next) => {
    const schema = await SchemaModel.findById(req.params.id);
    if (!schema) {
        return next(new ErrorHandler("Schema not found", 404));
    }
    const project_id = schema.project_id;
    const user_name = req.user.user_name;
    const project = await Project.findById(project_id);
    if (project.user_name !== user_name) {
        return next(new ErrorHandler("You are not authorized to delete this schema", 401));
    }
    await schema.deleteOne();
    res.status(200).json({
        success: true,
        message: "Schema deleted successfully",
    });
});

exports.getUserSchemas = catchAsyncError(async (req, res, next) => {
    const schemas = await SchemaModel.find({ project_id: req.query.project_id });
    res.status(200).json({
        success: true,
        schemas,
    });
});

exports.updateSchema = catchAsyncError(async (req, res, next) => {
    const { methodsList } = req.body;

    if (!methodsList || !Array.isArray(methodsList)) {
        return next(new ErrorHandler("Please provide a valid methodsList array", 400));
    }

    const schema = await SchemaModel.findById(req.params.id);
    if (!schema) {
        return next(new ErrorHandler("Schema not found", 404));
    }
    const project_id = schema.project_id;
    const user_name = req.user.user_name;
    const project = await Project.findById(project_id);
    if (project.user_name !== user_name) {
        return next(new ErrorHandler("You are not authorized to delete this schema", 401));
    }

    schema.methodsList = [];

    methodsList.forEach((method) => {
        const { method: methodType, route_name, restrictions, sendToken, tokenName, expireInDays } = method;

        if (!methodType || !route_name) {
            return next(new ErrorHandler("Each method must have a method type and route_name", 400));
        }

        schema.methodsList.push({
            method: methodType,
            route_name,
            restrictions: restrictions || [],
            sendToken: sendToken || false,
            tokenName: tokenName || "",
            expireInDays: expireInDays || 0
        });
    });

    await schema.save();

    res.status(200).json({
        success: true,
        message: "Methods added successfully",
        schema,
    });
});
