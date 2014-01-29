
var seed = require('couchdb-seed-design');

module.exports = function(config, cb) {

  // create db connection
  var db = require('nano')(config.db);
  
  // all necessary views
  var views = {
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
    },
    pwdResetToken: {
      map: function(doc) {
        emit(doc.pwdResetToken, doc);
      }
    }
  };

  // save to db
  seed(db, {users: {views: views}}, cb);
    
};