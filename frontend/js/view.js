/*jshint esversion: 6 */
var view = (function(){
    "use strict";
    
    var showError = function(message){
        var e = document.getElementById("error");
        e.innerHTML = `<span class="alert">${(message)}</span>`;
        e.style.display = "block";
    };
    
    
    window.onload = function(){
        model.userpage(0, function(err, ret){
            if (err) return showError(err);
            var tempuserhtml = '';
            ret.forEach(function (users) {
                tempuserhtml += '<a class="users" href="#" onclick=view.userclick("' + users.username + '");return false;>' + users.username + '</a>';
            });
            document.getElementById("userssection").innerHTML = tempuserhtml;
            document.getElementById("userssection").name = 0;
        });
        var check = location.search.split('clear=')[1];
        var myParam = location.search.split('id=')[1];
        var takeparam = location.search.split('username=')[1];
        var myParam2;
        if (typeof(takeparam) != 'undefined'){
            myParam2 = takeparam.split("&")[0];
        }
        if (check != 'true' && typeof(myParam) != 'undefined' && typeof(myParam2) != 'undefined'){
            document.getElementById("commentsection").name = 0;
            var eventgetpics = new CustomEvent('getpics', {detail: {id: myParam, username: myParam2, callback: function(err, pictures){
                if (err) {
                    alert("there is no image with the id specified, will redirect to the first image of this user");
                    model.firstpic(myParam2, function(err, ret){
                        if (err) return showError(err);
                        if (ret.length === 0) {
                            view.clearout();
                        }
                        else {
                            var urlnavi = '?username=' + ret[0].author + '&id=' + ret[0]._id;
                            document.getElementById("commentsection").name = 0;
                            window.history.pushState(null, null, urlnavi);
                            view.refresh();
                        }
                    });
                }
                else {
                    var tempHTML = `<div>Title: ${pictures.title}</div>
                    <div>Author: ${pictures.author}</div>
                    <img src=${pictures.picture} width="500px" height="500px">`;
                    document.getElementById("sliderpic").innerHTML = tempHTML;
                    document.getElementById("sliderpic").name = myParam;
                    document.getElementById("sliderpic").title = myParam2;
                }
            }}});
            var eventgetcomment = new CustomEvent('getcomments', {detail: {id: myParam, username: myParam2, page: 0, callback: function(err, posts){
                if (err) {
                    model.firstpic(myParam2, function(err, ret){
                        if (err) return showError(err);
                        if (ret.length === 0) {
                            view.clearout();
                        }
                        else {
                            var urlnavi = '?username=' + ret[0].author + '&id=' + ret[0]._id;
                            document.getElementById("commentsection").name = 0;
                            window.history.pushState(null, null, urlnavi);
                            view.refresh();
                        }
                    });
                }
                else {
                    var tempHTMLcomments = '';
                    posts.forEach(function (message) {
                        var creationdate = message.createdAt.substring(0,10) + ' ' + message.createdAt.substring(11,19);
                        tempHTMLcomments += `<div class ="comment">
                        <div class="message_header">
                        <div class="postauthor">author:${message.author}</div>
                        <div class="time">${creationdate}</div>
                        </div>
                        <div class="message_content">${message.content}</div>
                        <button class="postdelete" onclick="view.deletepost(&#34;${message._id}&#34;, &#34;${myParam}&#34;, &#34;${myParam2}&#34;)">delete</button>
                        </div>`;
                    });
                    document.getElementById("commentsection").innerHTML = tempHTMLcomments;
                }
            }}});
            document.dispatchEvent(eventgetpics);
            document.dispatchEvent(eventgetcomment);
        }
        else if (typeof(myParam) == 'undefined' && typeof(myParam2) != 'undefined'){
            model.firstpic(myParam2, function(err, ret){
                alert("no image id specified, will redirect to the first image of this user");
                if (err) return showError(err);
                if (ret.length === 0) {
                    alert("this user does not exist or the gallery is currently empty");
                    view.clearout();
                }
                else {
                    var urlnavi = '?username=' + ret[0].author + '&id=' + ret[0]._id;
                    document.getElementById("commentsection").name = 0;
                    window.history.pushState(null, null, urlnavi);
                    view.refresh();
                }
            });
        }
        else{
            alert("please select a user to browse their gallery");
            view.clearout();
        }
    };
    
    var view = {};
    
    view.userclick = function(username) {
        model.firstpic(username, function(err, ret){
            if (err) return showError(err);
            if (ret.length === 0) {
                alert("this user has no pictures");
                view.clearout();
            }
            else {
                var urlnavi = '?username=' + ret[0].author + '&id=' + ret[0]._id;
                document.getElementById("commentsection").name = 0;
                window.history.pushState(null, null, urlnavi);
                view.refresh();
            }
        });
    };
    
    view.refresh = function(){
        var myParam = location.search.split('id=')[1];
        var takeparam = location.search.split('username=')[1];
        var myParam2;
        if (typeof(takeparam) != 'undefined'){
            myParam2 = takeparam.split("&")[0];
        }
        var page = document.getElementById("commentsection").name;
        var eventgetpics = new CustomEvent('getpics', {detail: {id: myParam,  username: myParam2, callback: function(err, pictures){
            if (err) return showError(err);
            var tempHTML = `<div>Title: ${pictures.title}</div>
            <div>Author: ${pictures.author}</div>
            <img src=${pictures.picture} width="500px" height="500px">`;
            document.getElementById("sliderpic").innerHTML = tempHTML;
            document.getElementById("sliderpic").name = myParam;
            document.getElementById("sliderpic").title = myParam2;
        }}});
        var eventgetcomment = new CustomEvent('getcomments', {detail: {id: myParam, username: myParam2, page: page, callback: function(err, posts){
            if (err) return showError(err);
            if (posts.length === 0 && page !== 0) {
                alert("there are no posts on this page, you will return to the previous page");
                document.getElementById("commentsection").name = parseInt(page) - 1;
                view.refresh();
            }
            else {
                var tempHTMLcomments = '';
                posts.forEach(function (message) {
                    var creationdate = message.createdAt.substring(0,10) + ' ' + message.createdAt.substring(11,19);
                    tempHTMLcomments += `<div class ="comment">
                    <div class="message_header">
                    <div class="postauthor">author:${message.author}</div>
                    <div class="time">${creationdate}</div>
                    </div>
                    <div class="message_content">${message.content}</div>
                    <button class="postdelete" onclick="view.deletepost(&#34;${message._id}&#34;, &#34;${myParam}&#34;, &#34;${myParam2}&#34;)">delete</button>
                    </div>`;
                });
                document.getElementById("commentsection").innerHTML = tempHTMLcomments;
            }}}});
            document.dispatchEvent(eventgetpics);
            document.dispatchEvent(eventgetcomment);
        };
        
        document.getElementById("signout").onclick = function(e){
            window.location = '/api/signout';
        };
        
        //show/hide the image upload form, on default it's hidden
        document.getElementById("toggle").onclick = function(e){
            var imageform = document.getElementById("imagesubmit");
            if (imageform.style.display == 'flex') {
                imageform.style.display = 'none';
            }
            else{
                imageform.style.display = 'flex';
            }
        };
        
        //making sure that if url is clicked then we need to disable the file option
        document.getElementById("url").onclick = function(e){
            document.getElementById("file").checked = false;
        };
        
        //making sure that if file upload is clicked then we need to disable the url option
        document.getElementById("file").onclick = function(e){
            document.getElementById("url").checked = false;
        };
        
        //uploading files, will give appropriate error alerts if needed
        document.getElementById("imagesubmit").onsubmit = function(e){
            e.preventDefault();
            var title = document.getElementById("title").value;
            var retparse;
            var urlnavi;
            var data;
            if (document.getElementById("file").checked) {
                if (typeof(document.getElementById('files').files[0]) == "undefined"){
                    alert("please select an image to load");
                }
                else {
                    data = {};
                    data.title = title;
                    data.picture = document.getElementById('files').files[0];
                    var eventupload = new CustomEvent('onpicsubmit', {detail: {data: data, callback: function(err, ret){
                        retparse = JSON.parse(ret);
                        if (err) return showError(err);
                        var source = '/api/users/' + retparse.author + '/pictures/' + retparse._id + '/uploads/';
                        var tempHTML = `<div>Title: ${retparse.title}</div>
                        <div>Author: ${retparse.author}</div>
                        <img src=${source} width="500px" height="500px">`;
                        document.getElementById("sliderpic").innerHTML = tempHTML;
                        document.getElementById("sliderpic").name = retparse._id;
                        document.getElementById("sliderpic").title = retparse.author;
                        document.getElementById("commentsection").innerHTML = '';
                        document.getElementById("commentsection").name = 0;
                        urlnavi = '?username=' + retparse.author + '&id=' + retparse._id;
                        window.history.pushState(null, null, urlnavi);
                    }}});
                    document.dispatchEvent(eventupload);
                }
            }
            else if (document.getElementById("url").checked) {
                if (document.getElementById("urlsrc").value === ""){
                    alert("please enter a url");
                }
                else {
                    data = {};
                    data.title = title;
                    data.picture = document.getElementById("urlsrc").value;
                    var eventurl = new CustomEvent('onpicsubmit', {detail: {data: data, callback: function(err, ret){
                        retparse = JSON.parse(ret);
                        if (err) return showError(err);
                        var tempHTML = `<div>Title: ${retparse.title}</div>
                        <div>Author: ${retparse.author}</div>
                        <img src=${retparse.picture} width="500px" height="500px">`;
                        document.getElementById("sliderpic").innerHTML = tempHTML;
                        document.getElementById("sliderpic").name = retparse._id;
                        document.getElementById("commentsection").innerHTML = '';
                        document.getElementById("commentsection").name = 0;
                        document.getElementById("sliderpic").title = retparse.author;
                        urlnavi = '?username=' + retparse.author + '&id=' + retparse._id;
                        window.history.pushState(null, null, urlnavi);
                    }}});
                    document.dispatchEvent(eventurl);
                }
            } else {
                alert("select one of the 2 upload options please");
            }
            document.getElementById("title").value = "";
            document.getElementById("urlsrc").value = "";
            document.getElementById('files').value = "";
        };
        
        
        //function for scrolling to the previous image
        document.getElementById("scrollleft").onclick = function(e){
            var currentvalue = document.getElementById("sliderpic").name;
            var username = document.getElementById("sliderpic").title;
            var check = location.search.split('clear=')[1];
            if (check == 'true'){
                alert("there is currently no pictures in the gallery");
            }
            else {
                var nextim = new CustomEvent('toleft', {detail: {id: currentvalue, username: username, callback: function(err, ret){
                    if (err) return showError(err);
                    var retparse = JSON.parse(ret);
                    if (retparse === null){
                        alert("something went wrong");
                        console.log(ret);
                    }
                    else if (retparse.length === 0) {
                        alert("this is already the first image in the gallery");
                    }
                    else {
                        var urlnavi = '?username=' + retparse[0].author + '&id=' + retparse[0]._id;
                        document.getElementById("commentsection").name = 0;
                        window.history.pushState(null, null, urlnavi);
                        view.refresh();
                    }
                }}});
                document.dispatchEvent(nextim);
            }
        };
        
        //function for scrolling to the right image
        document.getElementById("scrollright").onclick = function(e){
            var currentvalue = document.getElementById("sliderpic").name;
            var username = document.getElementById("sliderpic").title;
            var check = location.search.split('clear=')[1];
            if (check == 'true'){
                alert("there is currently no pictures in the gallery");
            }
            else {
                var nextim = new CustomEvent('toright', {detail: {id: currentvalue, username: username, callback: function(err, ret){
                    if (err) return showError(err);
                    var retparse = JSON.parse(ret);
                    if (retparse === null){
                        alert("something went wrong");
                        console.log(ret);
                    }
                    else if (retparse.length === 0) {
                        alert("this is the end of the image gallery");
                    }
                    else {
                        var urlnavi = '?username=' + retparse[0].author + '&id=' + retparse[0]._id;
                        document.getElementById("commentsection").name = 0;
                        window.history.pushState(null, null, urlnavi);
                        view.refresh();
                    }
                }}});
                document.dispatchEvent(nextim);
            }
        };
        
        view.clearout = function() {
            document.getElementById("sliderpic").innerHTML = '';
            document.getElementById("sliderpic").name = 'nopic';
            document.getElementById("commentsection").innerHTML = '';
            document.getElementById("commentsection").name = 0;
            var url = '?clear=true';
            window.history.pushState(null, null, url);
        };
        
        //function for deleting an image
        document.getElementById("delete").onclick = function(e){
            var currentvalue = document.getElementById("sliderpic").name;
            var username = document.getElementById("sliderpic").title;
            var tempdetail = {};
            tempdetail.id = currentvalue;
            tempdetail.username = username;
            var event;
            tempdetail.callback = function(err, ret2){
                var retparse2 = JSON.parse(ret2);
                if (err){
                    return showError(err);
                }
                else if (retparse2.length === 0) {
                    event = new CustomEvent('deletion', {detail: {id: currentvalue, username: username, callback: function(err){
                        if (err) return showError(err);
                        alert("no images left here");
                        view.clearout();
                    }}});
                    document.dispatchEvent(event);
                }
                else {
                    event = new CustomEvent('deletion', {detail: {id: currentvalue, username: username, callback: function(err){
                        if (err) return showError(err);
                        var urlnavi = '?username=' + retparse2[0].author + '&id=' + retparse2[0]._id;
                        document.getElementById("commentsection").name = 0;
                        window.history.pushState(null, null, urlnavi);
                        view.refresh();
                    }}});
                    document.dispatchEvent(event);
                }
            };
            var check = location.search.split('clear=')[1];
            if (check == 'true'){
                alert("there is currently no pictures in the gallery");
            }
            else{
                var beforedeletion = new CustomEvent('toright', {detail: {id: currentvalue, username: username, callback: function(err, ret){
                    var retparse = JSON.parse(ret);
                    if (err) {
                        return showError(err);
                    }
                    else if (retparse.length === 0) {
                        model.toleft(tempdetail);
                    }
                    else {
                        model.toright(tempdetail);
                    }
                }}});
                document.dispatchEvent(beforedeletion);
            }
        };
        
        //submitting a comment on the current image
        document.getElementById("commentsubmit").onsubmit = function(e){
            e.preventDefault();
            var content = document.getElementById("comment").value;
            var currentvalue = document.getElementById("sliderpic").name;
            var username = document.getElementById("sliderpic").title;
            var data = {};
            data.content = content;
            data.currentpic = currentvalue;
            data.username = username;
            var check = location.search.split('clear=')[1];
            if (check == 'true'){
                alert("there is currently no pictures in the gallery");
            }
            else {
                var event = new CustomEvent('newpost', {detail: {data: data, callback: function(err){
                    if (err) return showError(err);
                }}});
                document.dispatchEvent(event);
                document.getElementById("comment").value = "";
                view.refresh();
            }
        };
        
        view.deletepost = function (postid, imageid, username) {
            var event = new CustomEvent('postdelete', {detail: {id: postid, id2: imageid, username: username, callback: function(err){
                if (err) return showError(err);
                view.refresh();
            }}});
            document.dispatchEvent(event);
        };
        
        //getting the previous 10 comments if there is any
        document.getElementById("prev").onclick = function(e){
            var currentpage = document.getElementById("commentsection").name;
            var check = location.search.split('clear=')[1];
            if (check == 'true'){
                alert("there is currently no pictures in the gallery");
            }
            else if (currentpage === 0) {
                alert("this is the first page of comments already");
            }
            else {
                var newpage = currentpage - 1;
                document.getElementById("commentsection").name = newpage;
                view.refresh();
            }
        };
        
        //getting the next 10 comments if there is any
        document.getElementById("next").onclick = function(e){
            var currentpage = document.getElementById("commentsection").name;
            var check = location.search.split('clear=')[1];
            if (check == 'true'){
                alert("there is currently no pictures in the gallery");
            }
            else {
                var newpage = currentpage + 1;
                document.getElementById("commentsection").name = newpage;
                view.refresh();
            }
        };
        
        document.getElementById("prevusers").onclick = function(e){
            var currentpage = document.getElementById("userssection").name;
            var check = location.search.split('clear=')[1];
            if (currentpage === 0) {
                alert("this is the first page of users already");
            }
            else {
                var newpage = currentpage - 1;
                model.userpage(newpage, function(err, ret){
                    if (err) return showError(err);
                    var tempuserhtml = '';
                    ret.forEach(function (users) {
                        tempuserhtml += '<a class="users" href="#" onclick=view.userclick("' + users.username + '");return false;>' + users.username + '</a>';
                    });
                    document.getElementById("userssection").innerHTML = tempuserhtml;
                    document.getElementById("userssection").name = newpage;
                });
            }
        };
        
        document.getElementById("nextusers").onclick = function(e){
            var currentpage = document.getElementById("userssection").name;
            var check = location.search.split('clear=')[1];
            var newpage = currentpage + 1;
            model.userpage(newpage, function(err, ret){
                if (err) return showError(err);
                if (ret.length === 0){
                    alert("this is already the end of user pages");
                }
                else {
                    var tempuserhtml = '';
                    ret.forEach(function (users) {
                        tempuserhtml += '<a class="users" href="#" onclick=view.userclick("' + users.username + '");return false;>' + users.username + '</a>';
                    });
                    document.getElementById("userssection").innerHTML = tempuserhtml;
                    document.getElementById("userssection").name = newpage;
                }
            });
        };
        return view;
    }());
    
    