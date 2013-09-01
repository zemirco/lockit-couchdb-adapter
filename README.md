# Keyhole CouchDB adapter for lockit

work in progress - come back later

## Installation

`npm install ...`

```js
var adapter = require('....');
```

To initialize the necessary views in your CouchDB run `node ./init.js`.

## What's included?

### 1. Create a new user

`adapter.create(name, email, pass, callback)`

 - `name`: `String` - i.e. `john`
 - `email`: `String` - i.e. `john@email.com`
 - `pass`: `String` - i.e. `password123`
 - `callback`: `Function` - `callback(err, user)` where `user` is the new user now in our database.

The `user` object has the following properties

 - `_id`: unique id from CouchDB
 - `_rev`: revision from CouchDB
 - `email`: email that was provided at the beginning
 - `hash`: hashed password using `salt` and `crypto.pbkdf2`
 - `salt`: random salt built with `crypto.randomBytes`
 - `signupTimestamp`: Date object to remember when the user signed up
 - `signupToken`: unique token sent to user's email for email verification
 - `signupTokenExpires`: Date object usually one day ahead of `signupTimestamp`
 - `username`: username chosen during sign up

Example:

```js
adapter.create('john', 'john@email.com', 'password123', function(err, user) {
  if (err) console.log(err);
  console.log(user);
  // {
  //   _id: 6c656ff4bc96e9be5421dc31b3f39857,
  //   _rev: 1-0f2898bf278f3ce07947344100dc48e2,
  //   email: john@email.com,
  //   hash: hETVkwFgzVrrLZ.....j4UywW6Vs9eJQNokD+....+wV7yE8oda1CE4HnaPRSf..., 
  //   salt: qG+9aYSy7/2JehVZ9u...IOgJ7l0avHnoYLnYeKq77Rs...k4uj...4EzBvDYCa...,
  //   signupTimestamp: 2013-09-01T11:23:29.781Z,
  //   signupToken: 2f70719f-579f-4c47-b307-2d544e6336f9,
  //   signupTokenExpires: 2013-09-02T11:23:29.780Z,
  //   username: john
  // }
})
```

### 2. Find an existing user

`adapter.find(match, query, callback)`

`match`: `String` - one of the following: 'username', 'email' or 'signupToken'
`query`: `String` - corresponds to `match`, for example `john@email.com`
`callback`:  `Function` - `callback(err, user)`

### 3. Update an existing user

`adapter.update(user, callback)`

`user`: `Object` - must have `_id` and `_rev` properties
`callback`: `Function` - `callback(err, user)` - `user` is the updated user object

### 4. Delete an existing user

`adapter.delete(match, query, callback)`

`match`: `String` - one of the following: 'username', 'email' or 'signupToken'
`query`: `String` - corresponds to `match`, for example `john@email.com`
`callback`:  `Function` - `callback(err, res)` - `res` is `true` if everything went fine

## Test

`npm test`

## License

Copyright (C) 2013 [Mirco Zeiss](mailto: mirco.zeiss@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.