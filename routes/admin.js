var express = require("express");
var router = express.Router();
var multer = require("multer");
var upload = multer({ dest: "public/images/uploads/" });
var uploadVideo = multer({ dest: "public/videos/" });
var Workout = require("../models/Workout");
var Challenge = require("../models/Challenge");
var Food = require("../models/Food");
var fs = require("fs");

var checkAdmin = function (req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/adminlogin");
  }
};

router.get("/", checkAdmin, async function (req, res) {
  var workoutCount = await Workout.countDocuments({ isDeleted: false });
  var challengeCount = await Challenge.countDocuments();
  var foodCount = await Food.countDocuments();
  var recentWorkout = await Workout.find({ isDeleted: false })
    .sort({ created: -1 })
    .limit(5);
  var recentFood = await Food.find({}).sort({ created: -1 }).limit(5);
  res.render("admin/index", {
    workoutCount: workoutCount,
    challengeCount: challengeCount,
    foodCount: foodCount,
    recentFood: recentFood,
    recentWorkout: recentWorkout,
  });
});

router.get("/workoutadd", checkAdmin, function (req, res) {
  res.render("admin/workout/add");
});

router.post(
  "/workoutadd",
  checkAdmin,
  upload.single("cover"),
  async function (req, res) {
    var workout = new Workout();
    workout.title = req.body.title;
    workout.type = req.body.type;
    workout.category = req.body.category;
    workout.description = req.body.description;
    workout.createdBy = req.session.admin.id;
    if (req.file) workout.cover = "/images/uploads/" + req.file.filename;
    const data = await workout.save();
    console.log(data);
    res.redirect("/admin/workoutlist");
  }
);

router.get("/workoutlist", checkAdmin, async function (req, res) {
  var workouts = await Workout.find({
    createdBy: req.session.admin.id,
    isDeleted: false,
  });
  res.render("admin/workout/list", { workouts: workouts });
});

router.get("/workoutdetail/:id", checkAdmin, async function (req, res) {
  var workout = await Workout.findOne({
    _id: req.params.id,
    createdBy: req.session.admin.id,
  });
  var challenges = await Challenge.find({ workoutId: req.params.id });
  res.render("admin/workout/detail", {
    workout: workout,
    challenges: challenges,
  });
});

router.get("/workoutupdate/:id", checkAdmin, async function (req, res) {
  var workout = await Workout.findOne({
    _id: req.params.id,
    createdBy: req.session.admin.id,
  });

  res.render("admin/workout/update", {
    workout: workout,
  });
});

router.post(
  "/workoutupdate",
  checkAdmin,
  upload.single("cover"),
  async function (req, res) {
    var update = {
      title: req.body.title,
      type: req.body.type,
      category: req.body.category,
      description: req.body.description,
      updated: Date.now(),
    };
    if (req.file) update.cover = "/images/uploads/" + req.file.filename;
    const data = await Workout.findOneAndUpdate(
      { _id: req.body.id, createdBy: req.session.admin.id },
      { $set: update }
    );
    res.redirect("/admin/workoutlist");
  }
);

router.get("/workoutdelete/:id", checkAdmin, async function (req, res) {
  const data = await Workout.findOneAndUpdate(
    { createdBy: req.session.admin.id, _id: req.params.id },
    { $set: { isDeleted: true, updated: Date.now() } }
  );
  console.log(data);
  res.redirect("/admin/workoutlist");
});

router.get("/challengeadd", checkAdmin, async function (req, res) {
  const workouts = await Workout.find({
    createdBy: req.session.admin.id,
    isDeleted: false,
  });
  res.render("admin/challenge/add", { workouts: workouts });
});

router.post("/checkChallenge", checkAdmin, async function (req, res) {
  const challenge = await Challenge.findOne({
    workoutId: req.body.workoutId,
    day: req.body.day,
  });
  res.json({ status: challenge == null ? true : false });
});

