// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var moment = require("moment");

// Scraping tools
var cheerio = require("cheerio");
var axios = require("axios");

// Require all models
var db = require("./models");

// Initialize Express
var PORT = process.env.PORT || 3000;

var app = express();

// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/redditscraper", { useNewUrlParser: true });

// Routes
app.get("/", function(req, res) {
  res.send(index.html);
});


app.get("/scrape", function(req, res) {
  
  axios("https://old.reddit.com/r/coding").then(function(response) {
    var html = response.data;

    var $ = cheerio.load(html);
  var arrData = [];
    $("p.title").each(function(i, element) {
      
      var title = $(element).text();
      var link = $(element).children().attr("href");
      var articleCreated = moment().format("YYYY MM DD hh:mm:ss");

      var result = {
        title: title,
        link: link,
        articleCreated: articleCreated,
        isSaved: false
      }
      
      console.log(result);
      arrData.push(result);
      // db.Article.findOne({title:title}).then(function(data) {
  
      //   console.log(data);

      //   if(data === null) {
      //     db.Article.insert(result).then(function(){
      //       console.log("Inserted: ",result)
      //     })
        // }
      })
      // db.Article.insertMany(arrData).then(function(response){
      //   res.json(response);
      // })
      for (let i = 0; i < arrData.length; i++) {
        const element = arrData[i];
         db.Article.insert(element).then(function(response){
          console.log(response)
        }).catch(function(err){
          console.log(err);
        })
        res.json(arrData);
      }
      }).catch(function(err) {
        res.json(err);;
      })

    });



// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  
  db.Article
    .find({})
    .sort({articleCreated:-1})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {

  db.Article
    .findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {

  db.Note
    .create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating article to be saved
app.put("/saved/:id", function(req, res) {

  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { isSaved: true }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for getting saved article
app.get("/saved", function(req, res) {

  db.Article
    .find({ isSaved: true })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for deleting/updating saved article
app.put("/delete/:id", function(req, res) {

  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { isSaved: false }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/redditscraper";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
