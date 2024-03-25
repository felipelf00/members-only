const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Message = require("../models/message");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { body, validationResult } = require("express-validator");

router.get("/", async (req, res) => {
  const messages = await Message.find().sort({ postedAt: -1 }).populate("user");
  // console.log("user: " + res.locals.currentUser);
  res.render("index", { messages: messages, errors: [] });
});

router.get("/sign-up", (req, res) => res.render("signup", { errors: [] }));

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
  body("admin")
    .trim()
    .custom((value) => {
      if (value === "") return true;

      return value === process.env.ADMIN_PASS;
    })
    .withMessage("Credencial de admin inválida"),
  body("password").isLength({ min: 6 }),
  body("confirm").custom((value, { req }) => {
    return value === req.body.password;
  }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("/sign-up", { errors: errors.array() });
    }

    try {
      const isAdmin = req.body.admin === process.env.ADMIN_PASS;

      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
          return res.status(500).send("Error hashing password");
        }
        const user = await new User({
          name: req.body.name,
          username: req.body.username,
          password: hashedPassword,
          admin: isAdmin,
        });

        const result = await user.save();
        res.redirect("/", { errors: [] });
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
    .withMessage("Obrigatório informar usuário")
    .escape(),
  body("password")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Obrigatório informar senha")
    .escape(),
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = await Message.find()
        .sort({ postedAt: -1 })
        .populate("user");
      return res.render("index", {
        messages: messages,
        errors: errors.array(),
      });
    }

    // passport.authenticate("local", {
    //   successRedirect: "/",
    //   failureRedirect: "/",
    // })(req, res, next);

    passport.authenticate("local", async (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        // Authentication failed, user not found
        const messages = await Message.find()
          .sort({ postedAt: -1 })
          .populate("user");
        return res.render("index", {
          messages: messages,
          errors: [{ msg: "Usuário ou senha inválido" }],
        });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.redirect("/");
      });
    })(req, res, next);
  }
);

router.get("/new", (req, res) => {
  res.render("new-message", { errors: [] });
});

router.post(
  "/new",
  body("message")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("A mensagem deve ter entre 1 e 500 caracteres")
    .escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("new-message", { errors: errors.array() });
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

router.get("/delete/:id", async (req, res, next) => {
  try {
    const message = await Message.findOne({ _id: req.params.id }).populate(
      "user"
    );
    res.render("delete", { message: message });
  } catch (error) {
    console.error("Error in route handler:", error);
    res.status(500).send("An error occurred");
  }
});

router.post("/delete/:id", async (req, res, next) => {
  try {
    await Message.findByIdAndDelete(req.body.messageId);
    return res.redirect("/");
  } catch (err) {
    console.err(err);
    return res.status(500).send("Erro ao excluir mensagem");
  }
});

module.exports = router;
