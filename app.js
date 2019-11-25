var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var dotenv = require("dotenv");
dotenv.config();

var bcrypt = require("bcrypt");
var mongoose = require("mongoose");
require("./models");
var User = mongoose.model("User");

var app = express();

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

let newUser = new User({
  email: "test@epost.no",
  passwordHash: bcrypt.hashSync("123456789", 10)
});
newUser.save(function(err) {
  //next(err, newUser);
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

app.post("/register", function(req, res, next) {
  console.log(req.body);
  next();
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
