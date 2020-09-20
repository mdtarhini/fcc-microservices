const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const logSchema = new Schema(
  {
    userid: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: String, required: true },
  },
  { timestamps: true, collection: "ExerciseLogs" }
);
// timestamps will be added auto
const Log = mongoose.model("ExerciseLog", logSchema);

module.exports = Log;
