
var config = require('../config.dev.js');
var should = require('should');

var db = require('nano')({
  url: 'https://' + config.dbUser + ':' + config.dbPass + '@' + config.dbUrl + '',
  request_defaults: config.request_defaults
});

var keyhole = require('../index.js');

// start the tests
describe('keyhole for couchdb', function() {
  
  // needed later for test 'find user by signup token'
  var _tmp_signupToken = '';

  it('should create a new user with sign up token', function(done) {

    keyhole.create('john', 'john@email.com', 'secret', function(err, res) {
      if (err) console.log(err);

      res.should.have.property('signupToken');
      res.signupToken.should.match(/[0-9a-f]{22}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
      _tmp_signupToken = res.signupToken;
      res.email.should.equal('john@email.com');
      done();

    });

  });
  
  it('should find a user by username', function(done) {

    keyhole.find('username', 'john', function(err, res) {
      if (err) console.log(err);
      res.username.should.equal('john');
      done();
    });
    
  });
  
  it('should return undefined when no user is found', function(done) {

    keyhole.find('username', 'jim', function(err, res) {
      if (err) console.log(err);
      
      should.not.exist(err);
      should.not.exist(res);
      done();
    });
    
  });
  
  it('should find a user by email', function(done) {

    keyhole.find('email', 'john@email.com', function(err, res) {
      if (err) console.log(err);
      res.email.should.equal('john@email.com');
      done();
    });
    
  });

  it('should find a user by sign up token', function(done) {

    keyhole.find('signupToken', _tmp_signupToken, function(err, res) {
      if (err) console.log(err);
      res.username.should.equal('john');
      done();
    });

  });
  
  it('should update an existing user', function(done) {
    
    keyhole.find('username', 'john', function(err, doc) {
      if (err) console.log(err);
      
      doc.test = 'works';
      doc.editet = true;
      
      keyhole.update(doc, function(err, res) {
        if (err) console.log(err);
        
        res.test.should.equal('works');
        res.editet.should.be.true;
        done();
        
      });
      
    });
    
  });
  
  it('should delete a user', function(done) {

    var user = {
      username: 'jeff',
      email: 'jeff@email.com'
    };

    db.insert(user, function(err, res) {
      if (err) console.log(err);
      keyhole.delete('username', 'jeff', function(err, res) {
        if (err) console.log(err);
        res.should.be.true;
        done();
      });
    });

  });
  
});

// remove users db
after(function(done) {
      
  keyhole.delete('username', 'john', done);
      
});