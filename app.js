var crypto = require('crypto');
var path = require('path');
var express = require('express');
var app = express();
var util = require('util');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

var Datastore = require('nedb');
var posts = new Datastore({ filename: 'db/posts.db', autoload: true, timestampData : true});
var users = new Datastore({ filename: 'db/users.db', autoload: true });
var pictures = new Datastore({ filename: 'db/pictures.db', autoload: true, timestampData : true});

// Message constructor
var post = function(body, pic, username){
    this.pic = pic;
    this.content = body.content;
    this.author = username;
};
var picture = function(pic, body, type, username){
    this.picture = pic;
    this.title = body.title;
    this.author = username;
    this.type = type;
};


var User = function(user){
    var salt = crypto.randomBytes(16).toString('base64');
    var hash = crypto.createHmac('sha512', salt);
    hash.update(user.password);
    this.username = user.username;
    this.salt = salt;
    this.saltedHash = hash.digest('base64');
};

// Authentication

var checkPassword = function(user, password){
    var hash = crypto.createHmac('sha512', user.salt);
    hash.update(password);
    var value = hash.digest('base64');
    return (user.saltedHash === value);
};

var session = require('express-session');
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, sameSite: true }
}));

app.use(function (req, res, next){
    console.log("HTTP request", req.method, req.url, req.body);
    return next();
});

// sanitization and validation
var expressValidator = require('express-validator');
app.use(expressValidator());

app.use(function(req, res, next){
    Object.keys(req.body).forEach(function(arg){
        switch(arg){
            case 'username':
            req.checkBody(arg, 'invalid username').isAlphanumeric();
            break;
            case 'password':
            break;
            case 'content':
            req.sanitizeBody(arg).escape();
            break;
        }
    });
    req.getValidationResult().then(function(result) {
        if (!result.isEmpty()) return res.status(400).send('Validation errors: ' + util.inspect(result.array()));
        else next();
        });
});

// serving the frontend

app.get('/', function (req, res, next) {
    if (!req.session.user) return res.redirect('/signin.html');
    return next();
});

app.get('/api/signout/', function (req, res, next) {
    req.session.destroy(function(err) {
        if (err) return res.status(500).end(err);
        return res.redirect('/signin.html');
    });
});

app.use(express.static('frontend'));


app.post('/api/signin/', function (req, res, next) {
    if (!req.body.username || ! req.body.password) return res.status(400).send("Bad Request");
    users.findOne({username: req.body.username}, function(err, user){
        if (err) return res.status(500).end(err);
        if (!user || !checkPassword(user, req.body.password)) return res.status(401).end("Unauthorized");
        req.session.user = user;
        res.cookie('username', user.username, {secure: true, sameSite: true});
        return res.json(user.username);
    });
});

app.post('/api/users/', function (req, res, next) {
    var data = new User(req.body);
    users.findOne({username: req.body.username}, function(err, user){
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end("Username " + req.body.username + " already exists");
        users.insert(data, function (err, user) {
            if (err) return res.status(500).end(err);
            return res.json(user.username);
        });
    });
});


app.post('/api/users/:username/pictures', upload.single('picture'), function (req, res, next) {
    if (!req.session.user) return res.status(401).end("Unauthorized, please login");
    req.checkParams('username', 'invalid username').isAlphanumeric();
    req.sanitizeBody('title').escape();
    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }
    if (req.session.user.username != req.params.username) return res.status(401).end("Unauthorized, you are not this user");
    var newpic;
    if (typeof(req.file) != 'undefined'){
        newpic = new picture(req.file, req.body, "upload", req.params.username);
    }
    else {
        req.checkBody('picture', 'invalid url').isURL();
        var errors2 = req.validationErrors();
        if (errors2) {
            return res.status(400).send(errors2);
        }
        newpic = new picture(req.body.picture, req.body, "url", req.params.username);
    }
    pictures.insert(newpic, function (err, data) {
        res.json(data);
        return next();
    });
});

