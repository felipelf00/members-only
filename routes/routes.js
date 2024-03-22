const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Message = require("../models/message");
const bcrypt = require("bcryptjs");
const passport = require("passport");

router.get("/", async (req, res) => {
  const messages = await Message.find().populate("user");
  res.render("index", { messages: messages });
});

router.get("/sign-up", (req, res) => res.render("signup"));

router.post("/sign-up", async (req, res, next) => {
  try {
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      if (err) {
        return res.status(500).send("Error hashing password");
      }
      const user = new User({
        name: req.body.name,
        username: req.body.username,
        password: hashedPassword,
      });

      const result = await user.save();
      res.redirect("/");
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  })
);

router.get("/new", (req, res) => {
  res.render("new-message");
});

router.post("/new", async (req, res) => {
  try {
    const msg = new Message({
      message: req.body.message,
      user: res.locals.currentUser._id,
      postedAt: Date.now(),
    });

    await msg.save();
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

router.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
