'use strict'

// Ignore mocha globals
/* global describe */
/* global it */

var assert = require('assert')
var authorizer = require('../')

describe('isPermitted', function() {
  function httpContextMock(result, done) {
    var self = this
    this.done = done
    this.result = result
    result.redirectedTo = undefined
    result.status = 200
    result.nextCalled = false
    this.req = {
      session : {
        user : {
          permissions : [ "identity:view", "session:*", "system:list,view,edit", "version:v2??" ]
        }
      }
    }
    this.res = {
      redirect : function (url) {
        self.result.redirectedTo = url
        if (self.done) self.done()
      },
      status : function(code) {
        self.result.status = code
        if (self.done) self.done()
      }
    }
    this.next = function(err) {
      if (!err) {
        self.result.nextCalled = true
        if (self.done) self.done()
      }
    }
  }

  function checkMiddleware(middleware, result, done, check) {
    var httpContext = new httpContextMock(result, function () {
      try {
        check(result)
        done()
      } catch(e) {
        done(e)
      }
    })
    middleware(httpContext.req, httpContext.res, httpContext.next)
  }

  function checkPermitted(result) {
    assert.equal(result.status, 200)
    assert.equal(result.nextCalled, true)
  }

  function checkDenied(result) {
    assert.equal(result.status, 403)
    assert.equal(result.nextCalled, false)
  }

  function checkRedirectedElsewhere(result) {
    assert.equal(result.redirectedTo, '/elsewhere')
    assert.equal(result.nextCalled, false)
  }

  it('permitted', function(done) {
    var result = {}
    var middleware = authorizer.isPermitted("identity:view")
    checkMiddleware(middleware, result, done, checkPermitted)
  })

  it('permitted asserting multiple permissions', function(done) {
    var result = {}
    var middleware = authorizer.isPermitted("identity:view", "system:list")
    checkMiddleware(middleware, result, done, checkPermitted)
  })

  it('denied', function(done) {
    var result = {}
    var middleware = authorizer.isPermitted("identity:edit")
    checkMiddleware(middleware, result, done, checkDenied)
  })

  it('denied asserting multiple permissions as array', function(done) {
    var result = {}
    var middleware = authorizer.isPermitted([ "identity:view", "system:reboot" ])
    checkMiddleware(middleware, result, done, checkDenied)
  })

  it('denied asserting multiple permissions as arguments', function(done) {
    var result = {}
    var middleware = authorizer.isPermitted("identity:view", "system:reboot")
    checkMiddleware(middleware, result, done, checkDenied)
  })

  it('denied redirectTo', function(done) {
    var result = {}
    var middleware = authorizer.onDenied(function(req, res, next) {
      res.redirect('/elsewhere')
    }).isPermitted("identity:edit")
    checkMiddleware(middleware, result, done, checkRedirectedElsewhere)
  })

  it('custom permission check - permitted', function(done) {
    var result = {}
    var middleware = authorizer.isPermitted(function (req, res, claim) {
      return claim.isPermitted("identity:edit") || claim.isPermitted("identity:view")
    })
    checkMiddleware(middleware, result, done, checkPermitted)
  })

  it('custom permission check - denied', function(done) {
    var result = {}
    var middleware = authorizer.isPermitted(function (req, res, claim) {
      return claim.isPermitted("identity:edit") && claim.isPermitted("identity:view")
    })
    checkMiddleware(middleware, result, done, checkDenied)
  })

  it('denied handler', function(done) {
    var result = {}
    var middleware = authorizer.onDenied(function (req, res, next) {
      result.onDeniedCalled = true
      res.redirect('/elsewhere')
    }).isPermitted("identity:edit")
    checkMiddleware(middleware, result, done, function() {
      assert.equal(result.onDeniedCalled, true)
      checkRedirectedElsewhere(result)
    })
  })

  it('custom withPermissions string', function(done) {
    var result = {}
    var middleware = authorizer.withPermissions("identity:*").isPermitted([ "identity:edit" ])
    checkMiddleware(middleware, result, done, function() {
      checkPermitted(result)
    })
  })

  it('custom withPermissions arguments', function(done) {
    var result = {}
    var middleware = authorizer.withPermissions('identity:*', 'system:reboot').isPermitted([ "identity:edit", "system:reboot" ])
    checkMiddleware(middleware, result, done, function() {
      checkPermitted(result)
    })
  })

  it('custom withPermissions array', function(done) {
    var result = {}
    var middleware = authorizer.withPermissions([ "identity:*" ]).isPermitted("identity:edit")
    checkMiddleware(middleware, result, done, function() {
      checkPermitted(result)
    })
  })

  it('custom withPermissions function', function(done) {
    var result = {}
    var middleware = authorizer.withPermissions(function (req, res) {
      result.withPermissionsCalled = true
      return [ "identity:*" ]
    }).isPermitted("identity:edit")
    checkMiddleware(middleware, result, done, function() {
      assert.equal(result.withPermissionsCalled, true)
      checkPermitted(result)
    })
  })

  it('custom withPermissions asynchronous function', function(done) {
    var result = {}
    var middleware = authorizer.withPermissions(function (req, res, mDone) {
      result.withPermissionsCalled = true
      mDone([ "identity:*" ])
    }).isPermitted("identity:edit")
    checkMiddleware(middleware, result, done, function() {
      assert.equal(result.withPermissionsCalled, true)
      checkPermitted(result)
    })
  })

  it('custom withSubject object', function(done) {
    var result = {}
    var usr = {
      username    : "administrator",
      permissions : "*:*"
    }
    var middleware = authorizer.withSubject(usr).isPermitted("identity:edit")
    checkMiddleware(middleware, result, done, function() {
      checkPermitted(result)
    })
  })

  it('custom withSubject function', function(done) {
    var result = {}
    var middleware = authorizer.withSubject(function (req, res) {
      result.withPermissionsCalled = true
      var usr = {
        username    : "administrator",
        permissions : "*:*"
      }
      return usr
    }).isPermitted("identity:edit")
    checkMiddleware(middleware, result, done, function() {
      assert.equal(result.withPermissionsCalled, true)
      checkPermitted(result)
    })
  })

  it('custom withSubject asynchronous function', function(done) {
    var result = {}
    var middleware = authorizer.withSubject(function (req, res, mDone) {
      result.withPermissionsCalled = true
      var usr = {
        username    : "administrator",
        permissions : "*:*"
      }
      mDone(usr)
    }).isPermitted("identity:edit")
    checkMiddleware(middleware, result, done, function() {
      assert.equal(result.withPermissionsCalled, true)
      checkPermitted(result)
    })
  })

  it('permitted new Authorizer', function(done) {
    var result = {}
    var ensureRequest = new authorizer.Authorizer()
    var middleware = ensureRequest.isPermitted("identity:view")
    checkMiddleware(middleware, result, done, checkPermitted)
  })

  it('custom options', function(done) {
    var result = {}
    // Global default options can be set on authorizer.options
    var newAuthorizer = new authorizer.Authorizer()
    newAuthorizer.options.onDenied = function(req, res, next) {
      res.redirect('/elsewhere')
    }
    var middleware = newAuthorizer.isPermitted("identity:edit")
    checkMiddleware(middleware, result, done, checkRedirectedElsewhere)
  })
})
