var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "Express Sass Prosjekt" });
});

router.get("/main", function(req, res, next) {
  res.render("main", { title: "Hovedside" });
});

module.exports = router;
