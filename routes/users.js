var express = require('express');
var router = express.Router();
var argon2 = require('argon2');
var sanitizeHtml = require('sanitize-html');



function checkInput(input) {
    input = input.toLowerCase();
    if (input === null || input === undefined || input == "undefined" || input == "null" || input == "" || input.length == 0 || input.length > 128) {
        return false;
    } else {
        return true;
    }
}



/* Check Authentication */
router.use(function(req, res, next) {
	if ( !("user" in req.session) ) {
		res.sendStatus(403);
		return;
	}
	next();
});


//Middleware to Authenticate Function Useage:

//Authenticate Task Ownership before marking task as complete
router.use('/task/complete', function(req, res, next) {
	var taskID = sanitizeHtml(req.query.taskID);
	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "SELECT * FROM Tasks WHERE taskID = ? AND userID = ?";
		connection.query(query, [taskID, req.session.user.userID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			if (rows.length > 0) {
				next();
			} else {
				console.log("Task does not belong to user");
				res.sendStatus(403);
				return;
			}
		});
	});
});

//Authenticate User is in team
router.use('/team/', function(req, res, next) {
	if (req.query.teamID === undefined) {
		var teamID = sanitizeHtml(req.body.teamID);
	} else {
		var teamID = sanitizeHtml(req.query.teamID);
	}
	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "SELECT * FROM TeamMemberships WHERE teamID = ? AND userID = ?";
		connection.query(query, [teamID, req.session.user.userID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			if (rows.length > 0) {
				next();
			} else {
				console.log("User is not in team");
				res.sendStatus(403);
				return;
			}
		});
	});
});

//Authenticate User is a manager of the team
router.use('/team/manage/', function(req, res, next) {
	if (req.query.teamID === undefined) {
		var teamID = sanitizeHtml(req.body.teamID);
	} else {
		var teamID = sanitizeHtml(req.query.teamID);
	}
	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "SELECT * FROM TeamMemberships WHERE teamID = ? AND userID = ?";
		connection.query(query, [teamID, req.session.user.userID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			if (rows[0].is_manager) {
				next();
			} else {
				console.log("User is not a manager of team");
				res.sendStatus(403);
				return;
			}
		});
	});
});

//Authenticate the task belongs to the team
router.use('/team/manage/task', function(req, res, next) {

	if (req.query.teamID === undefined) {
		var teamID = sanitizeHtml(req.body.teamID);
		var taskID = sanitizeHtml(req.body.taskID);
	} else {
		var teamID = sanitizeHtml(req.query.teamID);
		var taskID = sanitizeHtml(req.query.taskID);
	}

	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "SELECT * FROM Tasks WHERE taskID = ? AND teamID = ?";
		connection.query(query, [taskID, teamID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			if (rows.length > 0) {
				next();
			} else {
				console.log("Task does not belong to team");
				res.sendStatus(403);
				return;
			}
		});
	});
});



/* Get all a Users Tasks filters: all, today, this week, by team */
router.get('/tasks', function(req, res) {

	let view = sanitizeHtml(req.query.view);

	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}

		var queryFields = [ req.session.user.userID ];

		//Default query is for all tasks
		var query = "SELECT * FROM Tasks WHERE userID = ?";

		//Only return tasks due today
		if (view == 'today') {
			query = "SELECT * FROM Tasks WHERE userID = ? AND TIMESTAMPDIFF(DAY, due_date, CURDATE()) = 0 AND TIMESTAMPDIFF(MONTH, due_date, CURDATE()) = 0 AND TIMESTAMPDIFF(YEAR, due_date, CURDATE()) = 0";
		}
		//Only return tasks due this week
		else if (view == 'week') {
			query = "SELECT * FROM Tasks WHERE userID = ? AND TIMESTAMPDIFF(DAY, CURDATE(), due_date) <= 7 AND TIMESTAMPDIFF(DAY, CURDATE(), due_date) >= 0";
		}
		//Only return tasks from a given team
		else if (view == 'team') {
			query = "SELECT * FROM Tasks WHERE userID = ? AND teamID = ?";
			queryFields.push( sanitizeHtml(req.query.teamID) );
		}

		connection.query(query, queryFields, function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			res.send(JSON.stringify(rows));
		});
	});
});


