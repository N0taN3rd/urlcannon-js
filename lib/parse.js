const bigInt = require('big-integer')
const { IPv4, IPv6 } = require('ip-num')
const {
  AuthorityRE,
  FilePathishRe,
  LeadingJunkRE,
  NonSpecialPathishRe,
  SpecialPathishRe,
  TrailingJunkRe,
  URLRe,
  TabAndNewlineRegex
} = require('./regexs')
const { SpecialSchemes } = require('./misc')

const zeroXs = ['0x', '0X']

const twoTo8 = bigInt[2].pow(8)
const twoTo16 = bigInt[2].pow(16)
const twoTo24 = bigInt[2].pow(24)
const twoTo32 = bigInt[2].pow(32)

class ParsedUrl {
  constructor () {
    this.leadingJunk = ''
    this.trailingJunk = ''
    this.scheme = ''
    this.colonAfterScheme = ''
    this.questionMark = ''
    this.query = ''
    this.hashSign = ''
    this.fragment = ''
    this.slashes = ''
    this.username = ''
    this.colonBeforePassword = ''
    this.password = ''
    this.atSign = ''
    /**
     *
     * @type {?IPv6}
     */
    this.ip6 = null
    /**
     *
     * @type {?IPv4}
     */
    this.ip4 = null
    this.host = ''
    this.colonBeforePort = ''
    this.port = ''
    this.path = ''
  }


  get hostPort () {
    return this.host + this.colonBeforePort + this.port
  }

  get userinfo () {
    return this.username + this.colonBeforePassword + this.password
  }

  get authority () {
    return this.userinfo + this.atSign + this.hostPort
  }

  ssurt () {}

  surt ({ trailingComma, withScheme }) {}

  toString () {
    return (
      this.leadingJunk +
      this.scheme +
      this.colonAfterScheme +
      this.slashes +
      this.authority +
      this.path +
      this.questionMark +
      this.query +
      this.hashSign +
      this.fragment +
      this.trailingJunk
    )
  }
}

/**
 *
 * @param {ParsedUrl} url
 * @param {string} pathish
 * @return {ParsedUrl}
 */
function parsePathish (url, pathish) {
  const cleanScheme = url.scheme.replace(TabAndNewlineRegex, '').toLowerCase()
  if (cleanScheme === 'file') {
    let m = FilePathishRe.exec(pathish)
    if (m != null) {
      url.slashes = m.groups.slashes || ''
      url.host = m.groups.host || ''
      url.path = m.groups.path || ''
    } else {
      url.path = pathish
    }
  } else {
    let m
    if (cleanScheme in SpecialSchemes) {
      m = SpecialPathishRe.exec(pathish)
    } else {
      m = NonSpecialPathishRe.exec(pathish)
    }

    if (m != null) {
      url.slashes = m.groups.slashes || ''
      url.path = m.groups.path || ''
      let authority = m.groups.authority
      let am = AuthorityRE.exec(authority)
      url.username = am.groups.username || ''
      url.colonBeforePassword = am.groups.colonBeforePassword || ''
      url.password = am.groups.password || ''
      url.atSign = am.groups.atSign || ''
      url.host = am.groups.host || ''
      const { v4, v6 } = parseIpV4Or6(url.host)
      url.ip4 = v4
      url.ip6 = v6
      // url.ip4, (url.ip6 = parseIpV4Or6(url.host))
      url.colonBeforePort = am.groups.colonBeforePort || ''
      url.port = am.groups.port || ''
    } else {
      // no authority
      url.path = pathish
    }
  }
  return url
}

/**
 * @param ipString
 * @return {{v6: ?IPv6, v4: ?IPv4}}
 */
function parseIpV4Or6 (ipString) {
  const results = { v4: null, v6: null }
  if (!ipString) return results
  try {
    if (ipString.startsWith('[') && ipString.endsWith(']')) {
      results.v6 = new IPv6(ipString.substring(1, ipString.length - 1))
    } else {
      results.v4 = parseIPV4(ipString)
    }
  } catch (e) {}
  return results
}

