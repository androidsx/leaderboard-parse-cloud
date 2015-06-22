Parse.Cloud.define("hello", function(request, response) {
  console.log(request.params);

  response.success("oh yeah baby 2");
});


// ---- Push for friend joined room ----

// CLOUD: afterUpdate of a Room with a new score added to the relation scores:
//          get all users of that room except the one who was just added
//              send them a push notification
Parse.Cloud.beforeSave("Room", function(request, response) {
    var room = request.object;
    if (room.existed() && (room.dirty('scores') || room.dirty('name'))) { // FIXME: remove name after testing
        // FIXME: decomment me after testing

        // Make sure only one person is added, just in case we create a global leaderboard and we notify everyone
        //        var added = room.op('scores').added();
        var username = "pepe";
//        if (added.length == 1) {
//            added.forEach(function (pointer) {
//                pointer.fetch(function (userScore) {
//                    var userQuery = new Parse.Query(Parse.User);
//                    userQuery.equalTo('objectId', userScore.get('user'));
//                    userQuery.first({
//                        success: function(result) {
//                          username = result.get('username')
//                        },
//                        error: function(error) {
//                            console.debug(error);
//                        }
//                    });
//                });
//            });
//        }

        sendPushAdvanced(room, username);
    } else {
        console.log("We just created a new leaderboard YAY");
    }
});

function sendPushAdvanced(room, username) {
    // Get the users that were in the room before this new user
    var scoresQuery = room.relation('scores').query();
    scoresQuery.include("user");
    scoresQuery.find({
        success: function (results) {
            // this is going to be before saving the new user(s), so all these guys needs to be notified
            console.log("Notifying that a friend joined to: \n");

            var usersArray = new Array();
            results.forEach(function (userScore) {
                usersArray.push(userScore.get('user'));
                console.log("Sending push to " + userScore.get('user').get('username'));
            });

            var pushQuery = new Parse.Query(Parse.Installation);
            pushQuery.containedIn('user', usersArray);

            Parse.Push.send({
                where: pushQuery,
                data: {
                    alert: username + " joined the room " + room.get('name')
                }
            }, {
                success: function() {
                    // Push was successful
                },
                error: function(error) {
                    // Handle error
                }
            });
        },
        error: function (error) {
            console.log(JSON.stringify(error))
        }
    });
}

function sendPushSimple(room, username) {
    var scoresQuery = room.relation('scores').query();
    scoresQuery.include('user');
    scoresQuery.find({
        success: function (results) {
            results.forEach(function (user) {
                console.log("Tentative push: " + username + " joined the leaderboard " + room.get('name'));
            });
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

Parse.Cloud.beforeSave("UserScore", function(request, response) {
    var newUserScore = request.object;

    // default level
    if (!newUserScore.existed()) {
        var level = newUserScore.get("level");
        if (!level) {
            newUserScore.set("level", "preRelease1");
        }
        return;
    }

    // send friend beat
    var query = new Parse.Query("UserScore");
    query.include('user');
    query.get(newUserScore.id, {
        success: function(oldUserScore) {
            var newScore =  newUserScore.get('score');
            var oldScore = oldUserScore.get('score');

            console.log("Old score is " + oldScore + " and new is " + newScore);

            // relatedto
            var roomQuery =  new Parse.Query("Room");
            roomQuery.equalTo('scores', newUserScore);
            roomQuery.find({
                success: function (rooms) {
                    console.log("Found " + rooms.length + "rooms");
                    rooms.forEach(function(room) {
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
                },
                error: function (error) {
                    console.log(JSON.stringify(error))
                }
            });
        },

        error: function(object, error) {
            console.log(JSON.stringify(error))
        }
    });
});
