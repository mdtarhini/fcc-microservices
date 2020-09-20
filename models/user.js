const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: { type: String, required: true },
    name: { type: String, required: false },
    age: { type: Number, required: false },
  },
  { timestamps: true, collection: "ExerciseUsers" }
);
// timestamps will be added auto
const User = mongoose.model("ExerciseUser", userSchema);

module.exports = User;
