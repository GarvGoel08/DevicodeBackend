const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  schema_name: {
    type: String,
    required: true,
  },
  fields: [
    {
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      isRequired: {
        type: Boolean,
        default: false,
      },
      isUnique: {
        type: Boolean,
        default: false,
      },
      isHashed: {
        type: Boolean,
        default: false,
      },
    },
  ],
  methodsList: [
    {
      method: {
        type: String,
        enum: ["CREATE", "READ", "UPDATE", "DELETE"],
        required: true,
      },
      route_name: {
        type: String,
        required: true,
      },
      restrictions: {
        type: [
          {
            type: {
              type: String,
              enum: ["SAME_SCHEMA", "RELEVANT_SCHEMA"],
              required: true,
            },
            related_schema_name: {
              type: String,
            },
            field_name: {
              type: String,
            },
            related_schema_id: {
              location: {
                type: String,
                enum: ["query", "body", "cookies", "headers"],
              },
              attribute_name: {
                type: String,
              },
            },
            location: {
              type: String,
              enum: ["query", "body", "cookies", "headers"],
              required: true,
            },
            attribute_name: {
              type: String,
              required: true,
            },
          },
        ],
        default: [],
      },
      sendToken: {
        type: Boolean,
        default: false,
      },
      expireInDays: {
        type: Number,
        default: 1,
      },
      tokenName: {
        type: String,
        default: "token",
      },
    },
  ],
  jwtToken: {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    tokenName: {
      type: String,
      required: function () {
        return this.jwtToken.isEnabled;
      },
    },
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Project",
  },
});

module.exports = mongoose.model("Schema", schema);
