const mongoose = require("mongoose");

const taskSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    important: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    deadline: { type: Date, required: true },
    reminders: [{ type: Date }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    subtasks: [
      {
        title: { type: String },
        completed: { type: Boolean, default: false },
      },
    ],
    checklist: [
      {
        item: { type: String },
        checked: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

taskSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("Task", taskSchema);
