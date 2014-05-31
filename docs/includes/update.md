
### update(user, done)

Update existing user.


- `user` **Object** - Existing user from db

- `done` **function** - Callback function <code>function(err, user){}</code>





#### Example


```javascript
// get user from db
adapter.find('name', 'john', function(err, user) {
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


