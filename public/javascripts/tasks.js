


//Sort by dueDate, soonest first == 0
function sortDueDateAsc(a, b) {
    if ( a.due_date < b.due_date ){
        return -1;
    }
    if ( a.due_date > b.due_date ){
        return 1;
    }
    return 0;
}

//Sort by priority from low to high == 2
function sortPriorityAsc(a, b) {
    if ( a.priority > b.priority ) {
        return -1;
    }
    if ( a.priority < b.priority ) {
        return 1;
    }
    return sortDueDateAsc( a, b );

}

datePickerId.min = new Date().toISOString().split("T")[0];

var app = new Vue({
    el: '#vapp',
    data: {
        userID: -1,
        tasks: [],
        sortedTasks: [],

        teams: [],
        managingTeams : [],

        selectedTask: {},
        selectedUserID: -1,
        selectedTeam: "",
        isSelectedTeamManager: false,
        selectedTeamManagers: [],
        selectedTeamUsers: [],
        selectedTeamMembers: [],
        selectedTeamTasks: [],
        selectedDate: undefined,
        selectedTime: undefined,

        editDate: undefined,

        sortMethod: 0,
        settingsMenu: 0,

        showPopup: {
            background: false,
            popup: false,
            createTask: false,
            createTeam: false,
            viewTask: false,
            viewSettings: false,
            viewTaskEdit: false
        },
        viewTask: {
            taskID: "",
            name: "",
            team: "",
            due_date: "",
            priority: "",
            description: "",
            complete_status: undefined
            },

        new_pass: "",
        new_pass_again: "",

    },
    methods: {

        //Function which given a teamID, returns the name of that team
        getTeamName: function(teamID) {
            for (i in this.teams) {
                if (this.teams[i].teamID == teamID) {
                    return this.teams[i].name;
                }
            }
        },

        //Returns a tasks due dates time in HH:MM form
        getDueTime: function(dueDate) {

            let dateTime = new Date(dueDate);
            let hour = String(dateTime.getUTCHours());
            let minute =  String(dateTime.getUTCMinutes());

            if (minute.length < 2) {
                minute = "0" + minute;
            }
            if (hour.length < 2) {
                hour = "0" + hour;
            }
            return (hour + ":" + minute);
        },

        //Returns the due date of a task in a string format
        getDueDateString: function(task) {
            let t = new Date(task.due_date);
            return t.toDateString() + " @ " + this.getDueTime(t);
        },

        //Given a userID, returns the full name of the user
        getUserName: function(userID) {
            for (i in app.selectedTeamManagers) {
                if (app.selectedTeamManagers[i].userID == userID) {
                    return app.selectedTeamManagers[i].name_first + " " + app.selectedTeamManagers[i].name_last[0] + ".";
                }
            }

            for (i in app.selectedTeamUsers) {
                if (app.selectedTeamUsers[i].userID == userID) {
                    return app.selectedTeamUsers[i].name_first + " " + app.selectedTeamUsers[i].name_last[0] + ".";
                }
            }

            return "Member not in Team";
        },

        //Gets the userID of the current user logged in to teh current session
        getUserID: function() {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.userID = parseInt(this.responseText);
                }
            };
            xhttp.open("GET", "/get_session", true);
            xhttp.send();
        },

        newTask: function(home) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.closePopup();
                    document.getElementById("newTaskForm").reset();
                    if (home) {
                        app.getTasks('all', '');
                        return;
                    } else {
                        if (app.selectedTeam !== undefined) {
                            app.getTeam(app.selectedTeam);
                        }
                        return;
                    }
                }
            };

            var input = document.getElementById("newTaskForm").elements;
            newTask = {
                newTask_name: input.newTask_name.value,
                newTask_date: input.newTask_date.value,
                newTask_time: input.newTask_time.value,
                newTask_priority: input.newTask_priority.value,
                newTask_desc: input.newTask_desc.value,
                newTask_team: input.newTask_team.value,
                newTask_assignee: input.newTask_assignee.value
            };


            xhttp.open("POST", "/users/task/new", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(newTask));
        },


        //Gets all the task in a range of sorting methods, all time, today, this week and by individual teams
        getTasks: function(view, teamID) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.tasks = JSON.parse(this.responseText);
                    for (i in app.tasks) {
                        app.tasks[i].due_date = new Date(app.tasks[i].due_date);
                    }
                    app.getSortedTasks(app.sortMethod);
                }
            };

            if ( view  == "team" ) {
                xhttp.open("GET", "/users/tasks?view=" + encodeURIComponent(view) + "&teamID=" + encodeURIComponent(teamID), true);
            }
            else {
                xhttp.open("GET", "/users/tasks?view=" + encodeURIComponent(view) , true);
            }
            xhttp.send();
        },

        //Sorts the task list in order of either due date or priority
        getSortedTasks: function(method) {

            app.sortedTasks = [];
            if (app.tasks.length == 0) {
                return;
            }

            if (method == 0 || method == 1) {

                let tempTasks = app.tasks;
                tempTasks.sort( sortDueDateAsc );
                let currDate = new Date(tempTasks[0].due_date);
                let currDateTasks = [];
                let i = 0;

                while (i < tempTasks.length) {
                    let dueDate = new Date( tempTasks[i].due_date );
                    while (dueDate.toDateString() == currDate.toDateString() ) {
                        currDateTasks.push(tempTasks[i]);
                        i += 1;
                        if (i >= tempTasks.length) {
                            break;
                        }
                        dueDate = new Date( tempTasks[i].due_date );
                    }
                    app.sortedTasks.push( {sort: currDate.toDateString(), tasks: currDateTasks } );
                    currDateTasks = [];
                    currDate = dueDate;
                }

                if (method == 1) {
                    app.sortedTasks.reverse();
                }

            }

            else if (method == 2 || method == 3) {
                let tempTasks = app.tasks;
                tempTasks.sort( sortPriorityAsc );
                let currPriority = tempTasks[0].priority;
                let currPriorityTasks = [];
                let i = 0;

                while (i < tempTasks.length) {
                    let priority = tempTasks[i].priority;
                    while (priority == currPriority) {
                        currPriorityTasks.push(tempTasks[i]);
                        i += 1;
                        if (i >= tempTasks.length) {
                            break;
                        }
                        priority = tempTasks[i].priority;
                    }
                    let priorityStr = "";
                    switch (currPriority) {
                        case 0:
                            priorityStr = "Low";
                            break;
                        case 1:
                            priorityStr = "Medium";
                            break;
                        case 2:
                            priorityStr = "High";
                            break;
                    }
                    app.sortedTasks.push( {sort: priorityStr, tasks: currPriorityTasks} );
                    currPriorityTasks = [];
                    currPriority = priority;
                }

                if (method == 3) {
                    app.sortedTasks.reverse();
                }
            }
        },

        //Updates the tasks for either completion date, due date or completion status
        getTasksUpdate: function() {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.tasks = JSON.parse(this.responseText);
                    app.getSortedTasks(app.sortMethod);
                }
            };

            var taskIDs = [];
            for (i in app.tasks) {
                taskIDs.push(app.tasks[i].taskID);
            }

            xhttp.open("POST", "/users/tasks/update", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(taskIDs));
        },

        //Get all info on a specific team
        getTeam: function(teamID) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.selectedTeam = JSON.parse(this.responseText)[0];
                    app.getMemberRoles(teamID);
                    app.teamGetTasks();

                    app.isSelectedTeamManager = false;
                    for (i in app.managingTeams) {
                        if (app.managingTeams[i].teamID == teamID) {
                            app.isSelectedTeamManager = true;
                            break;
                        }
                    }
                }
            };

            xhttp.open("GET", "/users/teams?teamID=" + encodeURIComponent(teamID) , true);
            xhttp.send();
        },

        //Gets all the teams that the current sessions user is a member of
        getTeams: function() {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.teams = JSON.parse(this.responseText);
                }
            };

            xhttp.open("GET", "/users/teams", true);
            xhttp.send();
        },

        //Gets all the teams that the current sessions user is a manager of
        getManagingTeams: function() {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.managingTeams = JSON.parse(this.responseText);
                }
            };

            xhttp.open("GET", "/users/teams?&isManager=" + encodeURIComponent("true"), true);
            xhttp.send();
        },

        //Gets all the team members of a given team
        getTeamMembers: function(teamID) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.selectedTeamMembers = JSON.parse(this.responseText);
                    for (i in app.selectedTeamMembers) {
                        app.selectedTeamMembers[i].availability = JSON.parse(app.selectedTeamMembers[i].availability);
                    }
                }
            };

            xhttp.open("GET", "/users/team/members?teamID=" + encodeURIComponent(teamID), true);
            xhttp.send();
        },

        //Gets all the team members of a given team, seperated into roles (users or managers)
        getMemberRoles: function(teamID) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.selectedTeamManagers = JSON.parse(this.responseText)[0];
                    for (i in app.selectedTeamManagers) {
                        app.selectedTeamManagers[i].availability = JSON.parse(app.selectedTeamManagers[i].availability);
                    }

                    app.selectedTeamUsers = JSON.parse(this.responseText)[1];
                    for (i in app.selectedTeamUsers) {
                        app.selectedTeamUsers[i].availability = JSON.parse(app.selectedTeamUsers[i].availability);
                    }
                }
            };
            xhttp.open("GET", "/users/team/members?teamID="+encodeURIComponent(teamID)+"&roles="+encodeURIComponent(true), true);
            xhttp.send();
        },

        //Used to toggle a task as complete/incomplete
        markTaskComplete: function(taskID) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.getTasksUpdate();
                }
            };
            xhttp.open("POST", "/users/task/complete?taskID=" + encodeURIComponent(taskID) , true);
            xhttp.send();
        },

        //Checks if a user is available for a task given a due date
        checkAvailability: function(userID, date, x) {

            date = new Date(date);
            let day = date.getDay();
            if (x === undefined) {
                for (i in app.selectedTeamMembers) {
                    if (app.selectedTeamMembers[i].userID == userID) {
                        if (app.selectedTeamMembers[i].availability[day] == true) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            } else {
                for (i in app.selectedTeamManagers) {
                    if (app.selectedTeamManagers[i].userID == userID) {
                        if (app.selectedTeamManagers[i].availability[day] == true) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
                for (i in app.selectedTeamUsers) {
                    if (app.selectedTeamUsers[i].userID == userID) {
                        if (app.selectedTeamUsers[i].availability[day] == true) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }

        },

        //Check Availability while editing a task
        editCheckAvailability: function() {
            return app.checkAvailability(app.editUserID, app.editDate, true);
        },

        /* TEAM MANAGEMENT FUNCTIONS */

        //Gets the userID of the current user that is selected
        selectUserID: function(uID) {

            if (app.selectedUserID == uID) {
                app.selectedUserID = "";
                let selected = document.getElementsByClassName("selected");
                while (selected.length > 0) {
                    document.getElementsByClassName("selected")[0].classList.remove("selected");
                }
            }

            else {
                app.selectedUserID = uID;
                let selected = document.getElementsByClassName("selected");
                while (selected.length > 0) {
                    document.getElementsByClassName("selected")[0].classList.remove("selected");
                }
                document.getElementById(String(uID)).classList.add("selected");
            }

        },

        //Gets all the tasks that are under a specific team, across all users
        teamGetTasks: function() {

            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.selectedTeamTasks = JSON.parse(this.responseText);
                    app.selectedTeamTasks.sort( sortDueDateAsc );
                }
            };
            xhttp.open("GET", "/users/team/tasks?teamID=" + encodeURIComponent(app.selectedTeam.teamID), true);
            xhttp.send();

        },

        //Add a member to a team
        teamAddMember: function() {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.getTeamMembers(app.selectedTeam.teamID);
                    app.getTeam(app.selectedTeam.teamID);
                }
            };
            let email = prompt('Please enter members email address');
            xhttp.open("POST", "/users/team/manage/add?teamID=" + encodeURIComponent(app.selectedTeam.teamID) + "&email=" + encodeURIComponent(email), true);
            xhttp.send();
        },

        //Removes a member from a team
        teamRemoveMember: function(uID) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.getTeamMembers(app.selectedTeam.teamID);
                    app.getTeam(app.selectedTeam.teamID);
                }
            };
            xhttp.open("POST", "/users/team/manage/remove?teamID="+encodeURIComponent(app.selectedTeam.teamID)+"&userID="+encodeURIComponent(uID), true);
            xhttp.send();
        },

        //Promotes a team user to a team manager
        teamPromoteMember: function(uID) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.getTeamMembers(app.selectedTeam.teamID);
                    app.getTeam(app.selectedTeam.teamID);
                }
            };
            xhttp.open("POST", "/users/team/manage/promote?teamID="+encodeURIComponent(app.selectedTeam.teamID)+"&userID="+encodeURIComponent(uID), true);
            xhttp.send();
        },

        //Demote a manager to a user
        teamDemoteMember: function(uID) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.getTeamMembers(app.selectedTeam.teamID);
                    app.getTeam(app.selectedTeam.teamID);
                }
            };
            xhttp.open("POST", "/users/team/manage/demote?teamID="+encodeURIComponent(app.selectedTeam.teamID)+"&userID="+encodeURIComponent(uID), true);
            xhttp.send();
        },

        //Leave a team (Removes current session user from a team-header)
        teamLeave: function(uID) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.getTeams();
                    window.location.href = "/teams";
                }
            };
            xhttp.open("POST", "/users/team/leave?teamID="+encodeURIComponent(app.selectedTeam.teamID), true);
            xhttp.send();
        },

        //Fully delete a team and all its tasks/team memberships
        teamDelete: function() {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.getTeams();
                    window.location.href = "/teams";
                }
            };
            xhttp.open("POST", "/users/team/manage/delete?teamID="+encodeURIComponent(app.selectedTeam.teamID), true);
            xhttp.send();
        },

        teamTaskDelete: function() {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.closePopup();
                    app.teamGetTasks();
                }
            };
            xhttp.open("POST", "/users/team/manage/task/delete?taskID="+encodeURIComponent(app.selectedTask.taskID)+"&teamID="+encodeURIComponent(app.selectedTeam.teamID), true);
            xhttp.send();
        },


        teamTaskEdit:  function() {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    app.closePopup();
                    document.getElementById("editTaskForm").reset();
                    app.getTeam(app.selectedTeam.teamID);
                }
            };

            var input = document.getElementById("editTaskForm").elements;
            editTask = {
                editTask_name: input.editTask_name.value,
                editTask_date: input.editTask_date.value,
                editTask_time: input.editTask_time.value,
                editTask_priority: input.editTask_priority.value,
                editTask_desc: input.editTask_desc.value,
                editTask_assignee: input.editTask_assignee.value,
                teamID:  app.selectedTeam.teamID,
                taskID: app.selectedTask.taskID
            };

            var x = new Date(editTask.editTask_date.slice(0,10));
            x.setDate(x.getDate()-1);
            editTask.editTask_date = x.toISOString().slice(0,10);


            xhttp.open("POST", "/users/team/manage/task/edit", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(editTask));
        },





        /* POP UP FUNCTIONS */

        //Fairly self explanatory

        closePopup: function() {
            for (i in this.showPopup) {
                this.showPopup[i] = false;
            }
        },

        createTaskPopup: function() {
            this.closePopup();
            this.showPopup.background = true;
            this.showPopup.popup = true;
            this.showPopup.createTask = true;
        },

        viewTaskPopup: function( task ) {
            this.closePopup();
            this.showPopup.background = true;
            this.showPopup.popup = true;
            this.showPopup.viewTask = true;

            this.viewTask.taskID = task.taskID;
            this.viewTask.name = task.name;
            this.viewTask.team = this.getTeamName(task.teamID);

            switch (task.priority) {
                case 0:
                    this.viewTask.priority = "LOW";
                    break;
                case 2:
                    this.viewTask.priority = "HIGH";
                    break;
                case 1:
                default:
                    this.viewTask.priority = "MEDIUM";
            }

            this.viewTask.due_date = app.getDueDateString(task);
            this.viewTask.userName = app.getUserName(task.userID);
            this.viewTask.description = task.description;
            this.viewTask.complete_status = parseInt(task.complete_status);

        },

        createTeamPopup: function() {
            this.closePopup();
            this.showPopup.background = true;
            this.showPopup.popup = true;
            this.showPopup.createTeam = true;
        },

        viewSettingsPopup: function() {
            this.closePopup();
            this.showPopup.background = true;
            this.showPopup.popup = true;
            this.showPopup.viewSettings = true;
        },

        viewTaskEdit: function() {
            this.closePopup();
            this.showPopup.background = true;
            this.showPopup.popup = true;
            this.showPopup.viewTaskEdit = true;
            this.editUserID = this.selectedTask.userID;
            var x = new Date(this.selectedTask.due_date.slice(0,10));
            x.setDate(x.getDate()+1);
            this.editDate = x.toISOString().slice(0,10);
        },


        /* SIGN OUT FUNCTION */
        logout: function() {

            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    window.location.pathname = "/landing";
                }
            };
            xhttp.open("POST", "/logout", true);
            xhttp.send();

        }

    },


});


// INITIAL COMMANDS TO LOAD REQUIRED INFORMATION

app.getUserID();
app.getTeams();
app.getTasks('all', '');
app.getManagingTeams();
