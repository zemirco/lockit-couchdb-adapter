# CouchDB adapter for lockit

[![Build Status](https://travis-ci.org/zeMirco/lockit-couchdb-adapter.png)](https://travis-ci.org/zeMirco/lockit-couchdb-adapter)

work in progress - come back later

## Installation

`npm install ...`

```js
var adapter = require('....');
```

To initialize the necessary views in your CouchDB run `node ./createViews.js`. The settings from `./test/config.js` are taken
to connect to CouchDB.

## What's included?

### 1. Create user

`adapter.create(name, email, pass, callback)`

 - `name`: String - i.e. 'john'
 - `email`: String - i.e. 'john@email.com'
 - `pass`: String - i.e. 'password123'
 - `callback`: Function - `callback(err, user)` where `user` is the new user now in our database.

The `user` object has the following properties

 - `_id`: unique id from CouchDB
 - `_rev`: revision from CouchDB
 - `email`: email that was provided at the beginning
 - `hash`: hashed password using [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/)
 - `signupTimestamp`: Date object to remember when the user signed up
 - `signupToken`: unique token sent to user's email for email verification
 - `signupTokenExpires`: Date object usually 24h ahead of `signupTimestamp`
 - `username`: username chosen during sign up
 - `failedLoginAttempts`: save failed login attempts during login process, default is `0`

```js
adapter.create('john', 'john@email.com', 'secret', function(err, user) {
  if (err) console.log(err);
  console.log(user);
  // {
  //  _id: '8c7cd00c55a25ceb279a8e893d011b3e',
  //  _rev: '1-530a4cd8e67d51daf74e059899c39cd5',
  //  username: 'john',
  //  email: 'john@email.com',
  //  signupToken: 'fed26ce9-2628-405a-b9fa-285d4a66f4c3',
  //  signupTimestamp: '2013-09-21T10:10:50.357Z',
  //  signupTokenExpires: null,
  //  failedLoginAttempts: 0,
  //  hash: '$2a$10$OUNHWf0nCksGgrVqR7O3f.YqqDTuTTe5HqGMw0OiNMy0cixwSS5Km'
  // }
});
```

### 2. Find user

`adapter.find(match, query, callback)`

 - `match`: String - one of the following: 'username', 'email' or 'signupToken'
 - `query`: String - corresponds to `match`, i.e. 'john@email.com'
 - `callback`:  Function - `callback(err, user)`
 
```js
adapter.find('username', 'john', function(err, user) {
  if (err) console.log(err);
  console.log(user);
  // {
  //  _id: '8c7cd00c55a25ceb279a8e893d011b3e',
  //  _rev: '1-530a4cd8e67d51daf74e059899c39cd5',
  //  username: 'john',
  //  email: 'john@email.com',
  //  signupToken: 'fed26ce9-2628-405a-b9fa-285d4a66f4c3',
  //  signupTimestamp: '2013-09-21T10:10:50.357Z',
  //  signupTokenExpires: null,
  //  failedLoginAttempts: 0,
  //  hash: '$2a$10$OUNHWf0nCksGgrVqR7O3f.YqqDTuTTe5HqGMw0OiNMy0cixwSS5Km'
  // }
});
```

### 3. Update user

`adapter.update(user, callback)`

 - `user`: Object - must have `_id` and `_rev` properties
 - `callback`: Function - `callback(err, user)` - `user` is the updated user object
 
```js
// get a user from db first
adapter.find('username', 'john', function(err, user) {
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
```

### 4. Delete user

`adapter.delete(match, query, callback)`

 - `match`: String - one of the following: 'username', 'email' or 'signupToken'
 - `query`: String - corresponds to `match`, i.e. `john@email.com`
 - `callback`: Function - `callback(err, res)` - `res` is `true` if everything went fine
 
```js
adapter.delete('username', 'john', function(err, res) {
  if (err) console.log(err);
  console.log(res);
  // true
});
```

## Test

JavaScript files are hinted during tests and module is tested with Mocha. You need to have a CouchDB instance running 
with the settings specified at `./test/config.js`. To start the test simply run the default Grunt task.

`grunt`

## License

Copyright (C) 2013 [Mirco Zeiss](mailto: mirco.zeiss@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.