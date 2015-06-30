'use strict'

var consider = require('./consider')

function Authorizer(options) {
  options = options || {}
  this.options = {
    subject     : options.subject,
    permissions : options.permissions,
    onDenied    : options.onDenied
  }
}

// Chaining functions
Authorizer.prototype.withSubject = function(subject) {
  var link = new Authorizer(this.options)
  link.options.subject = subject
  return link
}

Authorizer.prototype.withPermissions = function(permissions) {
  var link = new Authorizer(this.options)
  link.options.permissions = permissions
  return link
}

Authorizer.prototype.onDenied = function(deny) {
  var link = new Authorizer(this.options)
  link.options.onDenied = deny
  return link
}

Authorizer.prototype.isPermitted = function(/* permission ... or [permission, ...] or permission check function */) {
  // Get arguments as an array
  var requiredPermissions = arguments
  var options = this.options
  var onDenied = this.options.onDenied || onDeniedDefault

  return function(req, res, next) {
    var claim = options.subject ? consider.considerSubject(options.subject)
      : options.permissions ? consider.considerPermissions(options.permissions)
      : consider.considerPermissions(defaultPermissions(req, res))
    if (claim && claim.isPermitted.apply(claim, requiredPermissions)) return next()

    onDenied(req, res, next)
  }

  function onDeniedDefault(req, res, next) {
    res.status(403)
    next('Permission denied')
  }

  function defaultPermissions(req, res) {
    if (req.user && req.user.permissions) return req.user.permissions
    if (req.session && req.session.user && req.session.user.permissions) return req.session.user.permissions
    if (req.permissions) return req.permissions
    return []
  }
}

var authorizer = exports = module.exports = new Authorizer()
authorizer.Authorizer = Authorizer
