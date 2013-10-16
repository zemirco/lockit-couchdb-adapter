
var config = require('./config.js');
var should = require('should');

var db = require('nano')({
  url: config.dbUrl
});

var adapter = require('../index.js')(config);

// start the tests
describe('couchdb adapter for lockit', function() {
  
  // needed later for test 'find user by signup token'
  var _tmp_signupToken = '';

  it('should create a new user', function(done) {

    adapter.save('john', 'john@email.com', 'secret', function(err, res) {
      if (err) console.log(err);
      
      res.should.have.property('signupToken');
      res.signupToken.should.match(/[0-9a-f]{22}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
      res.should.have.property('failedLoginAttempts');
      res.failedLoginAttempts.should.equal(0);
      _tmp_signupToken = res.signupToken;
      res.email.should.equal('john@email.com');
      done();

    });

  });
  
  it('should find a user by username', function(done) {

    adapter.find('username', 'john', function(err, res) {
      if (err) console.log(err);
      res.username.should.equal('john');
      res.email.should.equal('john@email.com');
      done();
    });
    
  });
  
  it('should return undefined when no user is found', function(done) {

    adapter.find('username', 'jim', function(err, res) {
      if (err) console.log(err);
      
      should.not.exist(err);
      should.not.exist(res);
      done();
    });
    
  });
  
  it('should find a user by email', function(done) {

    adapter.find('email', 'john@email.com', function(err, res) {
      if (err) console.log(err);
      res.username.should.equal('john');
      res.email.should.equal('john@email.com');
      done();
    });
    
  });

  it('should find a user by signup token', function(done) {

    adapter.find('signupToken', _tmp_signupToken, function(err, res) {
      if (err) console.log(err);
      res.username.should.equal('john');
      res.email.should.equal('john@email.com');
      done();
    });

  });
  
  it('should update an existing user', function(done) {

    adapter.find('username', 'john', function(err, doc) {
      if (err) console.log(err);
      
      doc.test = 'works';
      doc.editet = true;

      adapter.update(doc, function(err, res) {
        if (err) console.log(err);
        
        res.test.should.equal('works');
        res.editet.should.be.true;
        done();
        
      });
      
    });
    
  });

  it('should remove a user', function(done) {

    var user = {
      username: 'jeff',
      email: 'jeff@email.com'
    };

    adapter.save('jeff', 'jeff@email.com', 'secret', function(err, res) {
      if (err) console.log(err);
      adapter.remove('username', 'jeff', function(err, res) {
        if (err) console.log(err);
        res.should.be.true;
        done();
      });
    });

  });
  
  it('should return an error when remove cannot find a user', function(done) {
    adapter.remove('username', 'steve', function(err, res) {
      err.message.should.equal('lockit - Cannot find username: "steve"');
      done();
    });
  });
  
});

// remove users db
after(function(done) {

  adapter.remove('username', 'john', done);
      
});