/* Updates all the tasks for the client */
router.post('/tasks/update', function(req, res) {

	let tasks = req.body;

	//Delete tasks that have been completed for 6 hours or have been overdue for 2 weeks time
	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}

		var query = "DELETE FROM Tasks WHERE TIMESTAMPDIFF(DAY, due_date, CURDATE()) >= 7 OR TIMESTAMPDIFF(HOUR, date_completed, CURDATE()) >= 6";
		connection.query(query, function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
		});
	});

	//Update the tasks
	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var tasksList = "";
		for (var i = 0; i < tasks.length-1; i++) {
			tasksList += "taskID = " + sanitizeHtml(tasks[i]) + " OR ";			//Sanitized
		}
		tasksList += "taskID = " + sanitizeHtml(tasks[tasks.length-1]);			//Sanitized


		//Build the final SQL query
		var query = "SELECT * FROM Tasks WHERE " + tasksList;
		var queryFields = [];

		connection.query(query, queryFields, function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			res.send(JSON.stringify(rows));
		});
	});
});


//Add a new task to the database
router.post('/task/new', function(req,res) {

	var newDate = new Date(req.body.newTask_date + "T" + req.body.newTask_time);
	var newTask = [req.body.newTask_assignee, req.body.newTask_team, req.body.newTask_name, req.body.newTask_desc, req.body.newTask_priority, newDate.toISOString().slice(0, 19).replace('T', ' ')];

	//Sanitize all parameters going into the task
	for (i in newTask) {
		newTask[i] = sanitizeHtml(newTask[i]);
	}

	//Check inputs
	for (i in newTask) {
		if (i != 3) {
			if (!checkInput(newTask[i])) {
				console.log(newTask[i]);
				res.sendStatus(400);
				return;
			}
		}
	}

	//Check priority is 0, 1 or 2
	if (parseInt(newTask[4]) < 0 || parseInt(newTask[4]) > 2 ) {
		console.log(parseInt(newTask[4]));
		res.sendStatus(400);
		return;
	}

	//Check due date is in the future
	if (newDate < (new Date())) {
		console.log("date");
		res.sendStatus(400);
		return;
	}

	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}

		var query = "INSERT INTO Tasks (userID, teamID, name, description, priority, due_date) VALUES (?,?,?,?,?,?)";
		connection.query(query, newTask, function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			res.sendStatus(200);
		});
	});

});

//Update the database to toggle a tasks complete status, if it is being marked as completed add a completed date too
router.post("/task/complete", function(req, res) {

	var taskID = sanitizeHtml(req.query.taskID);

	//Check current completion state of task
	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}

		var query = "SELECT complete_status FROM Tasks WHERE taskID = ? ";
		connection.query(query, taskID, function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}

			//Change status depending on previous result
			req.pool.getConnection(function(err, connection) {
				if (err) {
					res.sendStatus(500);
					return;
				}

				//If complete_status is true
				if (rows[0].complete_status == 0) {
					query = "UPDATE Tasks SET complete_status = 1, date_completed = NOW() WHERE taskID = ?";
				}
				//If complete_status is false
				else {
					query = "UPDATE Tasks SET complete_status = 0, date_completed = null WHERE taskID = ?";
				}
				connection.query(query, taskID, function(err, rows, fields) {
					connection.release();
					if (err) {
						res.sendStatus(500);
						return;
					}
				});
			});
		});
	});
	res.redirect('back');
});


/* Get all teams or one specific team */
//Or get all teams that the user is a manager of
router.get('/teams', function(req, res) {

	var isManager = sanitizeHtml(req.query.isManager);
	var teamID = sanitizeHtml(req.query.teamID);

	//Return all teams
	if (teamID === 'undefined') {

		//Return all teams
		if (isManager == 'undefined') {
			req.pool.getConnection(function(err, connection) {
				if (err) {
					res.sendStatus(500);
					return;
				}
				var query = "SELECT Teams.* FROM Teams INNER JOIN TeamMemberships ON Teams.teamID = TeamMemberships.teamID WHERE userID = ?";
				connection.query(query, req.session.user.userID, function(err, rows, fields) {
					connection.release();
					if (err) {
						res.sendStatus(500);
						return;
					}
					res.send(JSON.stringify(rows));
				});
			});
		}

		//Return only teams that the user is a manager of
		if (isManager == "true") {
			req.pool.getConnection(function(err, connection) {
				if (err) {
					res.sendStatus(500);
					return;
				}
				var query = "SELECT Teams.* FROM Teams INNER JOIN TeamMemberships ON Teams.teamID = TeamMemberships.teamID WHERE userID = ? AND TeamMemberships.is_manager = 1";
				connection.query(query, req.session.user.userID, function(err, rows, fields) {
					connection.release();
					if (err) {
						res.sendStatus(500);
						return;
					}
					res.send(JSON.stringify(rows));
				});
			});
		}
	}

	//Return a specific team
	else {

		req.pool.getConnection(function(err, connection) {
			if (err) {
				res.sendStatus(500);
				return;
			}
			var query = "SELECT * FROM Teams WHERE teamID = ?";
			connection.query(query, teamID, function(err, rows, fields) {
				connection.release();
				if (err) {
					res.sendStatus(500);
					return;
				}
				if (rows.length > 0) {
					res.send(JSON.stringify(rows));
				} else {
					res.sendStatus(404);
				}
			});
		});
	}
});

