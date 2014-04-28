
var config = require('./config.js');
var should = require('should');

// create db connection with pure nano to test custom prefix
var nano = require('nano')(config.db);

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

  it('should create a new user when using an object in config', function(done) {
    var config_alt = JSON.parse(JSON.stringify(config));
    config_alt.db = {
      url: 'http://127.0.0.1:5984/'
    };
    var adapter_alt = require('../index.js')(config_alt);
    adapter_alt.save('jack', 'jack@email.com', 'secret', function(err, res) {
      if (err) console.log(err);
      res.name.should.equal('jack');
      done();
    });
  });

  it('should use the custom prefix if provided', function(done) {
    var config_alt = JSON.parse(JSON.stringify(config));
    config_alt.db = {
      url: 'http://127.0.0.1:5984/',
      prefix: 'custom/'
    };
    var adapter_alt = require('../index.js')(config_alt);
    adapter_alt.save('prefix', 'prefix@email.com', 'secret', function(err, res) {
      if (err) console.log(err);

      // make sure db 'custom/prefix' exists
      nano.db.get('custom/prefix', function(err, body) {
        if (err) console.log(err);
        body.db_name.should.equal('custom/prefix');
        done();
      });

    });
  });

  it('should find a user by name', function(done) {
    adapter.find('name', 'john', function(err, res) {
      if (err) console.log(err);
      res.name.should.equal('john');
      res.email.should.equal('john@email.com');
      done();
    });
  });

  it('should return null when no user is found', function(done) {
    adapter.find('name', 'jim', function(err, res) {
      if (err) console.log(err);
      should.not.exist(err);
      should.not.exist(res);
      done();
    });
  });

  it('should find a user by email', function(done) {
    adapter.find('email', 'john@email.com', function(err, res) {
      if (err) console.log(err);
      res.name.should.equal('john');
      res.email.should.equal('john@email.com');
      done();
    });
  });

  it('should find a user by signup token', function(done) {
    adapter.find('signupToken', _tmp_signupToken, function(err, res) {
      if (err) console.log(err);
      res.name.should.equal('john');
      res.email.should.equal('john@email.com');
      done();
    });
  });

  it('should update an existing user', function(done) {
    adapter.find('name', 'john', function(err, doc) {
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
    adapter.save('jeff', 'jeff@email.com', 'secret', function(err, res) {
      if (err) console.log(err);
      adapter.remove('jeff', function(err, res) {
        if (err) console.log(err);
        res.should.be.true;
        done();
      });
    });
  });

  it('should return an error when remove cannot find a user', function(done) {
    adapter.remove('steve', function(err, res) {
      err.message.should.equal('lockit - Cannot find user "steve"');
      done();
    });
  });

});

// remove user and per-user-db
after(function(done) {
  adapter.remove('john', function(err, res) {
    adapter.remove('jack', function(err, res) {

      // use alternative connection for removing user with custom prefix
      var config_alt = JSON.parse(JSON.stringify(config));
      config_alt.db = {
        url: 'http://127.0.0.1:5984/',
        prefix: 'custom/'
      };
      var adapter_alt = require('../index.js')(config_alt);

      adapter_alt.remove('prefix', done);
    });
  });
});
