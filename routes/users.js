var express = require("express");
var router = express.Router();
var User = require("../models/User");

/* GET users listing. */

var checkUser = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};
router.get("/", checkUser, async function (req, res, next) {
  const user = await User.findById(req.session.user.id).populate(
    "activeWorkout",
    "title"
  );
  res.render("users/index", { user: user });
});

router.get("/logout", checkUser, function (req, res) {
  req.session.destroy(function (err) {
    if (err) throw err;
    res.redirect("/");
  });
});

router.post("/active", checkUser, async function (req, res) {
  try {
    const update = {
      activeWorkout: req.body.id,
      currentDay: 1,
    };
    const user = await User.findByIdAndUpdate(req.session.user.id, {
      $set: update,
    });
    req.session.user.activeWorkout = update.activeWorkout;
    req.session.user.currentDay = update.currentDay;
    res.json({ status: true });
  } catch (e) {
    console.log(e);
    res.json({ status: false });
  }
});

router.post("/completeChallenge", checkUser, async function (req, res) {
  var update = {
    currentDay: Number(req.body.day) + 1,
  };
  try {
    const data = await User.findByIdAndUpdate(req.session.user.id, {
      $set: update,
    });
    req.session.user.currentDay = update.currentDay;
    res.json({ status: true });
  } catch (e) {
    res.json({ status: false });
  }
});

router.post("/reset", checkUser, async function (req, res) {
  const update = {
    activeWorkout: 1,
    currentDay: 1,
  };
  try {
    const data = await User.findByIdAndUpdate(req.session.user.id, {
      $unset: update,
    });
    req.session.user.activeWorkout = "";
    req.session.user.currentDay = "";
    res.json({ status: true });
  } catch (e) {
    console.log(e);
    res.json({ status: false });
  }
});

module.exports = router;
