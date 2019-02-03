const Path = require('path')
const Module = require('module')
const _require = Module.prototype.require
Module.prototype.require = function (id) {
  if (id === './idna-map') {
    return _require.call(this, Path.join(__dirname, 'idna12-map.js'))
  }
  return _require.apply(this, arguments)
}

/**
 * @typedef {Object} IDNAUts46
 * @property {function(domain: string): string} toAscii
 */

/**
 * @type {IDNAUts46}
 */
module.exports = require('idna-uts46-hx')
Module.prototype.require = _require
