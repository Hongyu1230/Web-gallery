(function(model, view){
    "use strict";
    //listening for submission of picture
    document.addEventListener("onpicsubmit", function(e) {
        model.createimage(e.detail);
    });
    //listening for when the image has been stored and tells the view to input it
    document.addEventListener("imageready", function(e) {
        view.insertimage(e.detail);
    });
    document.addEventListener("deletion", function(e) {
        model.deletion(e.detail);
    });
    document.addEventListener("loadup", function(e) {
        model.loadup(e.detail);
    });
    document.addEventListener("newpost", function(e) {
        model.createpost(e.detail);
    });
    document.addEventListener("postdelete", function(e) {
        model.deletepost(e.detail);
    });
    document.addEventListener("prev", function(e) {
        model.prevcomment(e.detail);
    });
    document.addEventListener("next", function(e) {
        model.nextcomment(e.detail);
    });
    //tell the view when there is no image left
    document.addEventListener("imagegone", function(e) {
        view.clearout();
    });
    document.addEventListener("getpics", function(e) {
        model.getimage(e.detail);
    });
    document.addEventListener("getcomments", function(e) {
        model.getcomment(e.detail);
    });
    document.addEventListener("toright", function(e) {
        model.toright(e.detail);
    });
    document.addEventListener("toleft", function(e) {
        model.toleft(e.detail);
    });
}(model, view));
