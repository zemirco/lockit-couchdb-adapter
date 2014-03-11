
var uuid = require('node-uuid');
var bcrypt = require('bcrypt');
var ms = require('ms');
var moment = require('moment');

module.exports = function(config) {

  var db = require('nano')(config.db);

  // load helper function
  var init = require('./utils/create-views.js');

  // create views
  init(config, function(err, saved) {
    if (err) throw err;
  });

  var adapter = {};

  // also return signupToken
  adapter.save = function(name, email, pw, done) {

    var now = moment().toDate();
    var timespan = ms(config.signup.tokenExpiration);
    var future = moment().add(timespan, 'ms').toDate();

    var user = {
      username: name,
      email: email,
      signupToken: uuid.v4(),
      signupTimestamp: now,
      signupTokenExpires: future,
      failedLoginAttempts: 0
    };

    // create salt and hash password
    bcrypt.hash(pw, 10, function(err, hash) {
      if (err) return done(err);
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
  adapter.find = function(match, query, done) {

    db.view('lockit-users', match, {key: query}, function(err, res) {
      if (err) return done(err);
      res.rows.length ? done(null, res.rows[0].value) : done(null);
    });

  };

  // update an existing user object
  adapter.update = function(user, done) {

    db.insert(user, function(err, res) {
      if (err) return done(err);
      db.get(res.id, done);
    });

  };

  // delete an existing user
  adapter.remove = function(match, query, done) {

    db.view('lockit-users', match, {key: query}, function(err, res) {
      if (err) return done(err);
      // no user found
      if (!res.rows.length) return done(new Error('lockit - Cannot find ' + match + ': "' + query + '"'));
      // delete user from db
      db.destroy(res.rows[0].value._id, res.rows[0].value._rev, function(err, res) {
        if (err) return done(err);
        done(null, true);
      });
    });

  };


  return adapter;
};
