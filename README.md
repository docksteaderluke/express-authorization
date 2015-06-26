# express-authorize

A fork of express-authorization optimized for server-side authorization with a simpler syntax, better documentation and more robust examples.
This module is an express/connect middleware module for enforcing an Apache Shiro inspired authorization system.

```js
var express = require('express');
var authorization = require('express-authorize');
var app = express();

// Consider an authenticated user in the express session:
// req.session.user.permissions = ["restricted:*"]

app.get('/restricted',
  authorization.ensureRequest.isPermitted("restricted:view"),
  function(req, res) {
    ...
  });
```

## Installation

    $ npm install express-authorize

## Features

  * Easy integration into your express or connect based code
  * Permission claim evaluation in the browser
  * Expressive permissions inspired by [Apache Shiro](http://shiro.apache.org/permissions.html)
  * Customizable to fit your application needs
  * High test coverage

## Philosophy

  In __express-authorize__, a permission is a statement that defines access to an explicit activity, behavior or action.
  Subjects, usually website users, are assigned permissions to enable access to sets of activities, behaviors, or actions.
  To practically assign sets of permissions to subjects, __express-authorize__ supports a wildcard enabled permission statement
  syntax that closely follows the syntax used by [Apache Shiro](http://shiro.apache.org/permissions.html).
  A collection of permissions assigned to a subject are compiled by the system into a regular expression referred to as a claim.
  Claims are then queried regarding whether or not they permit permissions that gate activities, behaviors, or actions.

## Documentation

### Permission Wildcard Expressions

  __express-authorize__ uses the [Apache Shiro](http://shiro.apache.org/permissions.html) wildcard permission syntax directly.

   * Permission statements are composed of from parts delimited by colons (:).
   * Permission parts can contain lists delimited by commas (,).
   * Wildcard ? and * can be used to match one or more characters within an expression part.
   * Examples: system:* | activity:create,update,delete
   

### Initialization
  
  Create a new authorizer:
  ```js
  var ExpressAuthorizer = require('express-authorize')
  var authorizer = new ExpressAuthorizer({
    onDenied : function(req, res, next) {
      res.status(403).json({
        msg : 'You do not have the required permissions to access this resource'
      })
    }
  })
  ```

### Permission Query

  Permissions statements are strings that can be specified in parameter lists that may include arrays of composited permissions.
  A subject, usually a user, is expected to be represented by an object with a permissions property referring to either
  a single permission or an array of permissions.

  In the permission query API, a permission source is placed under consideration and compiled into a claim that is
  queried to confirm permitted permissions.

```js
authorization
  .withSubject(user)
  .isPermitted("express:coding")
authorization
  .withPermissions("source:edit", "express:*")
  .isPermitted("express:coding")
```

#### From subject or permission list -> claim -> isPermitted
```js
authorization.withSubject | authorization.withPermissions -> claim
```
  The __withSubject__ and __withPermissions__ methods are used to generate a claim object.
  A claim object is litterly a regular expression that matches any permissions that are permitted by the
  subject, user, or permission list under consideration.  In addition, an __isPermitted__ method is exposed on
  the claim for checking if one or more permissions are supported.  See the __consider__ test cases in the code
  for more examples.

### Express Middleware

  __express-authorize__ uses a fluent API to generate express middleware for enforcing permissions.
  ```js
  authorization.isPermitted("restricted:view")
  ```
  To generate an express middleware, you write a call chain starting with a reference to __express-authorize__
  and ending in a call to __isPermitted__.  The call to __isPermitted__ returns a connect/express compliant middleware function.

  By default, __express-authorize__ sources permissions from the session through references to session.user.permissions or session.permissions.
  To consider alternative permission sources, __withSubject__ or __withPermissions__ callbacks (asynchronous or immediate) are used.
  ```js
  authorization.
    .withPermissions(["identity:*"])
    .isPermitted("identity:edit")
  ```

  __onDenied__ can be used to provide a custom response function.

  All of these options (__withSubject__, __withPermissions__, and __onDenied__)
  can be set either through chained API calls, or on the __ensureRequest.options__ object.
  When set on the global __authorization.options__, these establish new defaults.

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
