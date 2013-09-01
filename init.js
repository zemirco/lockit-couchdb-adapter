
var config = require('./config.dev.js');

// create couchdb templates
var db = require('nano')({
//  url: 'https://' + config.dbUser + ':' + config.dbPass + '@' + config.dbUrl + '',
  url: config.dbUrl
//  request_defaults: config.request_defaults
});

// couchdb views we need to make the app work
var users = {
  _id: '_design/users',
  views: {
    username: {
      map: function(doc) {
        emit(doc.username, doc);
      }
    },
    email: {
      map: function(doc) {
        emit(doc.email, doc);
      }
    },
    signupToken: {
      map: function(doc) {
        emit(doc.signupToken, doc);
      }
    }
  }
};

// save views to db
db.insert(users, function(err, body) {
  if (err) console.log(err);
  console.log('done');
});