var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var mysql = require('mysql');
var argon2 = require('argon2');


//create a 'pool' (group) of connections to be used for connecting with our SQL server
var dbConnectionPool = mysql.createPool({
	host: "localhost",
	database: "Tasker"
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

//
app.use(function(req, res, next) {
	req.pool = dbConnectionPool;
	next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//Session creation
app.use( session({
	secret: 'Yt3uNtzfZJ41JjkR6583R8SOEW45na8D5kO9H78bAZ7Ky0',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false }
}));

//Function used for manually overriding session ID
app.get('/set_session', function(req, res) {
	let sessionData = req.session;
	sessionData.user = {};
	sessionData.user.userID = parseInt(req.query.uid);
	sessionData.loggedin = true;
	res.json(sessionData.user);
});

app.get('/get_session', function(req, res) {
	res.json(req.session.user.userID);
});


//Redirect to landing page if not logged in
app.get('/home', function(req, res, next) {
	if ( typeof req.session.user === 'undefined') {
		res.redirect('/landing');
	}
	else {
		next();
	}
});
//Redirect to landing page if not logged in
app.get('/teams', function(req, res, next) {
	if ( typeof req.session.user === 'undefined') {
		res.redirect('/landing');
	}
	else {
		next();
	}
});
//Redirect to home if logged in
app.get('/landing', function(req, res, next) {
	if ( typeof req.session.user !== 'undefined') {
		res.redirect('/landing');
	}
	else {
		next();
	}
});



app.use(express.static(__dirname + '/public', {
	extensions: ['html']
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


module.exports = app;
