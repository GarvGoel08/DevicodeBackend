const Project = require("../models/Project");
const { catchAsyncError } = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createProject = catchAsyncError(async (req, res, next) => {
  try {
    const { project_name } = req.body;
    const user_name = req.user.user_name;
    const existingProject = await Project.findOne({
      project_name,
      user_name,
    });
    if (existingProject) {
      return next(
        new ErrorHandler("A project with the same name already exists", 400)
      );
    }
    const project = await Project.create({
      project_name,
      user_name,
    });
    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

exports.getUserProducts = catchAsyncError(async (req, res, next) => {
  try {
    const projects = await Project.find({ user_name: req.user.user_name });
    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

exports.deleteProject = catchAsyncError(async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
    }
    const user_name = req.user.user_name;
    if (project.user_name !== user_name) {
      return next(
        new ErrorHandler("You are not authorized to delete this project", 401)
      );
    }
    await project.deleteOne();
    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

exports.updateProject = catchAsyncError(async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    const { project_name } = req.body;
    const user_name = req.user.user_name;
    const existingProject = await Project.findOne({
      project_name,
      user_name,
    });
    if (existingProject) {
      return next(
        new ErrorHandler("A project with the same name already exists", 400)
      );
    }
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
    }
    if (project.user_name !== user_name) {
      return next(
        new ErrorHandler("You are not authorized to update this project", 401)
      );
    }
    project.project_name = req.body.project_name;
    await project.save();
    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

exports.getProject = catchAsyncError(async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return next(new ErrorHandler("Project not found", 404));
    }
    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
