// server.js
// where your node app starts

// init project
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Url = require("./models/urls");
const User = require("./models/user");
const Log = require("./models/log");
const bodyParser = require("body-parser");
const validator = require("validator");
const formidable = require("formidable");
const dns = require("dns");

var app = express();
app.listen(3002);
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
app.get("/", (req, res) => {
  res.render("index");
});
// ---------------------------------------------------------------------------------------------------//
//Below are the five views renderer
app.get("/timestamper", (req, res) => {
  res.render("timestamper");
});
app.get("/urlshortener", (req, res) => {
  res.render("urlShortener");
});
app.get("/whoami", (req, res) => {
  res.render("whoami");
});
app.get("/exercisetracker", (req, res) => {
  res.render("exerciseTracker");
});
app.get("/exercisetracker-forgot-id", (req, res) => {
  res.render("exerciseTracker_forgotID");
});
app.get("/exercisetracker-new-user", (req, res) => {
  res.render("exerciseTracker_NewUser");
});
app.get("/filesizer", (req, res) => {
  res.render("fileSize");
});

// ---------------------------------------------------------------------------------------------------//
//Below are the five 1pi endpoints
app.use(bodyParser.urlencoded({ extended: false }));

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

app.post("/api/timestamp", (req, res) => {
  const values = req.body;
  if (values.timestamp) {
    res.redirect(`/api/timestamp/${values.timestamp}`);
  } else {
    if (!values.hours) values.hours = 0;
    if (!values.minutes) values.minutes = 0;
    if (!values.minutes) values.seconds = 0;
    let date = new Date(
      values.year,
      values.month - 1,
      values.day,
      values.hours,
      values.minutes,
      values.seconds
    );
    if (date == "Invalid Date") {
      res.json({ error: "Invalid Date" });
    } else {
      res.json({ unix: date.getTime(), utc: date.toUTCString() });
    }
  }
});

app.get("/api/whoami", (req, res) => {
  res.json({
    ipaddress: req.ip,
    language: req.headers["accept-language"],
    software: req.headers["user-agent"],
  });
});

app.post("/api/shorturl/new", (req, res, next) => {
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
              // check if url was already shortened:
              let url = result.filter(
                (document) => document.actualURL === req.body.actualURL
              )[0];
              if (!url) {
                url = new Url({
                  actualURL: req.body.actualURL,
                  shortenedURL: numberOfShortenedURLs + 1,
                });
                url
                  .save()
                  .then((result) => {
                    console.log(result);
                    res.json({
                      original_url: url.actualURL,
                      short_url: url.shortenedURL,
                    });
                  })
                  .catch((err) => {
                    console.log(err);
                    next();
                  });
              } else {
                res.json({
                  original_url: url.actualURL,
                  short_url: url.shortenedURL,
                });
              }
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

app.get("/api/shorturl/:short_url", (req, res) => {
  // console.log(req.params.shortUrl);
  let short_url = req.params.short_url;
  // check if integer:
  if (parseInt(short_url) == short_url) {
    short_url = parseInt(short_url);
    // get the documents in mongodb and search for url with this shortened urls
    Url.find().then((result) => {
      let matchedDocument = result.filter(
        (document) => document.shortenedURL === short_url
      )[0];
      if (matchedDocument) {
        res.redirect(matchedDocument.actualURL);
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.redirect("/");
  }
});

// exercise tracker
app.post("/api/exercise/new-user", (req, res, next) => {
  // check if there are users by this Username:
  User.find()
    .then((result) => {
      let userNameTaken = result.filter(
        (user) => user.username === req.body.username
      ).length;
      if (userNameTaken) {
        res.json({ error: "username already taken" });
      } else {
        // Create a new user following the mongoose model.
        let newUser = new User({
          username: req.body.username,
          name: req.body.name,
          age: req.body.age,
        });
        newUser
          .save()
          .then((result) => {
            res.json({ _id: result._id, username: result.username });
          })
          .catch((err) => {
            console.log(err);
            res.json({ error: "could not create user" });
          });
      }
    })
    .catch((err) => {
      console.log("could not retreive user collection. Connection error", err);
    });
});

// forgot id
app.post("/api/exercise/forgot-id", (req, res, next) => {
  // check if there are users by this Username:
  User.find()
    .then((result) => {
      let forgottenUser = result.filter(
        (user) => user.username === req.body.username
      )[0];
      if (!forgottenUser) {
        res.json({ error: "username not found" });
      } else {
        res.json({ _id: forgottenUser._id, username: forgottenUser.username });
      }
    })
    .catch((err) => {
      console.log("could not retreive user collection. Connection error", err);
    });
});

const getDateOrToday = (strDate) => {
  let date = new Date(strDate);
  if (date == "Invalid Date") date = new Date();
  return `${date.getFullYear()}-${("0" + (date.getUTCMonth() + 1)).slice(
    -2
  )}-${date.getUTCDate()}`;
};
app.post("/api/exercise/add", (req, res, next) => {
  // check if the provided userId is valid

  User.findById(req.body.userid)
    .then((userResult) => {
      let newLog = new Log({
        userid: req.body.userid,
        duration: req.body.duration,
        description: req.body.description,
        date: getDateOrToday(req.body.date),
      });
      newLog
        .save()
        .then((result) => {
          res.json({
            _id: userResult._id,
            username: userResult.username,
            date: result.date,
            description: result.description,
            duration: result.duration,
          });
        })
        .catch((err) =>
          res.json({
            error: "could not add log. check if the provided information",
          })
        );
    })
    .catch((err) => {
      res.json({ error: "please provide a valid ID" });
    });
});

app.get("/api/exercise/users", (req, res) => {
  User.find()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      res.json({ error: "could not fetch users" });
    });
});

app.get("/api/exercise/log", (req, res) => {
  // Get the query parameters:
  // user-Id
  let userId = req.query.userId;
  let limit = req.query.limit;
  let fromDate = req.query.from;
  let toDate = req.query.to;
  if (!userId) res.json({ error: "userId must be specified" });
  else {
    // check if user exists:
    User.findById(userId)
      .then((userResult) => {
        Log.find()
          .then((result) => {
            let userLogs = result
              .filter((log) => log.userid === userId)
              .sort((a, b) => new Date(a.date) - new Date(b.date));
            if (limit) userLogs = userLogs.slice(0, limit);
            if (fromDate && toDate) {
              userLogs = userLogs.filter((log) => {
                if (
                  new Date(log.date) > new Date(fromDate) &&
                  new Date(log.date) < new Date(toDate)
                )
                  return true;
                return false;
              });
            }
            res.json({ user: userResult, logs: userLogs });
          })
          .catch((err) => {
            res.json({ error: "could not fetch log collection" });
          });
      })
      .catch((err) => {
        res.json({ error: "user does not exist" });
      });
  }
});

app.post("/api/file-metadata", (req, res, next) => {
  const form = formidable({ multiples: false });
  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }
    const file = files["upfile"];
    res.json({ name: file.name, size: file.size, type: file.type });
  });
});

// listen for requests :)
// var listener = app.listen(process.env.PORT, function () {
//   console.log("Your app is listening on port " + listener.address().port);
// });