//Create a new team and add the founding member to it as a manager
router.post('/teams/new', function(req, res) {

	var newTeam_name = sanitizeHtml(req.body.newTeam_name);
	var newTeam_color = sanitizeHtml(req.body.newTeam_color);

	//Add the new team to the database
    req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "INSERT INTO Teams (name, color) VALUES (?, ?)";
		connection.query(query, [newTeam_name, newTeam_color], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}

			//Add the creator to the newly made team
			req.pool.getConnection(function(err, connection) {
				if (err) {
					res.sendStatus(500);
					return;
				}
				var query = "INSERT INTO TeamMemberships (userID, teamID, is_manager) VALUES (?, ?, 1)";
				connection.query(query, [req.session.user.userID, rows.insertId], function(err, rows, fields) {
					connection.release();
					if (err) {
						res.sendStatus(500);
						return;
					}
					res.redirect('back');
				});
			});
		});
	});
});

//Get all the members of a team and seperate them into an array of managers and one of users
router.get('/team/members', function(req, res) {

	var teamID = sanitizeHtml(req.query.teamID);
	var roles = sanitizeHtml(req.query.roles);
	var members = [];

	//Seperate into Managers and Users - For team page
	if (roles == "true"){

		//Get Managers
		req.pool.getConnection(function(err, connection) {
			if (err) {
				res.sendStatus(500);
				return;
			}
			var query = "SELECT Users.userID, Users.name_first, Users.name_last, Users.availability, Users.display_picture FROM Users INNER JOIN TeamMemberships ON Users.userID = TeamMemberships.UserID WHERE teamID = ? AND is_manager = 1";
			connection.query(query, teamID, function(err, rows, fields) {
				connection.release();
				if (err) {
					res.sendStatus(500);
					return;
				}
				members.push(rows);

				//Get Users
				req.pool.getConnection(function(err, connection) {
					if (err) {
						res.sendStatus(500);
						return;
					}
					var query = "SELECT Users.userID, Users.name_first, Users.name_last, Users.availability, Users.display_picture FROM Users INNER JOIN TeamMemberships ON Users.userID = TeamMemberships.UserID WHERE teamID = ? AND is_manager = 0";
					connection.query(query, teamID, function(err, rows, fields) {
						connection.release();
						if (err) {
							res.sendStatus(500);
							return;
						}
						members.push(rows);
						res.send(JSON.stringify(members));
					});
				});

			});
		});
	}

	//return all users regardless of role - for task creation (assignment of task)
	else {
		req.pool.getConnection(function(err, connection) {
			if (err) {
				res.sendStatus(500);
				return;
			}
			var query = "SELECT Users.userID, Users.name_first, Users.name_last, Users.availability, Users.display_picture FROM Users INNER JOIN TeamMemberships ON Users.userID = TeamMemberships.UserID WHERE teamID = ?";
			connection.query(query, teamID, function(err, rows, fields) {
				connection.release();
				if (err) {
					res.sendStatus(500);
					return;
				}
				res.send(JSON.stringify(rows));
			});
		});
	}
});

//Route to fetch all the tasks belonging to a team
router.get('/team/tasks', function(req, res) {
	let teamID = sanitizeHtml(req.query.teamID);

    req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "SELECT Tasks.* FROM Tasks WHERE teamID = ?";
		connection.query(query, teamID, function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			res.send(JSON.stringify(rows));
		});
	});
});