router.post(
  "/challengeadd",
  checkAdmin,
  uploadVideo.single("video"),
  async function (req, res) {
    var challenge = new Challenge();
    challenge.title = req.body.title;
    challenge.day = req.body.day;
    challenge.workoutId = req.body.workoutId;
    challenge.description = req.body.description;
    if (req.file) challenge.video = "/videos/" + req.file.filename;
    challenge.createdBy = req.session.admin.id;
    var data = await challenge.save();
    console.log(data);
    res.redirect("/admin/workoutdetail/" + req.body.workoutId);
  }
);

router.get("/challengedetail/:id", checkAdmin, async function (req, res) {
  const challenge = await Challenge.findOne({
    _id: req.params.id,
    createdBy: req.session.admin.id,
  });
  res.render("admin/challenge/detail", { challenge: challenge });
});

router.get("/challengeupdate/:id", checkAdmin, async function (req, res) {
  const challenge = await Challenge.findOne({
    _id: req.params.id,
    createdBy: req.session.admin.id,
  });
  res.render("admin/challenge/update", {
    challenge: challenge,
  });
});

router.post(
  "/challengeupdate",
  checkAdmin,
  uploadVideo.single("video"),
  async function (req, res) {
    const challenge = await Challenge.findById(req.body.id);
    var update = {
      title: req.body.title,
      description: req.body.description,
    };
    if (req.file) {
      if (challenge.video) {
        try {
          fs.unlinkSync("public" + challenge.video);
        } catch (e) {
          console.log("Video delete error", e);
        }
      }
      update.video = "/videos/" + req.file.filename;
    }
    const data = await Challenge.findByIdAndUpdate(req.body.id, {
      $set: update,
    });
    res.redirect("/admin/workoutdetail/" + challenge.workoutId);
  }
);

router.get("/challengedelete/:id", checkAdmin, async function (req, res) {
  const data = await Challenge.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.session.admin.id,
  });
  if (data.video) {
    try {
      fs.unlinkSync("public" + data.video);
    } catch (e) {
      console.log("Video delete error");
    }
  }
  res.redirect("/admin/workoutdetail/" + data.workoutId);
});

router.get("/foodadd", checkAdmin, function (req, res) {
  res.render("admin/food/add");
});

router.post(
  "/foodadd",
  checkAdmin,
  upload.single("image"),
  async function (req, res) {
    var food = new Food();
    food.name = req.body.name;
    food.calorie = req.body.calorie;
    food.per = req.body.per;
    food.category = req.body.category;
    food.description = req.body.description;
    food.createdBy = req.session.admin.id;
    if (req.file) food.image = "/images/uploads/" + req.file.filename;
    const data = await food.save();
    console.log(data);
    res.redirect("/admin/foodlist");
  }
);

router.get("/foodlist", checkAdmin, async function (req, res) {
  var foods = await Food.find().populate("createdBy", "name");
  res.render("admin/food/list", { foods: foods });
});

router.get("/foodupdate/:id", checkAdmin, async function (req, res) {
  var food = await Food.findById(req.params.id);
  res.render("admin/food/update", { food: food });
});

router.post(
  "/foodupdate",
  checkAdmin,
  upload.single("image"),
  async function (req, res) {
    var food = await Food.findById(req.body.id);
    var update = {
      name: req.body.name,
      calorie: req.body.calorie,
      per: req.body.per,
      category: req.body.category,
      description: req.body.description,
      updated: Date.now(),
    };
    if (req.file) {
      if (food.image) {
        try {
          fs.unlinkSync("public" + food.image);
        } catch (e) {
          console.log("Image delete error");
        }
      }
      update.image = "/images/uploads/" + req.file.filename;
    }
    const data = await Food.findByIdAndUpdate(req.body.id, { $set: update });
    res.redirect("/admin/foodlist");
  }
);

router.get("/fooddelete/:id", checkAdmin, async function (req, res) {
  var data = await Food.findByIdAndDelete(req.params.id);
  if (data.image) {
    try {
      fs.unlinkSync("public" + data.image);
    } catch (e) {
      console.log("Image delete error");
    }
  }
  res.redirect("/admin/foodlist");
});

router.get("/signout", checkAdmin, async function (req, res) {
  req.session.destroy(function (err) {
    if (err) throw err;
    res.redirect("/");
  });
});

module.exports = router;
