const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const urlSchema = new Schema(
  {
    actualURL: { type: String, required: true },
    shortenedURL: { type: Number, required: true },
  },
  { timestamps: true }
);
// timestamps will be added auto
const Url = mongoose.model("Url", urlSchema); //Important: the name "Url" should be a singular of the plural collection name on mongodb ('urls)

module.exports = Url;
