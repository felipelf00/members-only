const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Message = require("../models/message");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { body, validationResult } = require("express-validator");

router.get("/", async (req, res) => {
  const messages = await Message.find().populate("user");
  res.render("index", { messages: messages });
});

router.get("/sign-up", (req, res) => res.render("signup"));

router.post(
  "/sign-up",
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Nome do usuário  deve ter entre 3 e 30 caracteres")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Nome do usuário só pode conter letras, números, - e _"),
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Nome deve ter entre 1 e 100 caracteres")
    .escape(),
  body("password").isLength({ min: 6 }),
  body("confirm").custom((value, { req }) => {
    return value === req.body.password;
  }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
  }
);

router.post(
  "/log-in",
  body("username")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Username is required")
    .escape(),
  body("password")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Password is required")
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/",
    })(req, res, next);
  }
);

router.get("/new", (req, res) => {
  res.render("new-message");
});

router.post(
  "/new",
  body("message")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Mensagem deve ter entre 1 e 500 caracteres")
    .escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
  }
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
