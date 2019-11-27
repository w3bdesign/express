var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
require("./models");
// Replace Bcrypt with Argon2?
var bcrypt = require("bcrypt");

// https://flaviocopes.com/express-sessions/
//var expressSession = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var dotenv = require("dotenv");
dotenv.config();

var User = mongoose.model("User");

var app = express();

// Add additional security through Helmet
// See https://helmetjs.github.io/
var helmet = require("helmet");
app.use(helmet());

// Connect to our MongoDB database with the information provided in the .env file
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

// Use Express session?
/*app.use(
  expressSession({
    secret: process.env.EXPRESS_SESSION_SECRET
  })
);*/

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

/*
The user id (you provide as the second argument of the done function) is saved in the session and is later used to retrieve 
the whole object via the deserializeUser function.

serializeUser determines which data of the user object should be stored in the session. 
The result of the serializeUser method is attached to the session as req.session.passport.user = {}
*/

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Route for login page
app.get("/login", function(req, res, next) {
  res.render("login", { title: "Express Sass Prosjekt Innlogging" });
});

// Route for main page
app.get("/main", function(req, res, next) {
  res.render("main", { title: "Express Sass Prosjekt Hovedside" });
});

// Route for frontpage
app.get("/", function(req, res, next) {
  res.render("index", { title: "Express Sass Prosjekt" });
});

// If this function gets called, authentication was successful.
// `req.user` contains the authenticated user.
// Render the Main view with res.render if we are successful
app.post("/login", passport.authenticate("local"), function(req, res) {
  res.render("main", { title: "Express Sass Prosjekt Hovedside" });
});

// Try to authenticate if we access /signup by POST (after form submit)
app.post(
  "/signup",
  passport.authenticate("signup-local", { failureRedirect: "/" }),
  function(req, res) {
    res.render("main", { title: "Express Sass Prosjekt Hovedside" });
  }
);

// Logout and redirect to front page if we access /loggut
app.get("/loggut", function(req, res, next) {
  req.logout();
  res.redirect("/");
  console.log("Logger ut....");
});

// Create new user and hash the password with Bcrypt
app.post("/register", function(req, res, next) {
  let newUser = new User({
    // Set the email to the email value from the input field
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 15)
  });
  // Save the user to MongoDB within the newUser object
  newUser.save(function(err) {
    res.render("main", { title: "Express Sass Prosjekt Hovedside" });
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
