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
const debug = require("debug")("myapp:error");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const mongoDb = process.env.MONGO_URI;
mongoose.connect(mongoDb);
const db = mongoose.connection;
// db.on("error", console.error.bind(console, "mongo connection error"));
db.on("error", debug.bind(null, "mongo connection error"));

const app = express();
app.use(helmet());

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

app.use(compression());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});
// Apply rate limiter to all requests
app.use(limiter);

app.use("/", routes);

app.listen(3000, () => console.log("App listening on port 3000"));