//Route used for user leaving a team
router.post('/team/leave', function(req, res) {

    var teamID = sanitizeHtml(req.query.teamID);

    //Delete the user/team membership from TeamMemberships table
    req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "DELETE FROM TeamMemberships WHERE userID = ? AND teamID = ?";
		connection.query(query, [req.session.user.userID, teamID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
            }
		});
    });
    //Delete that users tasks
    req.pool.getConnection(function(err, connection) {
        if (err) {
            res.sendStatus(500);
            return;
        }
        var query = "DELETE FROM Tasks WHERE userID = ? AND teamID = ?";
        connection.query(query, [req.session.user.userID, teamID], function(err, rows, fields) {
            connection.release();
            if (err) {
                res.sendStatus(500);
                return;
            }
            res.status(200);
            res.redirect('back');
        });
    });
});



//Route used for team management: add user to team
router.post('/team/manage/add', function(req, res) {
    var newUserID;
    var email = sanitizeHtml( decodeURIComponent(req.query.email) );
    var teamID = sanitizeHtml(req.query.teamID);

    //Find user with the matching email address and fetch their userID
    req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "SELECT userID FROM Users WHERE email = ?";
		connection.query(query, email, function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
            }

			//Cancels request if no matching email is found
		    if (rows.length == 0) {
		        res.sendStatus(400);
		        return;
		    }
		    newUserID = rows[0].userID;
		    //Check if user is already a member
		    req.pool.getConnection(function(err, connection) {
				if (err) {
					res.sendStatus(500);
					return;
				}
				var query = "SELECT * FROM TeamMemberships WHERE userID = ? AND TeamID = ?";
				connection.query(query, [newUserID, teamID], function(err, rows, fields) {
					connection.release();
					if (err) {
						res.sendStatus(500);
						return;
		            }
		            if (rows.length > 0) {
		                res.status(403);
		                res.redirect('back');
		            }
		            //Add user to the team as a non-manager
				    req.pool.getConnection(function(err, connection) {
						if (err) {
							res.sendStatus(500);
							return;
						}
						var query = "INSERT INTO TeamMemberships (userID, teamID) VALUES (?, ?)";
						connection.query(query, [newUserID, teamID], function(err, rows, fields) {
							connection.release();
							if (err) {
								res.sendStatus(500);
								return;
				            }
				            res.status(200);
				            res.redirect('back');
						});
					});
				});
			});
		});
    });
});

//Route used for team management: user from team
router.post('/team/manage/remove', function(req, res) {

    var userID = sanitizeHtml(req.query.userID);
    var teamID = sanitizeHtml(req.query.teamID);

    //Delete the user/team membership from TeamMemberships table
    req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "DELETE FROM TeamMemberships WHERE userID = ? AND teamID = ?";
		connection.query(query, [userID, teamID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
            }
		});
    });
    //Delete that users tasks
    req.pool.getConnection(function(err, connection) {
        if (err) {
            res.sendStatus(500);
            return;
        }
        var query = "DELETE FROM Tasks WHERE userID = ? AND teamID = ?";
        connection.query(query, [userID, teamID], function(err, rows, fields) {
            connection.release();
            if (err) {
                res.sendStatus(500);
                return;
            }
            res.status(200);
            res.redirect('back');
        });
    });
});

//Route used for team management: promote user
router.post('/team/manage/promote', function(req, res) {

    var teamID = sanitizeHtml(req.query.teamID);
    var userID = sanitizeHtml(req.query.userID);

    req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "UPDATE TeamMemberships SET is_manager = 1 WHERE userID = ? AND teamID = ?";
		connection.query(query, [userID, teamID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
            }
            res.status(200);
            res.redirect('back');
		});
	});
});

//Route used for team management: demote user
router.post('/team/manage/demote', function(req, res) {

    var teamID = sanitizeHtml(req.query.teamID);
    var userID = sanitizeHtml(req.query.userID);

    req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "UPDATE TeamMemberships SET is_manager = 0 WHERE userID = ? AND teamID = ?";
		connection.query(query, [userID, teamID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
            }
            res.status(200);
            res.redirect('back');
		});
	});
});

//Delete a team from the datebase
router.post('/team/manage/delete', function(req, res) {

	let teamID = sanitizeHtml(req.query.teamID);

	//Search for the team given and delete it, replace with SQL
    req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "DELETE FROM Teams WHERE teamID = ?";
		connection.query(query, teamID, function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			res.redirect("back");
		});
	});
});


