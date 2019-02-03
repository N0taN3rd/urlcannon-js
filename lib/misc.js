const bigInt = require('big-integer')
const { IPv4 } = require('ip-num')

/**
 * @type {{ftp: string, file: null, wss: string, http: string, https: string, ws: string, gopher: string}}
 */
exports.SpecialSchemes = {
  ftp: '21',
  gopher: '70',
  http: '80',
  https: '443',
  ws: '80',
  wss: '443',
  file: null
}

exports.numberToIp = function (numOrIp) {
  if (numOrIp instanceof IPv4) return numOrIp
  return IPv4.fromBigInteger(bigInt(numOrIp))
}
