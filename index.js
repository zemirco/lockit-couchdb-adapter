
var pwd = require('pwd');
var config = require('./config.dev.js');
var uuid = require('node-uuid');

var db = require('nano')({
//  url: 'https://' + config.dbUser + ':' + config.dbPass + '@' + config.dbUrl + '',
  url: 'https://' + config.dbUrl,
  request_defaults: config.request_defaults
});

// also return signupToken
exports.create = function(name, email, pw, done) {

  // set sign up token expiration date
  var now = new Date();
  var tomorrow = now.setTime(now.getTime() + (config.signupTokenExpiration));

  var user = {
    username: name,
    email: email,
    signupToken: uuid.v4(),
    signupTimestamp: new Date(),
    signupTokenExpires: new Date(tomorrow)
  };

  // create salt and hash password
  pwd.hash(pw, function(err, salt, hash){
    if (err) return done(err);
    user.salt = salt;
    user.hash = hash;

    // db insert doesn't return the user -> get it manually
    db.insert(user, function(err, res) {
      if (err) return done(err);
      
      db.get(res.id, done);
    });

  });
  
};

// find a user
// match is either "username", "email" or "signupToken"
exports.find = function(match, query, done) {

  db.view('users', match, {key: query}, function(err, res) {
    if (err) return done(err);
    res.rows.length ? done(null, res.rows[0].value) : done(null);
  });
  
};

// update an existing user object
exports.update = function(user, done) {

  db.insert(user, function(err, res) {
    if (err) return done(err);
    db.get(res.id, done);
  });
  
};

// delete an existing user
exports.delete = function(match, query, done) {

  db.view('users', match, {key: query}, function(err, res) {
    if (err) return done(err);
    db.destroy(res.rows[0].value._id, res.rows[0].value._rev, function(err, res) {
      if (err) return done(err);
      done(null, true);
    });
  });
    
};