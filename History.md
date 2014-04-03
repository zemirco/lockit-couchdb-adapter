
##### 0.3.0 - 2014-04-03

- create one database per user - `lockit/:username`
- add `type: 'user'` to user document
- simplify `remove()` method

  ```js
  adapter.remove(match, query, callback)
  ```

  becomes

  ```js
  adapter.remove(username, callback)
  ```

- change database connection string (leave out database name)

  ```js
  exports.db = 'http://127.0.0.1:5984/test';
  ```

  becomes

  ```js
  exports.db = 'http://127.0.0.1:5984/';
  ```

...

##### 0.1.0 - 2014-01-22

 - drop `dbUrl` and use `db` instead
 - use new `config.js` structure

##### 0.0.3 - 2013-12-27

 - improve handling of timestrings by using moment

##### 0.0.2 - 2013-09-21

 - return proper `err` when `delete()` method cannot find a user

##### 0.0.1 - 2013-09-21

 - initial release
