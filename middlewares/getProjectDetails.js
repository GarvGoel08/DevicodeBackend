// Get Project either from req.body or req.params
const Project = require("../models/Project");

const getProjectDetails = (req, res, next) => {
    const project_id = req.body.project_id || req.query.project_id || req.project_id;
    if (!project_id) {
        return res.status(400).json({
            success: false,
            message: "Please provide project id",
        });
    }
    Project.findById(project_id)
        .then((project) => {
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found",
                });
            }
            req.project = project;
            next();
        })
        .catch((error) => {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        });
};

module.exports = getProjectDetails;