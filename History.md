
##### 0.4.3 / 2014-05-22

- code refactoring
- update dependencies

##### 0.4.2 / 2014-04-28

- initialize all views on startup (fix [#6](https://github.com/zeMirco/lockit-couchdb-adapter/issues/6))
- per-user-db prefix is now configurable (fix [#7](https://github.com/zeMirco/lockit-couchdb-adapter/pull/7))
- update `nano`, `moment`, `bluebird`

##### 0.4.1 / 2014-04-17

- database connection can also be an Object

  ```js
  // this still works - short form
  exports.db = 'http://127.0.0.1:5984/';  

  // this also works - long form (required for MongoDB and SQL)
  exports.db = {
    url: 'http://127.0.0.1:5984/'
  };
  ```

##### 0.4.0 / 2014-04-10

- use optional `request_defaults`
- use CouchDB's native authentication features

  Each user gets an own database named `lockit/[name]`.
  Before 0.4.0 `user` documents were saved within these dbs. Beginning with 0.4.0
  each `user` document is saved in the `_users` db under the name `org.couchdb.user:[name]`.
  Because CouchDB requires the `user` document to have a `name` key I had to change
  the key from `username` to `name`. These changes will be reflected in all the other
  Lockit db adapters.

- add `_security` document to each `lockit/[name]` db

  The per-user-db should only be readable by the rightful owner. So only `john`
  should have access to the `lockit/john` database. CouchDB provides this feature
  out of the box. I simply had to add an extra `_security` document.

  ```js
  {
    members : {
      names : [name]
    }
  }
  ```

##### 0.3.0 / 2014-04-03

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

##### 0.1.0 / 2014-01-22

 - drop `dbUrl` and use `db` instead
 - use new `config.js` structure

##### 0.0.3 / 2013-12-27

 - improve handling of timestrings by using moment

##### 0.0.2 / 2013-09-21

 - return proper `err` when `delete()` method cannot find a user

##### 0.0.1 / 2013-09-21

 - initial release
