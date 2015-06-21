Parse.Cloud.define("hello", function(request, response) {
  console.log(request.params);

  response.success("oh yeah baby 2");
});

Parse.Cloud.beforeSave("UserScore", function(request, response) {
    var level = request.object.get("level");
    if (!level) {
        request.object.set("level", "preRelease1");
    }
    response.success();
});