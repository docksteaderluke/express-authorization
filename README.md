# express-authorize

A fork of express-authorization optimized for server-side authorization with a more succinct syntax, better documentation and more robust examples.
This module is an express/connect middleware module for enforcing an Apache Shiro inspired authorization system.

## Installation

    $ npm install express-authorize


## Basic usage
```js
var express = require('express')
var app = express()
var authorizer = require('express-authorize')

// Initialize authorizer with default options
authorizer.options = {
  /*
  withSubject     : withSubject,
  withPermissions : withPermissions,
  onDenied        : onDenied
  */
}

app.get('/restricted', authorizer.isPermitted("restricted:view"), function(req, res) {
  // Restricted content
  ...
})
```

## Documentation

### Definitions

**Permission** - a statement that defines access to an explicit activity, behaviour or action.

**Subject** - usually a website user, assigned permissions to enable access to sets of activities, behaviours, or actions.

**Claim** -  a collection of permissions that are assigned to a subject and compiled into a regular expression. The regular expression matches any permissions that are permitted by the subject (user), or permission list under consideration.

### Permission Wildcard Expressions

To practically assign sets of permissions to subjects, __express-authorize__ supports a wildcard enabled permission statement syntax that closely follows the syntax used by [Apache Shiro](http://shiro.apache.org/permissions.html).
A collection of permissions assigned to a subject are compiled by the system into a regular expression referred to as a claim.

* Permission statements are composed of from parts delimited by colons ```:```.
* Permission parts can contain lists delimited by commas ```,```.
* Wildcard ```?``` and ```*``` can be used to match one or more characters within an expression part.
* Examples:

| Expression | Description |
| ---------- | ----------- |
| ```'system:*'``` | **String** - has all permissions for system. Works for a single permission statement only |
| ```[ 'system:*', 'activity:create,update,delete' ]``` | **Array** - has all permissions for system and create/update/delete permissions for activity |
| ```'user:john,bill,eric:retrieve,update'``` | **Multi-level** - has retrieve and update permissions for the john, bill and eric users |

### Initialization

Create a new authorizer:
```js
var authorizer = require('express-authorize')
```

### Options
Setting options at initialization sets the default for that authorizer. The following options are available:

- _withSubject_ - A subject, usually a user, is expected to be represented by an object with a permissions property referring to either a single permission or an array of permissions. Defaults to req.user or req.session.user.
- _withPermissions_ - Permissions statements are strings that can be specified in parameter lists that may include arrays of composited permissions. Ignored if non-default subject is specified.
- _onDenied_ - Callback function for when permission is denied. Defaults to setting the res.status to 403 and passing next with a 'Permission denied' error.

All of these options can be set either through chained API calls for ad hoc overriding, or on the __Authorizer.options__ object to establish new defaults.

#### Setting the default subject
withSubject can be specified using an array, a function or an asynchronous function.
```js
// Use any object that has a "permissions" parameter (array)
var user = {
  username    : 'thisismyusername'
  permissions : [ 'account:view', 'payment:view' ]
}
authorizer.options.withSubject = user
// OR use a function that returns a valid subject
authorizer.options.withSubject = function(req, res) {
  var user = {
    username    : 'thisismyusername'
    permissions : [ 'account:view', 'payment:view' ]
  }
  return user
}
// OR use an asynchronous function that passes a valid subject to a callback function
authorizer.options.withSubject = function(req, res, done) {
  var user = {
    username    : 'thisismyusername'
    permissions : [ 'account:view', 'payment:view' ]
  }
  done(user)
}
```

#### Setting the default permissions
withPermissions can be specified using a string (for a single permission statement), an array, a function or an asynchronous function.
```js
// Use a string for a single permission
authorizer.options.withPermissions = 'account:view'
// OR use an array of permissions
authorizer.options.withPermissions = [ 'account:view', 'payment:view' ]
// OR use a function
authorizer.options.withPermissions = function(req, res) {
  return [ 'account:view', 'payment:view' ]
}
// OR use an asynchronous function
authorizer.options.withPermissions = function(req, res, done) {
  done([ 'account:view', 'payment:view' ])
}
```

#### Setting the default onDenied callback
onDenied must be an express/connect compatible middleware function
```js
authorizer.options.onDenied = function(req, res, next) {
  res.redirect('/login')
}
```


### Ad hoc permission queries
Options can be overridden in an ad hoc manner using a permission query.
In the permission query API, a permission source is placed under consideration and compiled into a claim that is
queried to confirm permitted permissions. This is beneficial when you want to change the considered subject, permissions

```js
// Use the default options
authorizer.isPermitted('express:coding')
// One-time override of the subject being considered
authorizer
  .withSubject(user)
  .isPermitted('express:coding')
// One-time override of the permissions being considered
authorizer
  .withPermissions('source:edit', 'express:*')
  .isPermitted('express:coding')
// One-time override of the onDenied function
authorizer
  .onDenied(function(req, res, next) {
    res.redirect('/login')
  })
  .isPermitted('express:coding')
```

Methods can be chained in combination.

#### From subject or permission list -> claim -> isPermitted
```js
authorizer.withSubject | authorizer.withPermissions -> claim
```
The __withSubject__ and __withPermissions__ methods are used to generate a claim object. **Note** that specifying a subject source always supercedes specifying a permission source. Only one consideration source should be used at a time.

### Express Middleware

__express-authorize__ uses a fluent API to generate express middleware for enforcing permissions.
```js
app.get('/restricted', authorizer.isPermitted("restricted:view"), function(req, res) {
  // Restricted content
  ...
})
```
To generate an express middleware, you write a call chain starting with a reference to __express-authorize__
and ending in a call to __isPermitted__.  The call to __isPermitted__ returns a connect/express compliant middleware function.

By default, __express-authorize__ sources permissions from the session through references to session.user.permissions or session.permissions.
To consider alternative permission sources, __withSubject__ or __withPermissions__ are used.
```js
app.get('/restricted',
  authorizer
    .withPermissions(["identity:*"])
    .onDenied(function(req, res, next) {
      res.redirect('/login')
    })
    .isPermitted("identity:edit"),
  function(req, res) {
    // Restricted content
    res.send('Hooray! You have permission to access this secret content!')
    ...
})

```

### Defaults
By default, __express-authroize__ sources permissions using the following function:
```js
function withPermissionsDefault(req, res) {
  if (req.user && req.user.permissions) return req.user.permissions
  if (req.session && req.session.user && req.session.user.permissions) return req.session.user.permissions
  if (req.permissions) return req.permissions
  return []
}
```

The default onDenied function sets ```res.status(403)``` and passes an error to next.
```js
function onDeniedDefault(req, res, next) {
  res.status(403)
  next('Permission denied')
}
```

### Initialize another authorizer object
When calling ```require('express-authorize')``` a new Authorizer instance is returned. In order to initialize a second instance do the following:
```js
var anotherAuthorizer = new authorizer.Authorizer(/* options */)
```

## License

MIT License

Copyright (c) 2013 [Support.com, Inc.](http://www.support.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
