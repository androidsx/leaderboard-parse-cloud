Parse.Cloud.define("dropall", function (request, response) {
    Parse.Cloud.useMasterKey();

    var query = new Parse.Query("Room");
    query.find({
        success: function (results) {
            results.forEach(function (result) {
                result.destroy()
            })
            var query = new Parse.Query("HighScore");
            query.find({
                success: function (results2) {
                    results2.forEach(function (result) {
                        result.destroy()
                    })

                    var query = new Parse.Query(Parse.User);
                    query.find({
                        success: function (results3) {
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
    // create rooms
    var rooms = new Array();
    var Room = Parse.Object.extend("Room");

    var room1 = new Room({
        name: "roomWithOmarJosepPocho"
    });
    var room2 = new Room({
        name: "roomWithPauEspinchi"
    });
    Parse.Object.saveAll(rooms, {
        success: function(list) {
            // users
            var usersArray = new Array();

            var ompemi = new Parse.User({
                username: 'ompemi',
                password: "lala"
            });
            ompemi.addUnique('rooms' , room1);
            usersArray.push(ompemi);

            var josep = new Parse.User({
                username: 'josep',
                password: "lala"
            });
            josep.addUnique('rooms' , room1);
            usersArray.push(josep);

            var pocho = new Parse.User({
                username: 'pocho',
                password: "lala"
            });
            pocho.addUnique('rooms' , room1);
            usersArray.push(pocho);

            var pau = new Parse.User({
                username: 'pau',
                password: "lala"
            });
            pau.addUnique('rooms' , room2);
            usersArray.push(pau);

            var espinchi = new Parse.User({
                username: 'espinchi',
                password: "lala"
            });
            espinchi.addUnique('rooms' , room2);
            usersArray.push(espinchi);

            var numUsers = usersArray.length;
            usersArray.forEach(function (user) {
                user.signUp(null, {
                    success: function (list) {
                        numUsers--;
                        if (numUsers == 0) {
                            // user scores
                            var highScoresArray = new Array();
                            var HighScore = Parse.Object.extend("HighScore");

                            var highScoreOmpemi = new HighScore({
                                user: ompemi,
                                score: 100
                            });
                            highScoresArray.push(highScoreOmpemi);

                            var highScoreJosep = new HighScore({
                                user: josep,
                                score: 200
                            });
                            highScoresArray.push(highScoreJosep)

                            var highScorePocho = new HighScore({
                                user: pocho,
                                score: 300
                            });
                            highScoresArray.push(highScorePocho)


                            var highScorePau = new HighScore({
                                user: pau,
                                score: 1000
                            });
                            highScoresArray.push(highScorePau);

                            var highScoreEspinchi = new HighScore({
                                user: espinchi,
                                score: 2000
                            });
                            highScoresArray.push(highScoreEspinchi);

                            Parse.Object.saveAll(highScoresArray, emptyCallbackAndFinish(response));
                        }
                    },
                    error: function(error) {
                        response.error(error);
                    }

                });
            });
        },
        error: function(error) {
            response.error(error);
        }
    });
});

Parse.Cloud.define("joinroom", function (request, response) {
    var Room = Parse.Object.extend("Room");
    var query = new Parse.Query(Room);
    query.equalTo('name', "roomWithOmarJosepPocho");
    query.first({
        success: function(room) {
            if (room) {
                var randomNumber = Math.floor((Math.random() * 1000) + 1);

                var user = new Parse.User({
                    username: 'justjoineduser' + randomNumber,
                    password: "lala"
                });
                user.addUnique('rooms', room)
                user.save(emptyCallbackAndFinish(response));
            } else {
                response.success("No room found")
            }
        }
    });
});

Parse.Cloud.define("updatescore", function (request, response) {
    var usernameToIncreasePoints = "josep";
    var numPointsIncrease = 101;
    var level = "preRelease1";

    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo('username', usernameToIncreasePoints)
    userQuery.first({
        success: function(result) {
            if (result) {
                var userQuery = new Parse.Query("HighScore");
                userQuery.equalTo('user', result)
                userQuery.equalTo('level', level)
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

Parse.Cloud.define("newscore", function (request, response) {
    var numPoints = 5001;
    var level = "preRelease1";

    var Room = Parse.Object.extend("Room");
    var query = new Parse.Query(Room);
    query.equalTo('name', "roomWithOmarJosepPocho");
    query.first({
        success: function(room) {
            if (room) {
                var randomNumber = Math.floor((Math.random() * 1000) + 1);

                var user = new Parse.User({
                    username: 'justjoineduser' + randomNumber,
                    password: "lala"
                });
                user.addUnique('rooms', room)
                user.save(null, {
                    success: function() {
                        var HighScore = Parse.Object.extend("HighScore");
                        var highScore = new HighScore();
                        highScore.set('user', user)
                        highScore.set('level', level)
                        highScore.set('score', numPoints)
                        highScore.save(null, {
                            success: function() {
                                response.success()
                            }, error: function(error) {
                                response.error("LALAALA");
                            }
                        });
                    }, error: function(error) {
                        response.error(error);
                    }
                });
            } else {
                response.success("No room found")
            }
        }
    });
});


// ---- Push for friend joined room ----

// CLOUD: afterUpdate of a Room with a new score added to the relation scores:
//          get all users of that room except the one who was just added
//              send them a push notification
Parse.Cloud.beforeSave(Parse.User, function (request, response) {
    var user = request.object;
    // 0. Only when the user added rooms
    if (user.dirty('rooms') && user.get('rooms').length > 0 &&
            (user.op('rooms') instanceof Parse.Op.AddUnique || user.op('rooms') instanceof Parse.Op.Add)) {
        // 0. We only trigger pushes where there is only one room added
        var added = user.op('rooms').objects();
        if (added.length == 1) {
            var roomId = added[0].id;

            // 1. Get the room who has a new member
            var room = new Parse.Query("Room");
            room.equalTo('objectId', roomId);
            room.get(roomId).then(function(room) {
                // 2. Retrieve all room members of the room with one new member
                var userQuery = new Parse.Query(Parse.User);
                userQuery.equalTo('rooms', room);
                return Parse.Promise.when(userQuery.find(), room);
            }).then(function(members, room) {
                // 3. For every user in that room, notify them! The new user will not be notified as this is pre-save
                console.log("Notifying " + members.length + " members from " + room.get('name') + " that " + user.get('username') + " joined");
                members.forEach(function (member) {
                    console.log("Tentative push to " + member.get('username') + " that " + user.get('username') + " joined the leaderboard " + room.get('name'));
                });

                var pushQuery = new Parse.Query(Parse.Installation);
                pushQuery.containedIn("user", members);
                return Parse.Push.send({
                    where: pushQuery,
                    data: {
                        alert: "Your friend " +  user.get('username') + " just joined!"
                    }
                });
            }).then(function(result) {
                response.success();
            }, function(error) {
                response.error(error);
            });
        } else {
            console.log("More than one person joined a room, skip")
            response.success();
        }
    } else {
        console.log("Something weird, the user score just added to the relation does not seem to exist?")
        response.success();
    }
});

// ---- Push for friend beated score in a room ----

// CLOUD: afterUpdate of a HighScore:
//          var oldScore = oldScore
//          var newScore = newScore
//          For every room that the HighScore is linked:
//              For every HighScore except the one who was just updated
//                  if score > oldScore and score <= newScore
//                      send them a push notification
Parse.Cloud.beforeSave("HighScore", function (request, response) {
    var highScore = request.object;

    // Set default level for new users
    var isHighScoreBeingUpdated = highScore.existed();
    if (!isHighScoreBeingUpdated) {
        if (!highScore.get("level")) {
            highScore.set("level", "preRelease1");
        }
    }

    // Skip pushes if the score has not changed
    if (!highScore.dirty('score')) {
        console.log("The score from " + highScore.get('user').get('username') + " has not changed, skip pushes");
        response.success();
        return;
    }

    if (isHighScoreBeingUpdated) {
        // 1. Get the last score from this user
        var query = new Parse.Query("HighScore");
        query.include('user');
        query.get(highScore.id, {
            success: function (oldHighScore) {
                var newScore = highScore.get('score');
                var level = highScore.get('level');
                var oldScore = oldHighScore.get('score');

                if (newScore <= oldScore) {
                    console.log("The new score from " + oldHighScore.get('user').get('username') + " is lower that the old, skip pushes");
                    response.success();
                    return;
                }

                sendPushesAfterHighScore(oldHighScore.get('user'), level, newScore, oldScore, response);
            },
            error: function(error) {
                response.error(error);
            }
        });
    } else {
        // New score on this level
        var userQuery = new Parse.Query(Parse.User);
        userQuery.get(highScore.get('user').id, {
            success: function(user) {
                var newScore = highScore.get('score');
                var level = highScore.get('level');
                var oldScore = 0;

                sendPushesAfterHighScore(user, level, newScore, oldScore, response);
            },
            error: function(error) {
                response.error(error);
            }
        });
    }
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

function sendPushesAfterHighScore(user, level, newScore, oldScore, response) {
    var rooms = user.get('rooms');

    console.log("The user " + user.get('username') + ((oldScore <= 0) ? (" created his first high score " + newScore) : (" just did " + newScore + " points, his old score was " + oldScore)));
    console.log("The user has " + rooms.length + " rooms that should be notified, in case it beat the score of someone");

    // 2. Get query for all users that belongs to these rooms
    var userQuery = new Parse.Query(Parse.User);
    userQuery.containedIn('rooms', rooms);
    userQuery.notEqualTo('objectId', user.id);

    // 3. Filter all user scores in the score interval that matches previous user query and the level of the highscore
    var scoresQuery = new Parse.Query("HighScore");
    scoresQuery.include('user');
    scoresQuery.matchesQuery('user', userQuery);
    scoresQuery.equalTo("level", level);
    scoresQuery.greaterThan("score", oldScore);
    scoresQuery.lessThanOrEqualTo("score", newScore);

    scoresQuery.find({
        success: function(scoreUsers) {
            var usersArray = new Array();
            scoreUsers.forEach(function (scoreUser) {
                console.log("Tentative push to " + scoreUser.get('user').get('username') + ": " + user.get('username') + " just beated you with " + newScore + " m");
                usersArray.push(scoreUser.get('user'));
            });

            var pushQuery = new Parse.Query(Parse.Installation);
            pushQuery.containedIn('user', usersArray);
            Parse.Push.send({
                where: pushQuery,
                data: {
                    alert: user.get('username') + " just beat you with " + newScore + " m"
                }
            }, {
                success: function() {
                    response.success();
                },
                error: function(error) {
                    console.log("Could not send the pushes: " + error.message)
                    response.success();
                }
            });
        },
        error: function(error) {
            console.log("Could not see the highscores: " + error.message)
            response.success();
        }
    });
}