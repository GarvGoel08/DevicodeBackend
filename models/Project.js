const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    project_name: {
        type: String,
        required: true,
    },
    user_name: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Project", projectSchema);