app.get('/api/users/:username/pictures/:id/uploads', function (req, res, next) {
    if (!req.session.user) return res.status(401).end("Unauthorized, please login");
    req.checkParams('username', 'invalid username').isAlphanumeric();
    req.checkParams('id', 'invalid id').isAlphanumeric();
    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }
    pictures.findOne({_id: req.params.id, author: req.params.username}, function(err, pic){
        if ((err) || (pic === null)){
            res.status(404).end("The picture with the id:" + req.params.id + " does not exist");
            return next();
        }
        if (pic){
            if (pic.type == "upload"){
                res.setHeader('Content-Type', pic.picture.mimetype);
                res.sendFile(path.join(__dirname, pic.picture.path));
                return next();
            }
            else {
                res.status(404).end("The picture with the id:" + req.params.id + " is a url");
                return next();
            }
        }
        
        return next();
    });
});

app.get('/api/users/:username/pictures/:id', function (req, res, next) {
    if (!req.session.user) return res.status(401).end("Unauthorized, please log in");
    req.checkParams('username', 'invalid username').isAlphanumeric();
    req.checkParams('id', 'invalid id').isAlphanumeric();
    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }
    if (typeof(req.query.direction) == 'undefined'){
        pictures.findOne({_id: req.params.id, author: req.params.username}, function(err, pic){
            var send;
            if ((err) || (pic === null)){
                res.status(404).end("The picture with the id:" + req.params.id + " does not exist for the user " + req.params.username);
                    return next();
            }
            if (pic){
                if (pic.type == "upload"){
                    send = {};
                    send.picture = '/api/users/' + pic.author + '/pictures/' + pic._id + '/uploads/';
                    send.author = pic.author;
                    send.title = pic.title;
                    res.json(send);
                    return next();
                }
                else {
                    send = {};
                    send.picture = pic.picture;
                    send.author = pic.author;
                    send.title = pic.title;
                    send.posts = post;
                    res.json(send);
                    return next();
                }
            }
            return next();
        });
    }
    else {
        req.checkQuery('direction', 'invalid direction').isWhitelisted("leftrigh");
        var errors2 = req.validationErrors();
        if (errors2) {
            return res.status(400).send(errors2);
        }
        pictures.findOne({_id: req.params.id, author: req.params.username}, function(err, pic){
            if ((err) || (pic === null)){
                res.status(404).end("The picture with the id:" + req.params.id + " does not exist for the user " + req.params.username);
                    return next();
            }
            if (pic){
                if (req.query.direction == "right"){
                    pictures.find({createdAt: {$gt: pic.createdAt}, author: req.params.username}).sort({createdAt:1}).limit(1).exec(function (err, newpic) {
                        if (newpic) {
                            res.json(newpic);
                            return next();
                        }
                        return next();
                    });
                }
                else if (req.query.direction == "left"){
                    pictures.find({createdAt: {$lt: pic.createdAt}, author: req.params.username}).sort({createdAt:-1}).limit(1).exec(function (err, newpic) {
                        if (newpic){
                            res.json(newpic);
                            return next();
                        }
                        return next();
                    });
                }
                return next();
            }
        });
    }
    
});

app.get('/api/users/:username/pictures', function (req, res, next) {
    if (!req.session.user) return res.status(401).end("Unauthorized, please log in");
    req.checkParams('username', 'invalid username').isAlphanumeric();
    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }
    if (typeof(req.query.first) != 'undefined'){
        req.checkQuery('first', 'invalid parameter').isWhitelisted('true');
        var errors2 = req.validationErrors();
        if (errors2) {
            return res.status(400).send(errors2);
        }
        pictures.find({author: req.params.username}).sort({createdAt:1}).limit(1).exec(function(err, firstpic){
            res.json(firstpic);
            return next();
        });
    }
    else {
        res.status(501).end("Currently not implemented, only used for grabbing first image at the moment");
        }
});

app.get('/api/users/', function (req, res, next) {
    if (!req.session.user) return res.status(401).end("Unauthorized, please log in");
    if (typeof(req.query.page) != 'undefined'){
        req.checkQuery('page', 'invalid page').isInt();
        var errors = req.validationErrors();
        if (errors) {
            return res.status(400).send(errors);
        }
        users.find({}).sort({username:1}).skip(parseInt(req.query.page)*5).limit(5).exec(function(err, users){
            users.forEach(function (user){
                user.salt = "";
                user.saltedHash = "";
            });
            res.json(users);
            return next();
        });
    }
    else {
        res.status(501).end("Currently not implemented, only used for getting a section of users");
        }
});

