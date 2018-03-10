/*jshint esversion: 6 */
var model = (function(){
    "use strict";
    var model = {};
    var newkey;
    var doAjax = function (method, url, body, json, callback){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(e){
            switch(this.readyState){
                case (XMLHttpRequest.DONE):
                if (this.status === 200) {
                    if(json) return callback(null, JSON.parse(this.responseText));
                    return callback(null, this.responseText);
                }else{
                    return callback(this.responseText, null);
                }
            }
        };
        xhttp.open(method, url, true);
        if (json && body){
            xhttp.setRequestHeader('Content-Type', 'application/json');
            xhttp.send(JSON.stringify(body));
        }else{
            xhttp.send(body);
        }
    };
	
	 model.getActiveUsername = function(callback){
        var keyValuePairs = document.cookie.split('; ');
        for(var i = 0; i<keyValuePairs.length; i++){
            var keyValue = keyValuePairs[i].split('=');
            if(keyValue[0]=== 'username') return callback(null, keyValue[1]);
        }
        return callback("No active user", null);
    };
    
    //creating an image to store into the localstorage
    model.createimage = function(details) {
        var formdata = new FormData();
        formdata.append("picture", details.data.picture);
        formdata.append("title", details.data.title);
		model.getActiveUsername(function(err, username){
            if (err) return callback(err, null);
            doAjax("POST", "/api/users/" + username + '/pictures/', formdata, false, details.callback);
        });
    };
    
    model.getimage = function(details) {
        doAjax("GET", "/api/users/" + details.username + "/pictures/" + details.id, null, true, details.callback);
    };
    
    model.getcomment = function(details) {
        doAjax("GET", "/api/users/" + details.username + '/pictures/' + details.id + '/posts/?page=' + details.page, null, true, details.callback);
    };
    
    model.toright = function(details) {
        doAjax("GET", "/api/users/" + details.username + '/pictures/' + details.id + '?direction=right', null, false, details.callback);
    };
    
    model.toleft = function(details) {
        doAjax("GET", "/api/users/" + details.username + '/pictures/' + details.id + '?direction=left', null, false, details.callback);
    };
    
    model.deletion = function(details) {
        doAjax("DELETE", "/api/users/" + details.username + '/pictures/' + details.id, null, false, details.callback);
    };
    
    //create a post given the information
    model.createpost = function(details) {
        doAjax('POST', 'api/users/' + details.data.username + '/pictures/' + details.data.currentpic + '/posts', details.data, true, details.callback);
    };
    
    model.firstpic = function(username, callback) {
        doAjax('GET', '/api/users/' + username + '/pictures?first=true', null, true, callback);
    };
    
    model.deletepost = function(details) {
        doAjax("DELETE", "api/users/" + details.username + '/pictures/' + details.id2 + '/posts/' + details.id, null, false, details.callback);
    };
	
	model.createUser = function(data, callback){
        doAjax('POST', '/api/users/', data, true, callback);
    };
	
	model.signIn = function(data, callback){
        doAjax('POST', '/api/signin/', data, true, function(err, user){
            if (err) return callback(err, user);
            callback(null, user);
        });
    };
	
	model.userpage = function(page, callback){
        doAjax('GET', '/api/users/?page=' + page, null, true, function(err, user){
            if (err) return callback(err, user);
            callback(null, user);
        });
    };
	
    return model;
}());
