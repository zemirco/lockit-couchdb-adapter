
var seed = require('couchdb-seed-design');

module.exports = function(db, cb) {

  // all necessary views
  var views = {
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
  seed(db, {'lockit-user': {views: views}}, cb);

};