app.delete('/api/users/:username/pictures/:id', function (req, res, next) {
    if (!req.session.user) return res.status(401).end("Unauthorized, please log in");
    req.checkParams('username', 'invalid username').isAlphanumeric();
    req.checkParams('id', 'invalid id').isAlphanumeric();
    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }
    pictures.findOne({ _id: req.params.id, author: req.params.username }, function(err, pic) {
        if ((err) || (pic === null)){
            res.status(404).end("The picture with the id:" + req.params.id + " does not exist for the user " + req.params.username);
                return next();
        }
        else {
            if (req.session.user.username != pic.author) return res.status(401).end("Unauthorized, you are not the picture's owner");
            pictures.remove({_id: req.params.id}, function(err, num) {
                res.end();
                return next();
            });
            posts.remove({pic: req.params.id}, { multi: true }, function(err, num) {
                res.end();
                return next();
            });
        }
    });
});

app.post('/api/users/:username/pictures/:id/posts', function (req, res, next) {
    req.checkParams('username', 'invalid username').isAlphanumeric();
    req.checkParams('id', 'invalid id').isAlphanumeric();
    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }
    if (!req.session.user) return res.status(401).end("Unauthorized, please log in");
    var po = new post(req.body, req.params.id, req.session.user.username);
    pictures.findOne({_id: req.params.id}, function(err, pic){
        if ((err) || (pic === null)){
            res.status(404).end("The picture with the id:" + req.params.id + " does not exist for the user " + req.params.username);
                return next();
        }
        else {
            posts.insert(po, function (err, data) {
                res.json(data);
                return next();
            });
        }
    });
});

app.get('/api/users/:username/pictures/:id/posts/', function (req, res, next) {
    if (!req.session.user) return res.status(401).end("Unauthorized, please log in");
    req.checkParams('username', 'invalid username').isAlphanumeric();
    req.checkParams('id', 'invalid id').isAlphanumeric();
    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }
    if (typeof(req.query.page) != 'undefined'){
        req.checkQuery('page', 'invalid page').isInt();
        var errors2 = req.validationErrors();
        if (errors2) {
            return res.status(400).send(errors2);
        }
        pictures.findOne({_id: req.params.id}, function(err, pic){
            if ((err) || (pic === null)){
                res.status(404).end("The picture with the id:" + req.params.id + " does not exist");
                return next();
            }
            else {
                posts.find({pic: req.params.id}).sort({createdAt:1}).skip(parseInt(req.query.page)*10).limit(10).exec(function(err, post){
                    if (post){
                        res.json(post);
                        return next();
                    }
                    return next();
                });
            }
        });
    }
    else {
        res.status(501).end("Currently not implemented, only used for getting a section of users");
        }
});

app.delete('/api/users/:username/pictures/:id/posts/:postid', function (req, res, next) {
    if (!req.session.user) return res.status(401).end("Unauthorized, please log in");
    req.checkParams('username', 'invalid username').isAlphanumeric();
    req.checkParams('id', 'invalid id').isAlphanumeric();
    req.checkParams('postid', 'invalid postid').isAlphanumeric();
    var errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors);
    }
    posts.findOne({ _id: req.params.postid, pic: req.params.id}, function(err, post) {
        if ((err) || (post === null)){
            res.status(404).end("The post with the id:" + req.params.postid + " does not exist for the image:" + req.params.id);
                return next();
        }
        else {
            pictures.findOne({_id: req.params.id}, function(err, pic){
                var send;
                if ((err) || (pic === null)){
                    res.status(404).end("The picture with the id:" + req.params.id + " does not exist");
                    return next();
                }
                else {
                    if ((req.session.user.username != pic.author) && (req.session.user.username != post.author)) {
                        return res.status(401).end("Unauthorized, you are not the picture's or comment's owner");
                    }
                    else {
                        posts.remove({ _id: req.params.postid, pic: req.params.id}, function(err, num) {
                            res.end();
                            return next();
                        });
                    }
                }
                return next();
            });
        }
    });
});

app.get('/favicon.ico', function(req, res) {
    res.sendStatus(204);
});

app.use(function (req, res, next){
    console.log("HTTP Response", res.statusCode);
});

var fs = require('fs');
var https = require('https');
var privateKey = fs.readFileSync( 'server.key' );
var certificate = fs.readFileSync( 'server.crt' );
var config = {
    key: privateKey,
    cert: certificate
};
https.createServer(config, app).listen(3000, function () {
    console.log('HTTPS on port 3000');
});
