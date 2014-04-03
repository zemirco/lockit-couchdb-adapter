
var uuid = require('node-uuid');
var bcrypt = require('bcrypt');
var ms = require('ms');
var moment = require('moment');
var Promise = require('bluebird');
var init = require('./utils/create-views.js');

module.exports = function(config) {

  var nano = require('nano')(config.db);

  var adapter = {};

  // also return signupToken
  adapter.save = function(name, email, pw, done) {

    // create new db for user
    var dbName = 'lockit/' + name;
    nano.db.create(dbName, function(err, body) {
      if (err) return done(err);

      var db = nano.use(dbName);

      // create views
      init(db, function(err, saved) {
        if (err) return done(err);

        // create user
        var now = moment().toDate();
        var timespan = ms(config.signup.tokenExpiration);
        var future = moment().add(timespan, 'ms').toDate();

        var user = {
          type: 'user',
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

      });

    });

  };

  // find a user
  // match is either "username", "email" or "signupToken"
  adapter.find = function(match, query, done) {

    function checkDbforUser(dbName) {
      return new Promise(function (resolve, reject) {
        var db = nano.use(dbName);
        db.view('lockit-user', match, {key: query}, function(err, res) {
          if (err) return reject(err);
          if (!res.rows.length) return resolve(null);
          resolve(res.rows[0].value);
        });
      });
    }

    // get all dbs
    nano.db.list(function(err, body) {
      if (err) return done(err);

      // loop through all dbs and check for 'lockit/...'
      var dbs = body.filter(function(db) {
        if (/^lockit\//.test(db)) return db;
      });

      // create array with promises to query every single db
      var promisesArray = dbs.map(function(dbName) {
        return checkDbforUser(dbName);
      });

      // query all dbs
      Promise.filter(promisesArray, function(result) {
        if (result) return result;
      })
      .spread(function(res) {
        done(null, res);
      })
      .catch(function(err) {
        done(err);
      });

    });

  };

  // update an existing user object
  adapter.update = function(user, done) {
    var db = nano.use('lockit/' + user.username);
    db.insert(user, function(err, res) {
      if (err) return done(err);
      db.get(res.id, done);
    });
  };

  // delete an existing user
  adapter.remove = function(username, done) {
    nano.db.destroy('lockit/' + username, function(err, res) {
      if (err && err.status_code === 404) {
        return done(new Error('lockit - Cannot find user "' + username + '"'));
      }
      if (err) return done(err);
      done(null, res.ok);
    });
  };

  return adapter;
};
