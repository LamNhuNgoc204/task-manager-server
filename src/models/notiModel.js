const mongoose = require("mongoose");

const notiSchema = new mongoose.Schema(
  {
    content: { type: String },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

notiSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports =
  mongoose.models.notifications || mongoose.model("notification", notiSchema);
