'use strict'

var consider = require('./consider')

function Authorizer(options) {
  options = options || {}
  this.options = {
    withSubject     : options.withSubject,
    withPermissions : options.withPermissions,
    onDenied        : options.onDenied
  }
}

// Chaining functions
Authorizer.prototype.withSubject = function(withSubject) {
  var link = new Authorizer(this.options)
  link.options.withSubject = withSubject
  return link
}

Authorizer.prototype.withPermissions = function() {
  var withPermissions = arguments.length === 1 ? arguments[0]
    : Array.prototype.slice.call(arguments)
  var link = new Authorizer(this.options)
  link.options.withPermissions = withPermissions
  return link
}

Authorizer.prototype.onDenied = function(deny) {
  var link = new Authorizer(this.options)
  link.options.onDenied = deny
  return link
}

Authorizer.prototype.Authorizer = Authorizer

Authorizer.prototype.isPermitted = function(/* permission ... or [permission, ...] or permission check function */) {
  var isPermittedCheck
  if (arguments.length === 1 && typeof arguments[0] === 'function') {
    isPermittedCheck = arguments[0]
  } else {
    // Get arguments as an array
    var requiredPermissions = arguments
    isPermittedCheck = function(req, res, claim) {
      return claim.isPermitted.apply(claim, requiredPermissions)
    }
  }
  var options = this.options
  var onDenied = options.onDenied || onDeniedDefault

  var considerFunction = options.withSubject ? consider.considerSubject : consider.considerPermissions
  var withFunctionCandidate = options.withSubject ? options.withSubject : options.withPermissions || withPermissionsDefault
  var withFunction = withFunctionCandidate

  if (typeof withFunction !== 'function') {
    if (typeof withFunction === 'string') withFunctionCandidate = withFunctionCandidate.split('|')
    // withSubject/withPermissions is an object/array
    withFunction = function(req, res, done) {
      done(withFunctionCandidate)
    }
  } else if (withFunction.length !== 3) {
    // Convert synchronous with function to asynchronous
    withFunction = function(req, res, done) {
      done(withFunctionCandidate(req, res))
    }
  }

  return function(req, res, next) {
    withFunction(req, res, function(permissionsOrSubject) {
      if (isPermittedCheck(req, res, considerFunction(permissionsOrSubject))) {
        return next()
      }

      onDenied(req, res, next)
    })
  }

  function onDeniedDefault(req, res, next) {
    res.status(403)
    next('Permission denied')
  }

  function withPermissionsDefault(req, res) {
    if (req.user && req.user.permissions) return req.user.permissions
    if (req.session && req.session.user && req.session.user.permissions) return req.session.user.permissions
    if (req.permissions) return req.permissions
    return []
  }
}

module.exports = exports = new Authorizer()
