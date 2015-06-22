Parse.Cloud.define("dropall", function (request, response) {
    Parse.Cloud.useMasterKey();

    var query = new Parse.Query("Room");
    query.find({
        success: function (results) {
            results.forEach(function (result) {
                result.destroy()
            })
            var query = new Parse.Query("UserScore");
            query.find({
                success: function (results2) {
                    results2.forEach(function (result) {
                        result.destroy()
                    })

                    var query = new Parse.Query(Parse.User);
                    query.find({
                        success: function (results3) {
                            console.log("lala")
                            results3.forEach(function (result) {
                                result.destroy();
                            })
                        }
                    });
                }
            });
        }
    })
});

Parse.Cloud.define("dropallinstallations", function (request, response) {
    Parse.Cloud.useMasterKey();

    var query = new Parse.Query(Parse.Installation);
    query.find({
        success: function (results) {
            results.forEach(function (result) {
                result.destroy();
            });

            var query = new Parse.Query(Parse.Session);
            query.find({
                success: function (results) {
                    results.forEach(function (result) {
                        result.destroy();
                    })
                }
            });
        }
    });
});

Parse.Cloud.define("scaffolding", function (request, response) {
    // users
    var usersArray = new Array();

    var ompemi = new Parse.User({
        username: 'ompemi',
        password: 'ompemi'
    });
    usersArray.push(ompemi);

    var josep = new Parse.User({
        username: 'josep',
        password: 'josep'
    });
    usersArray.push(josep);

    var pau = new Parse.User({
        username: 'pau',
        password: 'pau'
    });
    usersArray.push(pau);

    var pocho = new Parse.User({
        username: 'pocho',
        password: 'pocho'
    });
    usersArray.push(pocho);

    var espinchi = new Parse.User({
        username: 'espinchi',
        password: 'espinchi'
    });
    usersArray.push(espinchi);

    var numUsers = usersArray.length;
    usersArray.forEach(function (user) {
        user.signUp(null, {
            success: function (list) {
                numUsers--;
                if (numUsers == 0) {
                    // user scores
                    var userScoresArray = new Array();
                    var UserScore = Parse.Object.extend("UserScore");

                    var userScoreOmpemi = new UserScore({
                        user: ompemi,
                        score: 100
                    });
                    userScoresArray.push(userScoreOmpemi);

                    var userScoreJosep = new UserScore({
                        user: josep,
                        score: 200
                    });
                    userScoresArray.push(userScoreJosep)

                    var userScorePocho = new UserScore({
                        user: pocho,
                        score: 300
                    });
                    userScoresArray.push(userScorePocho)


                    var userScorePau = new UserScore({
                        user: pau,
                        score: 1000
                    });
                    userScoresArray.push(userScorePau);

                    var userScoreEspinchi = new UserScore({
                        user: espinchi,
                        score: 2000
                    });
                    userScoresArray.push(userScoreEspinchi);

                    Parse.Object.saveAll(userScoresArray, {
                        success: function (list) {
                            // create rooms
                            var rooms = new Array();
                            var Room = Parse.Object.extend("Room");

                            var room1 = new Room({
                                name: "roomWithOmarJosepPocho"
                            });
                            var userScoresRoom = room1.relation("scores");
                            userScoresRoom.add(userScoreOmpemi);
                            userScoresRoom.add(userScoreJosep);
                            userScoresRoom.add(userScorePocho);
                            rooms.push(room1);

                            var room2 = new Room({
                                name: "roomWithPauEspinchi"
                            });
                            var userScoresRoom = room2.relation("scores");
                            userScoresRoom.add(userScoreEspinchi);
                            userScoresRoom.add(userScorePau);
                            rooms.push(room2);

                            Parse.Object.saveAll(rooms, emptyCallbackAndFinish(response));
                        },
                        error: function (error) {
                            response.error(error);
                        }
                    });
                }
            },
            error: function (error) {
                response.error(error);
            }
        });
    })
});


