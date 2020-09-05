var express = require('express');
var router = express.Router();
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client("884649243530-8q2rtgkgv0eimaaai12afnchdd9addhu.apps.googleusercontent.com");
var argon2 = require('argon2');
var sanitizeHtml = require('sanitize-html');
var Isemail = require('isemail');


/* Default page */
router.get('/', function(req, res, next) {
    res.redirect('home');
});

function checkInput(input) {
    input = input.toLowerCase();
    if (input === null || input === undefined || input == "undefined" || input == "null" || input == "" || input.length == 0 || input.length > 128) {
        return false;
    } else {
        return true;
    }
}

/* CREATE NEW ACCOUNT */
router.post('/signup', async function(req, res, next) {

    var email = sanitizeHtml(req.body.email);
    var password = sanitizeHtml(req.body.password);
    var f_name = sanitizeHtml(req.body.f_name);
    var l_name = sanitizeHtml(req.body.l_name);

    //Check inputs
    if ( !checkInput(email) || !checkInput(password) || !checkInput(f_name) || !checkInput(l_name) || !Isemail.validate(email)) {
        res.sendStatus(400);
        return;
    }

    var default_pic = "/public/images/users/default.png";
    var default_availability = JSON.stringify([false,true,true,true,true,true,false]);

    try {
        const hash = await argon2.hash(password);
        var queryFields = [email, hash, f_name, l_name, default_availability, default_pic];
        req.pool.getConnection(function(err, connection) {
            if (err) {
                res.sendStatus(500);
                return;
            }
            var query = "INSERT INTO Users (email, password, name_first, name_last, availability, display_picture) VALUES (?, ?, ?, ?, ?, ?)";
            connection.query(query, queryFields, function(err, rows, fields) {
                connection.release();
                if (err) {
                    res.sendStatus(500);
                    console.log(err);
                    return;
                }
                req.pool.getConnection(function(err, connection) {
                    if (err) {
                        res.sendStatus(500);
                        return;
                    }
                    var query = "SELECT * FROM Users WHERE email = ? AND userID = ?";
                    connection.query(query, [email, rows.insertId], function(err, rows, fields) {
                        connection.release();
                        if (err) {
                            res.sendStatus(500);
                            console.log(err);
                            return;
                        }
                        //Confirm new user has been created to the console
                        console.log( "New User: " + req.body.email + "ID: (" + JSON.stringify(rows[0].userID) + ")" );
                        //Set user session
                        delete rows[0].password;
                        req.session.user = rows[0];
                        req.session.loggedin = true;
                        res.redirect("/home");

                    });
                });
            });
        });

    } catch (err) {
        res.sendStatus(500);
        console.log(err);
    }

});

/* LOG IN USER */
router.post('/login', function(req, res, next) {

    //Login with email
    if ('email' in req.body) {

        var email = sanitizeHtml(req.body.email);
        var password = sanitizeHtml(req.body.password);

        //Check inputs
        if ( !checkInput(email) || !checkInput(password) || !Isemail.validate(email)) {
            res.sendStatus(400);
            return;
        }

        req.pool.getConnection(function(err, connection){
            if (err) {
                res.sendStatus(500);
                return;
            }
            var query = "SELECT * FROM Users WHERE email = ?";
            connection.query(query, [email], async function(err, rows, fields) {
                connection.release();
                if (err) {
                    res.sendStatus(500);
                    return;
                }
                if (rows.length > 0) {
                    try {
                        if (await argon2.verify(rows[0].password, password)) {
                            delete rows[0].password;
                            req.session.user = rows[0];
                            req.session.loggedin = true;

                            console.log( "User logged in: " + email + "ID: (" + JSON.stringify(rows[0].userID) + ")" );
                            res.redirect("/home");
                        }
                        else {
                            res.redirect("back");
                        }
                    } catch (err) {
                        console.log(err);
                    }
                }
                else {
                    res.sendStatus(401);
                }
            });
        });
    }
    //With Google
    else if ('idtoken' in req.body) {

        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken: sanitizeHtml(req.body.idtoken),
                audience: "884649243530-8q2rtgkgv0eimaaai12afnchdd9addhu.apps.googleusercontent.com",
            });
            const payload = ticket.getPayload();
            const email = payload['email'];
            const f_name = payload['given_name'];
            const l_name = payload['family_name'];
            const pic = payload['picture'];

            //Check if new account
            req.pool.getConnection(function(err, connection) {
				if (err) {
					res.sendStatus(500);
					return;
				}
				var query = "SELECT * FROM Users WHERE email = ?";
				connection.query(query, email, function(err, rows, fields) {
					connection.release();
					if (err) {
						res.sendStatus(500);
						return;
					}
					if (rows.length > 0) {
					    //User is found -> log them in
					    delete rows[0].password;
                        req.session.user = rows[0];
                        req.session.loggedin = true;
                        console.log( "\tUser logged in: " + email + "ID: (" + JSON.stringify(rows[0].userID) + ")" );
                        res.redirect("/home");
					} else {
				        //User is not found -> Create an entry in the database
				        req.pool.getConnection(function(err, connection) {
            				if (err) {
            					res.sendStatus(500);
            					return;
            				}
            				var default_pic = "/public/images/users/default.png";
                            var default_availability = JSON.stringify([false,true,true,true,true,true,false]);
                            var default_password = "$argon2i$v=19$m=4096,t=3,p=1$Hi/3zDPPTNXPWZcKD/GACg$K6MP5OQeIl81fVU8C+ZRJgCO0sYWClJCmtQbxGaRsFY"
            				var query = "INSERT INTO Users (email, password, name_first, name_last, availability, display_picture) VALUES (?, ?, ?, ?, ?, ?)";
            				connection.query(query, [email, default_password, f_name, l_name, default_availability, pic], function(err, rows, fields) {
            					connection.release();
            					if (err) {
            						res.sendStatus(500);
            						return;
            					}
                                req.pool.getConnection(function(err, connection) {
                                    if (err) {
                                        res.sendStatus(500);
                                        return;
                                    }
                                    var query = "SELECT * FROM Users WHERE email = ?";
                                    connection.query(query, [email], function(err, rows, fields) {
                                        connection.release();
                                        if (err) {
                                            res.sendStatus(500);
                                            console.log(err);
                                            return;
                                        }
                                        //Confirm new user has been created to the console
                                        console.log( "\tNew User: " + email + "ID: (" + JSON.stringify(rows[0].userID) + ")" );
                                        //Set user session
                                        delete rows[0].password;
                                        req.session.user = rows[0];
                                        req.session.loggedin = true;
                                        res.redirect("/home");
                                    });
                                });
            				});
            			});
					}
				});
			});
        }
        verify().catch(console.error);
    }
});




/* LOG OUT USER */
router.post('/logout', function(req, res, next) {
    delete req.session.user;
    req.session.loggedin = false;
    res.status(200);
    res.redirect("/landing");
});


module.exports = router;
