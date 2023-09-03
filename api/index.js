var express = require("express");
var router = express.Router();
var Workout = require("../models/Workout");

router.get("/", async function (req, res) {
  try {
    const recents = await Workout.find({ isDeleted: false })
      .sort({ created: -1 })
      .limit(3);
    res.status(200).json({
      recents: recents,
    });
  } catch (e) {
    res.status(500).json({
      message: "Internal server error",
      error: e,
    });
  }
});

module.exports = router;
