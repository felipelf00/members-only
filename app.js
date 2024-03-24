const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MongoStore = require("connect-mongo");
const User = require("./models/user");
const routes = require("./routes/routes");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const mongoDb = process.env.MONGO_URI;
mongoose.connect(mongoDb);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
  })
);

app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

// define password strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Usuário incorreto" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Senha incorreta" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// make user object available throughout the entire app using locals object
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// app.get("/", (req, res) => res.render("index"));

// app.get("/sign-up", (req, res) => res.render("signup"));

// app.post("/sign-up", async (req, res, next) => {
//   try {
//     const user = new User({
//       name: req.body.name,
//       username: req.body.username,
//       passsword: req.body.password,
//     });
//     const result = await user.save();
//     res.redirect("/");
//   } catch (err) {
//     return next(err);
//   }
// });

app.use("/", routes);

app.listen(3000, () => console.log("App listening on port 3000"));