Parse.Cloud.define("joinroom", function (request, response) {
    var randomNumber = Math.floor((Math.random() * 1000) + 1);

    var user = new Parse.User({
        username: 'justjoineduser' + randomNumber,
        password: 'justjoineduser'
    });
    user.signUp(null, {
        success: function () {
            var UserScore = Parse.Object.extend("UserScore");
            var userScore = new UserScore({
                user: user,
                score: randomNumber
            });
            userScore.save({
                success: function() {
                    var Room = Parse.Object.extend("Room");
                    var query = new Parse.Query(Room);
                    query.equalTo('name', "roomWithOmarJosepPocho");
                    query.first({
                        success: function(room) {
                            if (room) {
                                var userScoresRoom = room.relation("scores");
                                userScoresRoom.add(userScore);
                                room.save(emptyCallbackAndFinish(response));
                            } else {
                                response.success("No room found")
                            }
                        }
                    })
                },
                error: function(error) {
                    response.error(error);
                }
            })
        },
        error: function(error) {
            response.error("Most likely duplicated user" + error);
        }
    });
});

Parse.Cloud.define("newscore", function (request, response) {
    var usernameToIncreasePoints = "josep";
    var numPointsIncrease = 101;

    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo('username', usernameToIncreasePoints)
    userQuery.first({
        success: function(result) {
            if (result) {
                var userQuery = new Parse.Query("UserScore");
                userQuery.equalTo('user', result)
                userQuery.first({
                    success: function (result) {
                        if (result) {
                            var score = result.get('score') > 0 ? result.get('score') : 0;
                            var newScore = score + numPointsIncrease;

                            result.set('score', newScore);
                            result.save();

                            console.log("Increased manually the higshcore of " + usernameToIncreasePoints + " from " + score  + " to " + newScore);
                        }
                    }
                });
            }
        },
        error: function(error) {
            response.error(error);
        }
    });
});


// ---- Push for friend joined room ----

// CLOUD: afterUpdate of a Room with a new score added to the relation scores:
//          get all users of that room except the one who was just added
//              send them a push notification
Parse.Cloud.beforeSave("Room", function (request, response) {
    var room = request.object;
    if (room.existed() && room.dirty('scores')) {
        // Make sure only one person is added, just in case we create a global leaderboard and we notify everyone
        var added = room.op('scores').added();
        var username = "pepe";
        if (added.length == 1) {
            added.forEach(function (pointer) {
                pointer.fetch(function (userScore) {
                    var userQuery = new Parse.Query(Parse.User);
                    userQuery.get(userScore.get('user').id, {
                        success: function(result) {
                            username = result.get('username');
                            sendPushAdvanced(room, username, response);
                        },
                        error: function(error) {
                            console.log(error);
                        }
                    });
                });
            });
        } else {
            console.log("More than one person joined a room");
        }
    } else {
        console.log("We just created a new leaderboard YAY");
        response.success();
    }
});

function sendPushAdvanced(room, username, response) {
    // Get the users that were in the room before this new user
    var scoresQuery = room.relation('scores').query();
    scoresQuery.include("user");
    scoresQuery.find({
        success: function (results) {
            // this is going to be before saving the new user(s), so all these guys needs to be notified
            console.log("Notifying to the room " + room.get('name') + " that a friend joined to: \n");

            var usersArray = new Array();
            results.forEach(function (userScore) {
                usersArray.push(userScore.get('user'));
                console.log("Tentative push to " + userScore.get('user').get('username') + " that " + username + " joined the leaderboard " + room.get('name'));
            });

//            var pushQuery = new Parse.Query(Parse.Installation);
//            pushQuery.containedIn('user', usersArray);
//
//            Parse.Push.send({
//                where: pushQuery,
//                data: {
//                    alert: username + " joined the room " + room.get('name')
//                }
//            }, {
//                success: function() {
//                    response.success();
//                },
//                error: function(error) {
//                    response.error(error);
//                }
//            });

            response.success();
        },
        error: function (error) {
            console.log(JSON.stringify(error))
            response.error(error);
        }
    });
}

