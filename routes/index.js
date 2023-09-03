var express = require("express");
var router = express.Router();
var Admin = require("../models/Admin");
var User = require("../models/User");
var Workout = require("../models/Workout");
var Challenge = require("../models/Challenge");
var Food = require("../models/Food");

/* GET home page. */
router.get("/", async function (req, res, next) {
  const recents = await Workout.find({ isDeleted: false })
    .sort({ created: -1 })
    .limit(3);
  console.log(recents);
  res.render("index", { title: "Express", recents: recents });
});

router.get("/adminregister", function (req, res) {
  res.render("admin/register");
});

router.post("/adminCheckValidate", async function (req, res) {
  const admin = await Admin.findOne({ email: req.body.email });
  res.json({
    dupStatus: admin == null ? true : false,
    keyStatus: req.body.key == "swp2023" ? true : false,
  });
});

router.post("/adminregister", async function (req, res) {
  var admin = new Admin();
  admin.name = req.body.name;
  admin.email = req.body.email;
  admin.password = req.body.password;
  var data = await admin.save();
  console.log(data);
  res.redirect("/adminlogin");
});

router.get("/adminlogin", function (req, res) {
  res.render("admin/login");
});

router.post("/adminlogin", async function (req, res) {
  var admin = await Admin.findOne({ email: req.body.email });
  if (admin != null && Admin.compare(req.body.password, admin.password)) {
    req.session.admin = {
      id: admin._id,
      email: admin.email,
      name: admin.name,
    };
    res.redirect("/admin");
  } else {
    res.redirect("/adminlogin");
  }
});

router.get("/register", function (req, res) {
  res.render("register");
});

router.post("/userCheckValidate", async function (req, res) {
  var user = await User.findOne({ email: req.body.email });
  res.json({ status: user == null ? true : false });
});

router.post("/register", async function (req, res) {
  var user = new User();
  user.name = req.body.name;
  user.email = req.body.email;
  user.password = req.body.password;
  const data = await user.save();
  console.log(data);
  res.redirect("/login");
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/login", async function (req, res) {
  var user = await User.findOne({ email: req.body.email });
  if (user != null && User.compare(req.body.password, user.password)) {
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      activeWorkout: user.activeWorkout,
      currentDay: user.currentDay,
    };
    res.redirect("/users");
  } else {
    res.redirect("/login");
  }
});

router.get("/workouts", async function (req, res) {
  const workouts = await Workout.find({ isDeleted: false }).populate(
    "createdBy",
    "name"
  );
  console.log(workouts);
  res.render("workouts", { workouts: workouts });
});

router.get("/workout/:id", async function (req, res) {
  const workout = await Workout.findById(req.params.id).populate(
    "createdBy",
    "name"
  );
  const challenges = await Challenge.find({ workoutId: req.params.id }).sort({
    day: 1,
  });
  console.log(workout);
  res.render("workout", { workout: workout, challenges: challenges });
});

router.get("/challenge/:id", async function (req, res) {
  var challenge = await Challenge.findById(req.params.id).populate(
    "workoutId",
    "title"
  );
  res.render("challenge", { challenge: challenge });
});

router.get("/food", async function (req, res) {
  var query = {};
  var category = "";
  var name = "";
  if (req.query.name && req.query.category) {
    name = req.query.name;
    category = req.query.category;
    query = {
      category: req.query.category,
      name: { $regex: ".*" + req.query.name + ".*" },
    };
  } else if (req.query.name) {
    name = req.query.name;
    query = { name: { $regex: ".*" + req.query.name + ".*" } };
  } else if (req.query.category) {
    category = req.query.category;
    query = { category: req.query.category };
  }
  var foods = await Food.find(query).sort({ category: 1 });
  res.render("food", { foods: foods, name: name, category: category });
});

router.get("/diet", function (req, res) {
  res.render("diet");
});

router.get("/aboutus", function (req, res) {
  res.render("aboutus");
});

module.exports = router;
