'use strict';

var uuid = require('node-uuid');
var ms = require('ms');
var moment = require('moment');
var Bluebird = require('bluebird');
var init = require('./utils/create-views.js');



/**
 * Adapter constructor function.
 *
 * @example
   var Adapter = require('lockit-couchdb-adapter');
   var config = require('./config.js');
   var adapter = new Adapter(config);
 *
 * @param {Object} config - Lockit configuration
 * @constructor
 */
var Adapter = module.exports = function(config) {

  if (!(this instanceof Adapter)) {return new Adapter(config); }

  this.config = config;

  // db connection string
  var url = config.db.url || config.db;
  var usersDbName = config.db.usersDbName || '_users';

  // per-user-db prefix
  this.prefix = config.db.prefix || 'lockit/';

  this.nano = require('nano')({
    url: url,
    request_defaults: config.request_defaults
  });

  // create views
  this._users = this.nano.use(usersDbName);
  init(this._users, function(err) {
    if (err) {throw err; }
  });

};



/**
 * Create a new user.
 *
 * @example
   adapter.save('john', 'john@email.com', 'secret', function(err, user) {
     if (err) console.log(err);
     console.log(user);
     // {
     //  _id: '8c7cd00c55a25ceb279a8e893d011b3e',
     //  _rev: '1-530a4cd8e67d51daf74e059899c39cd5',
     //  password_scheme: 'pbkdf2',
     //  iterations: 10,
     //  name: 'john',
     //  email: 'john@email.com',
     //  roles: [ 'user' ],
     //  type: 'user',
     //  signupToken: 'fed26ce9-2628-405a-b9fa-285d4a66f4c3',
     //  signupTimestamp: '2013-09-21T10:10:50.357Z',
     //  signupTokenExpires: '2014-01-15T15:27:29.020Z',
     //  failedLoginAttempts: 0,
     //  derived_key: '0a2b1714d6017e7efdc1154ee34c805dea29c06a',
     //  salt: '3a213c87b6a33c70fec767acea697994'
     // }
   });
 *
 * @param {String} name - User name
 * @param {String} email - User email
 * @param {String} pw - Plain text user password
 * @param {Function} done - Callback function `function(err, user){}`
 */
Adapter.prototype.save = function(name, email, pw, done) {
  var that = this;

  // create user document in _users db
  var createUser = function() {
    return new Bluebird(function (resolve, reject) {
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
        if (err) {return reject(err); }
        resolve(body);
      });
    });
  };

  // create per-user-db
  var createDb = function() {
    return new Bluebird(function(resolve, reject) {
      // create new db for user
      var dbName = that.prefix + name;
      that.nano.db.create(dbName, function(err) {
        if (err) {return reject(err); }
        // use new db
        var db = that.nano.use(dbName);
        // create _security document
        var securityDoc = {
           members: {
             names: [name]
           }
        };
        // save security document to db
        db.insert(securityDoc, '_security', function(insertErr, body) {
          if (insertErr) {return reject(insertErr); }
          resolve(body);
        });
      });
    });
  };

  // create both and callback when done
  Bluebird.all([createDb(), createUser()])
  .spread(function(dbResult, userInfo) {
    // get user from db
    that._users.get(userInfo.id, function(err, res) {
      if (err) {return done(err); }
      done(null, res);
    });
  })
  .catch(function(err) {
    done(err);
  });

};



/**
 * Find user. Match is either `'name'`, `'email'` or `'signupToken'`.
 *
 * @example
   adapter.find('name', 'john', function(err, user) {
     if (err) console.log(err);
     console.log(user);
     // {
     //  _id: '8c7cd00c55a25ceb279a8e893d011b3e',
     //  _rev: '1-530a4cd8e67d51daf74e059899c39cd5',
     //  password_scheme: 'pbkdf2',
     //  iterations: 10,
     //  name: 'john',
     //  email: 'john@email.com',
     //  roles: [ 'user' ],
     //  type: 'user',
     //  signupToken: 'fed26ce9-2628-405a-b9fa-285d4a66f4c3',
     //  signupTimestamp: '2013-09-21T10:10:50.357Z',
     //  signupTokenExpires: '2014-01-15T15:27:29.020Z',
     //  failedLoginAttempts: 0,
     //  derived_key: '0a2b1714d6017e7efdc1154ee34c805dea29c06a',
     //  salt: '3a213c87b6a33c70fec767acea697994'
     // }
   });
 *
 * @param {String} match - Property to find user by. `'name'`, `'email'` or `'signupToken'`
 * @param {String} query - Corresponding value to `match`
 * @param {Function} done - Callback function `function(err, user){}`
 */
Adapter.prototype.find = function(match, query, done) {
  var that = this;

  if (match === 'name') {
    // if match is 'name' no need to query the db
    return that._users.get('org.couchdb.user:' + query, function(err, res) {
      if (err && err.statusCode === 404) {return done(null); }
      if (err) {return done(err); }
      // callback
      done(null, res);
    });
  }

  // use a view document and query db
  that._users.view('lockit-user', match, {key: query}, function(err, res) {
    if (err) {return done(err); }
    if (!res.rows.length) {return done(null, null); }
    done(null, res.rows[0].value);
  });

};



/**
 * Update existing user.
 *
 * @example
   // get user from db
   adapter.find('name', 'john', function(err, user) {
     if (err) console.log(err);

     // add some new properties to our existing user
     user.newKey = 'and some value';
     user.hasBeenUpdated = true;

     // save updated user to db
     adapter.update(user, function(err, user) {
       if (err) console.log(err);
       // ...
     });
   });
 *
 * @param {Object} user - Existing user from db
 * @param {Function} done - Callback function `function(err, user){}`
 */
Adapter.prototype.update = function(user, done) {
  var that = this;

  that._users.insert(user, function(err, res) {
    if (err) {return done(err); }
    that._users.get(res.id, done);
  });
};



/**
 * Delete existing user.
 *
 * @example
   adapter.remove('john', function(err, res) {
     if (err) console.log(err);
     console.log(res);
     // true
   });
 *
 * @param {String} name - User name
 * @param {Function} done - Callback function `function(err, res){}`
 */
Adapter.prototype.remove = function(name, done) {
  var that = this;

  // remove user database
  var removeDb = function() {
    return new Bluebird(function(resolve, reject) {
      that.nano.db.destroy(that.prefix + name, function(err, res) {
        if (err && err.statusCode === 404) {
          return reject(new Error('lockit - Cannot find user "' + name + '"'));
        }
        if (err) {return reject(err); }
        resolve(res);
      });
    });
  };

  // and remove user from _users db
  var removeUser = function() {
    return new Bluebird(function (resolve, reject) {
      // get user first
      that._users.get('org.couchdb.user:' + name, function(err, res) {
        if (err && err.statusCode === 404) {
          return reject(new Error('lockit - Cannot find user "' + name + '"'));
        }
        if (err) {return reject(err); }
        // then delete user
        that._users.destroy(res._id, res._rev, function(destroyErr, body) {
          if (destroyErr) {return reject(destroyErr); }
          resolve(body);
        });
      });
    });
  };

  // do both and callback
  Bluebird.all([removeDb(), removeUser()])
  .then(function() {
    done(null, true);
  })
  .catch(function(err) {
    done(err);
  });
};
