var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
require("./models");
var bcrypt = require("bcrypt");
var expressSession = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var dotenv = require("dotenv");
dotenv.config();

var User = mongoose.model("User");

var app = express();

// Add additional security
var helmet = require("helmet");
app.use(helmet());

mongoose
  .connect(
    "mongodb://" +
      process.env.MONGODB_ADDON_USER +
      ":" +
      process.env.MONGODB_ADDON_PASSWORD +
      "@" +
      process.env.MONGODB_ADDON_HOST +
      ":27017/" +
      process.env.MONGODB_ADDON_DB,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .catch(error => console.log("Error connecting database"));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());
app.use(passport.session());

app.use(
  expressSession({
    secret: process.env.EXPRESS_SESSION_SECRET
  })
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    function(email, password, next) {
      User.findOne(
        {
          email: email
        },
        function(err, user) {
          if (err) return next(err);
          if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
            return next({ message: "Email or password incorrect" });
          }
          next(null, user);
        }
      );
    }
  )
);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get("/login", function(req, res, next) {
  res.render("login", { title: "Express Sass Prosjekt" });
});

app.get("/main", function(req, res, next) {
  res.render("main", { title: "Express Sass Prosjekt Hovedside" });
});

app.get("/", function(req, res, next) {
  res.render("index", { title: "Express Sass Prosjekt" });
});

app.post("/login", passport.authenticate("local"), function(req, res) {
  // If this function gets called, authentication was successful.
  // `req.user` contains the authenticated user.
  console.log(req.user);
  res.render("main", { title: "Express Sass Prosjekt Hovedside" });
});

app.post(
  "/signup",
  passport.authenticate("signup-local", { failureRedirect: "/" }),
  function(req, res) {
    res.render("main", { title: "Express Sass Prosjekt Hovedside" });
  }
);

app.get("/loggut", function(req, res, next) {
  req.logout();
  res.redirect("/");
  console.log("Logger ut....");
});

app.post("/register", function(req, res, next) {
  let newUser = new User({
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 15)
  });
  newUser.save(function(err) {
    next(err, newUser);
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development

  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
