
exports.appname = 'My first App';
exports.url = 'http://localhost:3000';

// signup settings
exports.signupRoute = '/signup';
exports.signupTokenExpiration = 1000;

// email settings
exports.emailType = 'Stub';
exports.emailSettings = {
  service: 'none',
  auth: {
    user: 'none',
    pass: 'none'
  }
};
exports.emailFrom = 'myapp@domain.com';

// database settings
exports.dbUrl = 'http://127.0.0.1:5984/test';
exports.dbUser = '';
exports.dbPass = '';