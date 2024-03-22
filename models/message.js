const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  message: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  postedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);
