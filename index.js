require('dotenv').config()
let express = require('express');
let app = express();
const bodyParser = require('body-parser');
let path = require('path');
let session = require('express-session');
let passport = require('passport');
let localpassport = require('passport-local').Strategy;
let admin = require('./routes/admin.js');
let donor = require('./routes/donor.js');
let bank = require('./routes/bank.js');
let camp = require('./routes/camp.js');
let connection = require('./database.js');
let port=process.env.PORT||3000;
let flash = require('connect-flash');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(bodyParser.json()); 
// Add separate session options for admin and donor
let sessionOption = {
  secret: "AdminSecret",  
  resave: false,
  saveUninitialized: true
};

app.use(session(sessionOption))
app.use(flash());
app.use((req, res, next) => {
  res.locals.message = req.flash('message');
  next();
});

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
    try{
      const table = user.role === 'donor' ? 'donor' : user.role === 'bank_admin' ? 'bank_admin' : 'admin';
      connection.query(`SELECT * FROM ${table} WHERE id="${user.id}"`, function (err, result) {
          if (err)
            throw err
          if(result.length == 0) 
            return done(null, false);
          return done(null, result[0]);
      })
    }
    catch(err){
      console.log(err);
      done(err, false);
    }
});

// Use session for both admin and donor routes
app.use('/admin', admin);
app.use('/donor', donor);
app.use('/bank', bank);
app.use('/camp',camp);

// Default routes
app.get("/", function (req, res) {
  res.render("home.ejs");
});

app.get("/camp", function (req, res) {
  res.render("camp.ejs");
});

app.get("/availability", function (req, res) {
  res.render("blood_availability.ejs");
});

app.get("/about", function (req, res) {
  res.render("about.ejs");
});

app.get("/FAQs", function (req, res) {
  res.render("FAQs.ejs");
});

app.get("/contact", function (req, res) {
  res.render("contact.ejs");
});


app.listen(port, function () {
  console.log("Server started at port ",port);
});


