
### find(match, query, done)

Find user. Match is either `name`, `email` or `signupToken`.


- `match` **String** - Property to find user by. <code>name</code>, <code>email</code> or <code>signupToken</code>

- `query` **String** - Corresponding value to <code>match</code>

- `done` **function** - Callback function <code>function(err, user){}</code>





#### Example


```javascript
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
```


