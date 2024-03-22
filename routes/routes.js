const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const passport = require("passport");

router.get("/", (req, res) => res.render("index"));

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
      console.log(user);
      console.log("req pass: " + req.body.password);
      console.log("hashed pass: " + hashedPassword);

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

router.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
