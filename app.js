// app.js
var fs = require('fs');
const express  = require('express');
const path   = require('path');
const flash    = require('connect-flash');
const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const session      = require('cookie-session');
const mysql = require('mysql2');
var https = require('https');

const app      = express();
const port     = process.env.PORT || 8009;

app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.set('view engine', 'ejs'); // set up ejs for templating
app.use(express.static(__dirname + './../public'));
app.use('/images',express.static(path.join(__dirname, 'public/images')));
app.use('/js',express.static(path.join(__dirname, 'public/js')));
app.use('/css',express.static(path.join(__dirname, 'public/css')));
app.use('/fonts',express.static(path.join(__dirname, 'public/fonts')));
app.use('/uploads',express.static(path.join(__dirname, 'public/uploads')));

global.SITE_NAME = 'CRM Admin Section' 
global.SITE_URL = 'http://localhost:8009/'

app.use(cookieParser());
app.use(session({ secret: 'ilovescotchscotchyscotchscotch', cookie: { maxAge: 60 * 60 * 1000 }, resave: true, saveUninitialized: true }))
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./config/routes.js')(app);

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);