/**
 *
 * @param {string} ipString
 * @return {?IPv4}
 */
function parseIPV4 (ipString) {
  const split = ipString.split('.')
  if (split[split.length - 1] === '') {
    split.pop()
  }
  let ip
  try {
    switch (split.length) {
      case 1:
        ip = numStrToBigInt(split[0])
        break
      case 2:
        ip = _handleIpSplit2(split)
        break
      case 3:
        ip = _handleIpSplit3(split)
        break
      case 4:
        ip = _handleIpSplit4(split)
        break
    }
  } catch (e) {
    return null
  }
  if (ip == null) return ip
  if (ip.greaterOrEquals(twoTo32)) return null
  if (ip.equals(bigInt.zero)) return new IPv4('0.0.0.0')
  return IPv4.fromBigInteger(ip)
}

/**
 *
 * @param {string} numStr
 * @return {bigInt.BigInteger}
 */
function numStrToBigInt (numStr) {
  const length = numStr.length
  if (length >= 2 && zeroXs.includes(numStr.substring(0, 2))) {
    if (length >= 3) return bigInt(numStr.substring(2), 16)
    return bigInt.zero
  } else if (length >= 2 && numStr[0] === '0') {
    return bigInt(numStr, 8)
  }
  if (length === 0) return bigInt.zero
  return bigInt(numStr)
}

/**
 *
 * @param splitArray
 * @return {?bigInt.BigInteger}
 * @private
 */
function _handleIpSplit2 (splitArray) {
  let last = numStrToBigInt(splitArray[1])
  if (last.greaterOrEquals(twoTo24)) return null
  return numStrToBigInt(splitArray[0])
    .times(twoTo24)
    .add(last)
}

/**
 *
 * @param splitArray
 * @return {?bigInt.BigInteger}
 * @private
 */
function _handleIpSplit3 (splitArray) {
  let middle = numStrToBigInt(splitArray[1])
  if (middle.greaterOrEquals(twoTo8)) return null
  let last = numStrToBigInt(splitArray[2])
  if (last.greaterOrEquals(twoTo16)) return null
  return numStrToBigInt(splitArray[0])
    .times(twoTo24)
    .add(middle.times(twoTo16))
    .add(last)
}

/**
 *
 * @param splitArray
 * @return {?bigInt.BigInteger}
 * @private
 */
function _handleIpSplit4 (splitArray) {
  const p1 = numStrToBigInt(splitArray[1])
  const p2 = numStrToBigInt(splitArray[2])
  const p3 = numStrToBigInt(splitArray[3])
  if (
    p1.greaterOrEquals(twoTo8) ||
    p2.greaterOrEquals(twoTo8) ||
    p3.greaterOrEquals(twoTo8)
  ) {
    return null
  }
  return numStrToBigInt(splitArray[0])
    .times(twoTo24)
    .add(p1.times(twoTo16))
    .add(p2.times(twoTo8))
    .add(p3)
}

/**
 *
 * @param {string} url
 * @return {ParsedUrl}
 */
function parseURL (url) {
  const parsedURL = new ParsedUrl()
  let ljr = LeadingJunkRE.exec(url)
  let tjr = TrailingJunkRe.exec(ljr.groups.rest)
  let urlr = URLRe.exec(tjr.groups.rest)
  parsedURL.leadingJunk = ljr.groups.junk
  parsedURL.trailingJunk = tjr.groups.junk
  parsedURL.scheme = urlr.groups.scheme || ''
  parsedURL.colonAfterScheme = urlr.groups.colonAfterScheme || ''
  parsedURL.questionMark = urlr.groups.questionMark || ''
  parsedURL.query = urlr.groups.query || ''
  parsedURL.hashSign = urlr.groups.hashSign || ''
  parsedURL.fragment = urlr.groups.fragment || ''
  if (urlr.groups.pathish) {
    parsePathish(parsedURL, urlr.groups.pathish)
  }
  return parsedURL
}

module.exports = { ParsedUrl, parsePathish, parseURL, parseIPV4, parseIpV4Or6 }