//Edit a task
router.post('/team/manage/task/edit', function(req, res) {

	var editDate = new Date(sanitizeHtml(req.body.editTask_date) + "T" + sanitizeHtml(req.body.editTask_time));
	editDate.setDate(editDate.getDate()); //Fix date offset (as dates should start at 0)
	var editTask = [req.body.editTask_assignee, req.body.editTask_name, req.body.editTask_desc, req.body.editTask_priority, editDate.toISOString().slice(0, 19).replace('T', ' '), req.body.taskID, req.body.teamID];

	//Sanitize all parameters going into the task
	for (i in editTask) {
		editTask[i] = sanitizeHtml(editTask[i]);
	}

	//Check priority is 0, 1 or 2
	if (parseInt(editTask[3]) < 0 || parseInt(editTask[3]) > 2 ) {
		console.log("Invalid Priority");
		res.sendStatus(400);
		return;
	}

	//Check due date is in the future
	if (editDate < (new Date())) {
		console.log("Cannot use a due date from the past");
		res.sendStatus(400);
		return;
	}

	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "UPDATE Tasks SET userID = ?, name = ?, description = ?, priority = ?, due_date = ? WHERE taskID = ? AND teamID = ?";
		connection.query(query, editTask, function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			res.status(200);
			res.redirect('back');
		});
	});
});


//Delete a task as a manager
router.post('/team/manage/task/delete', function(req, res) {

	var taskID = sanitizeHtml(req.query.taskID);
	var teamID = sanitizeHtml(req.query.teamID);

	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "DELETE FROM Tasks WHERE taskID = ? AND teamID = ?";
		connection.query(query, [taskID, teamID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			res.sendStatus(200);
		});
	});
});


/* UPDATE USER NAME */
router.post('/settings/name', function(req, res, next) {

	var f_name = sanitizeHtml(req.query.f_name);
    var l_name = sanitizeHtml(req.query.l_name);

    req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "UPDATE Users SET name_first = ?, name_last = ? WHERE userID = ?;";
		connection.query(query, [req.body.f_name, req.body.l_name, req.session.user.userID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			res.redirect('back');
		});
	});

});


/* UPDATE USER PASSWORD */
router.post('/settings/password', async function(req, res, next) {

	var new_pass = sanitizeHtml(req.query.new_pass);
    var new_pass_again = sanitizeHtml(req.query.new_pass_again);
    var old_pass = sanitizeHtml(req.query.old_pass);

	//Make sure new passwords are same
	if (new_pass == new_pass_again) {
		//Verify old password
		req.pool.getConnection(function(err, connection){
	        if (err) {
	            res.sendStatus(500);
	            return;
	        }
	        var query = "SELECT * FROM Users WHERE userID = ?";
	        connection.query(query, [req.session.user.userID], async function(err, rows, fields) {
	            connection.release();
	            if (err) {
	                res.sendStatus(500);
	                return;
	            }
	            if (rows.length > 0) {
	                try {
	                	//Verify password is correct
	                    if (await argon2.verify(rows[0].password, old_pass)) {
							try {
								//Hash new password
								const hash = await argon2.hash(new_pass);
								req.pool.getConnection(function(err, connection) {
									if (err) {
										res.sendStatus(500);
										return;
									}
									//Update user row to contain new password hash
									var query = "UPDATE Users SET password = ? WHERE userID = ?";
									connection.query(query, [hash, req.session.user.userID], function(err, row, fields) {
										connection.release();
										if (err) {
											res.sendStatus(500);
											return;
										}
										res.status(200);
										res.redirect('back');
									});
								});
							} catch (err) {
								res.sendStatus(500);
    							console.log(err);
							}
	                    } else {
	                        res.status(400);
	                        res.redirect("back");
	                    }
	                } catch (err) {
	                    console.log(err);
	                }
	            } else {
	                res.sendStatus(401);
	            }
	        });
    	});
	}
});


/* UPDATE USER AVAILABILITY */
router.post('/settings/availability', function(req, res, next) {

	let newAvailability = [req.body.sun, req.body.mon ,req.body.tue, req.body.wed, req.body.thu, req.body.fri, req.body.sat];

	//Sanitize each input
	for (i in newAvailability) {
		newAvailability[i] = sanitizeHtml( newAvailability[i] );
	}

	for (i in newAvailability) {
		if (newAvailability[i] == "on") {
			newAvailability[i] = true;
		} else {
			newAvailability[i] = false;
		}
	}
	req.pool.getConnection(function(err, connection) {
		if (err) {
			res.sendStatus(500);
			return;
		}
		var query = "UPDATE Users SET availability = ? WHERE userID = ?";
		connection.query(query, [JSON.stringify(newAvailability), req.session.user.userID], function(err, rows, fields) {
			connection.release();
			if (err) {
				res.sendStatus(500);
				return;
			}
			res.redirect("back");
		});
	});
});


module.exports = router;
