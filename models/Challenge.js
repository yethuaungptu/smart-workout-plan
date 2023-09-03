var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ChallengeSchema = new Schema({
  workoutId: {
    type: Schema.Types.ObjectId,
    ref: "Workouts",
  },
  video: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  day: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "Admins",
  },
  created: {
    type: Date,
    default: Date.now(),
  },
  updated: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Challenges", ChallengeSchema);