function sendPushSimple(room, username, response) {
    var scoresQuery = room.relation('scores').query();
    scoresQuery.include('user');
    scoresQuery.find({
        success: function (results) {
            console.log("Notifying to the room " + room.get('name') + " that a friend joined to: \n");

            var usersArray = new Array();
            results.forEach(function (userScore) {
                usersArray.push(userScore.get('user'));
                console.log("Tentative push to " + userScore.get('user').get('username') + " that " + username + " joined the leaderboard " + room.get('name'));
            });

//            var pushQuery = new Parse.Query(Parse.Installation);
//            pushQuery.containedIn('user', usersArray);
//
//            Parse.Push.send({
//                where: pushQuery,
//                data: {
//                    alert: username + " joined the room " + room.get('name')
//                }
//            }, {
//                success: function() {
//                    response.success();
//                },
//                error: function(error) {
//                    response.error(error);
//                }
//            });

            response.success();
        },
        error: function (error) {
            console.log(JSON.stringify(error))
            response.error(error);
        }
    });
}

// ---- Push for friend beated score in a room ----

// CLOUD: afterUpdate of a UserScore:
//          var oldScore = oldScore
//          var newScore = newScore
//          For every room that the UserScore is linked:
//              For every UserScore except the one who was just updated
//                  if score > oldScore and score <= newScore
//                      send them a push notification

Parse.Cloud.beforeSave("UserScore", function (request, response) {
    var newUserScore = request.object;

    // default level
    if (!newUserScore.existed()) {
        var level = newUserScore.get("level");
        if (!level) {
            newUserScore.set("level", "preRelease1");
        }
        response.success();
        return;
    }

    // send friend beat
    var query = new Parse.Query("UserScore");
    query.include('user');
    query.get(newUserScore.id, {
        success: function (oldUserScore) {
            var newScore = newUserScore.get('score');
            var oldScore = oldUserScore.get('score');

            console.log("Old score is " + oldScore + " and new is " + newScore);

            // relatedto
            var roomQuery = new Parse.Query("Room");
            roomQuery.equalTo('scores', newUserScore);
            roomQuery.find({
                success: function (rooms) {
                    console.log("Found " + rooms.length + " rooms where the user who did the highscore is");

                    if (rooms.length >= 0) {
                        rooms.forEach(function (room) {
                            console.log("Room " + room.get('name'));

                            var scoresQuery = room.relation('scores').query();
                            scoresQuery.greaterThan("score", oldScore);
                            scoresQuery.lessThanOrEqualTo("score", newScore);

                            // testing
                            scoresQuery.include('user');
                            scoresQuery.find({
                                success: function (results) {
                                    results.forEach(function (result) {
                                        console.log("Tentative push to " + result.get('user').get('username') + ": " + oldUserScore.get('user').get('username') + " just beated you with " + newScore + " m");
                                    });

                                    response.success();
                                },
                                error: function(error) {
                                    response.error(error)
                                }
                            });

//                        var pushQuery = new Parse.Query(Parse.Installation);
//                        pushQuery.matchesKeyInQuery("user", "user", scoresQuery);
//                        Parse.Push.send({
//                            where: pushQuery,
//                            data: {
//                                alert: oldUserScore.get('user').get('username') + " just beated you with " + newScore + " m"
//                            }
//                        }, {
//                            success: function() {
//                                console.log(oldUserScore.get('user').get('username') + " just beated you with " + newScore + " m")
//                            },
//                            error: function(error) {
//                                console.log(JSON.stringify(error))
//                            }
//                        });
                        });
                    } else {
                        response.success();
                    }
                },
                error: function (error) {
                    console.log(JSON.stringify(error))
                    response.error(error);
                }
            });
        },

        error: function (object, error) {
            console.log(JSON.stringify(error))
            response.error(error);
        }
    });
});


// ----------- helpers ------------- //
function emptyCallbackAndFinish(response) {
    return {
        success: function (list) {
            response.success();
        },
        error: function (error) {
            console.log(JSON.stringify(error))
            response.error(error);
        }
    }
}

function emptyCallback() {
    return {
        success: function (list) {
        },
        error: function (error) {
            console.log(JSON.stringify(error))
        }
    }
}