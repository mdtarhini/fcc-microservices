// server.js
// where your node app starts

// init project
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Url = require("./models/urls");
const bodyParser = require("body-parser");
const validator = require("validator");
const dns = require("dns");

var app = express();
app.listen(3001);
app.set("view engine", "ejs");
dotenv.config();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204
// connect to mongoose
mongoose
  .connect(process.env.dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Succesfully connected to db");
  })
  .catch((err) => console.log(err));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  // res.sendFile(__dirname + "/views/index.html");
  res.render("index");
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api/timestamp/:date_string?", (req, res) => {
  // res.render("index");
  const dateString = req.params.date_string;
  let date;
  if (!dateString) {
    date = new Date();
  } else if (!Number.isNaN(Number(dateString))) {
    date = new Date(Number(dateString));
  } else {
    date = new Date(dateString);
    if (date == "Invalid Date") {
      res.json({ error: "Invalid Date" });
    }
  }
  if (date && date != "Invalid Date") {
    res.json({ unix: date.getTime(), utc: date.toUTCString() });
  }
});

app.get("/api/whoami", (req, res) => {
  res.json({
    ipaddress: req.ip,
    language: req.headers["accept-language"],
    software: req.headers["user-agent"],
  });
});

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/api/shorturl/new", (req, res, next) => {
  console.log(req.body.actualURL);

  // check if the url is valid (from a string point of view, and that the domain is reachable (using dns))
  if (
    validator.isURL(req.body.actualURL, {
      protocols: ["http", "https"],
      require_protocol: true,
      require_host: true,
      require_valid_protocol: true,
    })
  ) {
    //get the host name and check if it is reachable with dns:
    dns.lookup(
      new URL(req.body.actualURL).hostname,

      (err, address) => {
        if (err) {
          res.json({
            error: "invalid URL",
          });
        } else {
          // Get the number of items in the collection (n) and give (n+1) as an shortened id for the new url
          let numberOfShortenedURLs;
          Url.find()
            .then((result) => {
              numberOfShortenedURLs = result.length;
              console.log(numberOfShortenedURLs);
              const url = new Url({
                actualURL: req.body.actualURL,
                shortenedURL: numberOfShortenedURLs + 1,
              });
              url
                .save()
                .then((result) => {
                  console.log(result);
                  res.json({
                    url: req.body.actualURL,
                    shortenedURL: numberOfShortenedURLs + 1,
                  });
                })
                .catch((err) => {
                  console.log(err);
                  next();
                });
            })
            .catch((err) => {
              console.log(err);
              next();
            });
        }
      }
    );
  } else {
    res.json({
      error: "invalid URL",
    });
  }
});

// listen for requests :)
// var listener = app.listen(process.env.PORT, function () {
//   console.log("Your app is listening on port " + listener.address().port);
// });
