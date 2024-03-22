const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");

const MessageSchema = new Schema({
  message: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  postedAt: { type: Date, default: Date.now },
});

MessageSchema.virtual("formattedDate").get(function () {
  const dateTime = DateTime.fromJSDate(this.postedAt);

  const formattedDate = dateTime.toFormat("dd/MM/yyyy");

  return formattedDate;
});

MessageSchema.virtual("formattedTime").get(function () {
  const dateTime = DateTime.fromJSDate(this.postedAt);

  const formattedTime = dateTime.toFormat("HH:mm");

  return formattedTime;
});

module.exports = mongoose.model("Message", MessageSchema);
