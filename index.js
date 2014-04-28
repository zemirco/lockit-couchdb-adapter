
var uuid = require('node-uuid');
var ms = require('ms');
var moment = require('moment');
var Promise = require('bluebird');
var init = require('./utils/create-views.js');

module.exports = function(config) {

  // db connection string
  var url = config.db.url || config.db;

  // per-user-db prefix
  var prefix = config.db.prefix || 'lockit/';

  var nano = require('nano')({
    url: url,
    request_defaults: config.request_defaults
  });

  // create views
  var _users = nano.use('_users');
  init(_users, function(err, saved) {
    if (err) throw err;
  });

  var adapter = {};

  // save new user to db
  adapter.save = function(name, email, pw, done) {

    // create user document in _users db
    function createUser() {
      return new Promise(function (resolve, reject) {

        // init validation timespan
        var now = moment().toDate();
        var timespan = ms(config.signup.tokenExpiration);
        var future = moment().add(timespan, 'ms').toDate();

        // create a new user
        var user = {
          name: name,
          password: pw,
          email: email,
          roles: ['user'],
          type: 'user',
          signupToken: uuid.v4(),
          signupTimestamp: now,
          signupTokenExpires: future,
          failedLoginAttempts: 0
        };

        // add user to db
        _users.insert(user, 'org.couchdb.user:' + name, function(err, body) {
          if (err) return reject(err);
          resolve(body);
        });


      });
    }

    // create per-user-db
    function createDb() {
      return new Promise(function(resolve, reject) {
        // create new db for user
        var dbName = prefix + name;
        nano.db.create(dbName, function(err, body) {
          if (err) return reject(err);

          // use new db
          var db = nano.use(dbName);

          // create _security document
          var securityDoc = {
             members : {
               names : [name]
             }
          };

          // save security document to db
          db.insert(securityDoc, '_security', function(err, body) {
            if (err) return reject(err);
            resolve(body);
          });

        });
      });
    }

    // create both and callback when done
    Promise.all([
      createDb(),
      createUser()
    ])
    .spread(function(dbResult, userInfo) {
      // get user from db
      _users.get(userInfo.id, function(err, res) {
        if (err) return done(err);
        done(null, res);
      });
    })
    .catch(function(err) {
      done(err);
    });

  };

  // find a user
  // match is either "name", "email" or "signupToken"
  adapter.find = function(match, query, done) {
    if (match === 'name') {

      // if match is 'name' no need to query the db
      _users.get('org.couchdb.user:' + query, function(err, res) {
        if (err && err.status_code === 404) return done(null);
        if (err) return done(err);
        // callback
        done(null, res);
      });

    } else {

      // use a view document and query db
      _users.view('lockit-user', match, {key: query}, function(err, res) {
        if (err) return done(err);
        if (!res.rows.length) return done(null, null);
        done(null, res.rows[0].value);
      });

    }
  };

  // update an existing user object
  adapter.update = function(user, done) {
    _users.insert(user, function(err, res) {
      if (err) return done(err);
      _users.get(res.id, done);
    });
  };

  // delete an existing user
  adapter.remove = function(name, done) {

    // remove user database
    function removeDb() {
      return new Promise(function(resolve, reject) {
        nano.db.destroy(prefix + name, function(err, res) {
          if (err && err.status_code === 404) {
            return reject(new Error('lockit - Cannot find user "' + name + '"'));
          }
          if (err) return reject(err);
          resolve(res);
        });
      });
    }

    // and remove user from _users db
    function removeUser() {
      return new Promise(function (resolve, reject) {
        // get user first
        _users.get('org.couchdb.user:' + name, function(err, res) {
          if (err && err.status_code === 404) {
            return reject(new Error('lockit - Cannot find user "' + name + '"'));
          }
          if (err) return reject(err);
          // then delete user
          _users.destroy(res._id, res._rev, function(err, body) {
            if (err) return reject(err);
            resolve(body);
          });
        });
      });
    }

    // do both and callback
    Promise.all([
      removeDb(),
      removeUser()
    ])
    .then(function() {
      done(null, true);
    })
    .catch(function(err) {
      done(err);
    });

  };

  return adapter;
};
