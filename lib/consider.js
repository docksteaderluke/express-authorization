'use strict'

module.exports = {
  considerSubject     : considerSubject,
  considerPermissions : considerPermissions,
  coalescePermissions : coalescePermissions
}

function considerSubject(subject) {
  var permissions = []
  if (subject && subject.permissions) permissions = subject.permissions
  return considerPermissions(permissions)
}

function considerPermissions(/* permission ... or [permission, ....] */) {
  var claim = compileClaim.apply(null, arguments)
  Object.defineProperty(claim, "isPermitted", { value : isPermitted })
  return claim
}

function coalescePermissions(/* permission ... or [permission, ...] */) {
  var permissions = []
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] !== null && arguments[i] !== undefined) {
      permissions = permissions.concat(arguments[i])
    }
  }
  return permissions
}

function isPermitted(/* permission ... or [permission, ...] */) {
  var requiredPermissions = coalescePermissions.apply(null, arguments)
  if (requiredPermissions.length === 0) return false
  for (var i = 0; i < requiredPermissions.length; i++) {
    if (!this.test(requiredPermissions[i])) return false
  }

  return true
}

function compileClaim(/* permission ... or [permission, ....] */) {
  var permissions = coalescePermissions.apply(null, arguments)
  if (permissions.length === 0) return new RegExp("$false^")

  var statements = []
  for (var i = 0; i < permissions.length; i++) {
    statements.push(compilePermission(permissions[i]))
  }

  var result = statements.join("|")
  if (statements.length > 1) result = "(" + result + ")"
  return new RegExp("^" + result + "(\\:.*)*$")

  function compilePermission(permission) {
    permission = permission.replace(/(\:\*)+$/, "")
    return permission.split(":").map(function (part) {
      var list = part.split(",").map(function (subpart) {
        return compilePart(subpart)
      })
      switch (list.length) {
        case 0: return ""
        case 1: return list[0]
        default: return "(" + list.join("|") + ")"
      }
    }).join(":")
  }

  function compilePart(part) {
    var special = "\\^$*+?.()|{}[]"
    var exp = []
    for (var j = 0; j < part.length; ++j) {
      var c = part.charAt(j)
      if (c === '?') exp.push("[^:]")
      else if (c === '*') exp.push("[^:]*")
      else {
        if (special.indexOf(c) >= 0) exp.push("\\")
        exp.push(c)
      }
    }
    return exp.join("")
  }
}
