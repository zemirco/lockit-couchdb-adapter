
var uuid = require('node-uuid');
var ms = require('ms');
var moment = require('moment');
var Promise = require('bluebird');
var init = require('./utils/create-views.js');



/**
 * Adapter constructor function.
 *
 * @param {Object} config
 * @constructor
 */
var Adapter = module.exports = function(config) {

  if (!(this instanceof Adapter)) return new Adapter(config);

  this.config = config;

  // db connection string
  var url = config.db.url || config.db;

  // per-user-db prefix
  this.prefix = config.db.prefix || 'lockit/';

  this.nano = require('nano')({
    url: url,
    request_defaults: config.request_defaults
  });

  // create views
  this._users = this.nano.use('_users');
  init(this._users, function(err, saved) {
    if (err) throw err;
  });

};



/**
 * Create a new user.
 *
 * @param {String} name
 * @param {String} email
 * @param {String} pw
 * @param {Function} done
 */
Adapter.prototype.save = function(name, email, pw, done) {
  var that = this;

  // create user document in _users db
  var createUser = function() {
    return new Promise(function (resolve, reject) {
      // init validation timespan
      var now = moment().toDate();
      var timespan = ms(that.config.signup.tokenExpiration);
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
      that._users.insert(user, 'org.couchdb.user:' + name, function(err, body) {
        if (err) return reject(err);
        resolve(body);
      });
    });
  };

  // create per-user-db
  var createDb = function() {
    return new Promise(function(resolve, reject) {
      // create new db for user
      var dbName = that.prefix + name;
      that.nano.db.create(dbName, function(err, body) {
        if (err) return reject(err);
        // use new db
        var db = that.nano.use(dbName);
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
  };

  // create both and callback when done
  Promise.all([createDb(), createUser()])
  .spread(function(dbResult, userInfo) {
    // get user from db
    that._users.get(userInfo.id, function(err, res) {
      if (err) return done(err);
      done(null, res);
    });
  })
  .catch(function(err) {
    done(err);
  });

};



/**
 * Find user. Match is either `name`, `email` or `signupToken`.
 *
 * @param {String} match
 * @param {String} query
 * @param {Function} done
 */
Adapter.prototype.find = function(match, query, done) {
  var that = this;

  if (match === 'name') {
    // if match is 'name' no need to query the db
    return that._users.get('org.couchdb.user:' + query, function(err, res) {
      if (err && err.status_code === 404) return done(null);
      if (err) return done(err);
      // callback
      done(null, res);
    });
  }

  // use a view document and query db
  that._users.view('lockit-user', match, {key: query}, function(err, res) {
    if (err) return done(err);
    if (!res.rows.length) return done(null, null);
    done(null, res.rows[0].value);
  });

};



/**
 * Update existing user.
 *
 * @param {Object} user
 * @param {Function} done
 */
Adapter.prototype.update = function(user, done) {
  var that = this;

  that._users.insert(user, function(err, res) {
    if (err) return done(err);
    that._users.get(res.id, done);
  });
};



/**
 * Delete existing user.
 *
 * @param {String} name
 * @param {Function} done
 */
Adapter.prototype.remove = function(name, done) {
  var that = this;

  // remove user database
  var removeDb = function() {
    return new Promise(function(resolve, reject) {
      that.nano.db.destroy(that.prefix + name, function(err, res) {
        if (err && err.status_code === 404) {
          return reject(new Error('lockit - Cannot find user "' + name + '"'));
        }
        if (err) return reject(err);
        resolve(res);
      });
    });
  };

  // and remove user from _users db
  var removeUser = function() {
    return new Promise(function (resolve, reject) {
      // get user first
      that._users.get('org.couchdb.user:' + name, function(err, res) {
        if (err && err.status_code === 404) {
          return reject(new Error('lockit - Cannot find user "' + name + '"'));
        }
        if (err) return reject(err);
        // then delete user
        that._users.destroy(res._id, res._rev, function(err, body) {
          if (err) return reject(err);
          resolve(body);
        });
      });
    });
  };

  // do both and callback
  Promise.all([removeDb(),removeUser()])
  .then(function() {
    done(null, true);
  })
  .catch(function(err) {
    done(err);
  });
};
