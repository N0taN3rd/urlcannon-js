const punnycode = require('punycode')
const idnaUTS46 = require('./idnaUts46')
const { ParsedUrl, parseIpV4Or6, parsePathish, parseURL } = require('./parse')
const regexes = require('./regexs')
const { SpecialSchemes, numberToIp } = require('./misc')

/**
 *
 * @param {ParsedUrl} url
 */
function removeLeadingTrailingJunk (url) {
  url.leadingJunk = ''
  url.trailingJunk = ''
}

/**
 *
 * @param {ParsedUrl} url
 */
function removeTabsAndNewlines (url) {
  url.leadingJunk = url.leadingJunk.replace(regexes.TabAndNewlineRegex, '')
  url.scheme = url.scheme.replace(regexes.TabAndNewlineRegex, '')
  url.colonAfterScheme = url.colonAfterScheme.replace(
    regexes.TabAndNewlineRegex,
    ''
  )
  url.slashes = url.slashes.replace(regexes.TabAndNewlineRegex, '')
  url.username = url.username.replace(regexes.TabAndNewlineRegex, '')
  url.colonBeforePassword = url.colonBeforePassword.replace(
    regexes.TabAndNewlineRegex,
    ''
  )
  url.password = url.password.replace(regexes.TabAndNewlineRegex, '')
  url.atSign = url.atSign.replace(regexes.TabAndNewlineRegex, '')
  url.host = url.host.replace(regexes.TabAndNewlineRegex, '')
  url.colonBeforePort = url.colonBeforePort.replace(
    regexes.TabAndNewlineRegex,
    ''
  )
  url.port = url.port.replace(regexes.TabAndNewlineRegex, '')
  url.path = url.path.replace(regexes.TabAndNewlineRegex, '')
  url.questionMark = url.questionMark.replace(regexes.TabAndNewlineRegex, '')
  url.query = url.query.replace(regexes.TabAndNewlineRegex, '')
  url.hashSign = url.hashSign.replace(regexes.TabAndNewlineRegex, '')
  url.fragment = url.fragment.replace(regexes.TabAndNewlineRegex, '')
  url.trailingJunk = url.trailingJunk.replace(regexes.TabAndNewlineRegex, '')
}

/**
 *
 * @param {ParsedUrl} url
 */
function lowercaseScheme (url) {
  url.scheme = url.scheme.toLowerCase()
}

/**
 *
 * @param {ParsedUrl} url
 */
function fixBackSlashes (url) {
  if (url.scheme in SpecialSchemes) {
    url.slashes = ''.padStart(url.slashes.length, '/')
    url.path = url.path.replace(regexes.SlashesFixer, '/')
  }
}

/**
 *
 * @param {string} path
 * @param {boolean} [special = false]
 * @return {?string}
 */
function resolvePathDots (path, special = false) {
  if (path == null) return path
  const pathSeparatorsRe = special
    ? regexes.SpecialPathSeparatorsRegex
    : regexes.NonspecialPathSeparatorsRegex
  const pathSegmentsRe = special
    ? regexes.SpecialPathSegmentsRegex
    : regexes.NonspecialPathSegmentsRegex
  if (path.startsWith('/') || (special && path.startsWith('\\'))) {
    const sepBytes = path.replace(pathSeparatorsRe, '')
    const separators = []
    for (let i = 0; i < sepBytes.length; ++i) {
      separators.push(sepBytes.substring(i, i + 1))
    }
    const segments = path.split(pathSegmentsRe).slice(1)
    let sep = true
    // console.log(path.split(pathSegmentsRe))
    const oldPath = []
    let numOldPathItems = separators.length + segments.length
    while (numOldPathItems--) {
      oldPath.push(sep ? separators.shift() : segments.shift())
      sep = !sep
    }
    const PathDotsRegex = regexes.PathDotsRegex
    const newPath = []
    let i = 0
    while (i < oldPath.length) {
      let m = oldPath[i].match(PathDotsRegex)
      if (m != null) {
        if (m.groups.two) {
          if (newPath.length > 1) {
            newPath.pop()
          }
          if (newPath.length > 1) {
            newPath.pop()
          }
        }
        i++
      } else {
        newPath.push(oldPath[i])
      }
      i++
    }
    return newPath.join('')
  }
  return path
}

/**
 *
 * @param {ParsedUrl} url
 */
function normalizePathDots (url) {
  url.path = resolvePathDots(url.path, url.scheme in SpecialSchemes)
}

/**
 * Returns the result of replacing bytes in `bs` that match `encode_re`
 * with percent-encoded versions.
 * @param string
 * @param encodeRe
 */
function pctEncode (string, encodeRe) {
  return string.replace(encodeRe, pctEncodeReplacer)
}

function pctEncodeReplacer (match, p1, p2, p3, offset, string) {
  return `%${match.charCodeAt(0)}`
}

/**
 *
 * @param {ParsedUrl} url
 */
function pctEncodePath (url) {
  const encodeRe =
    url.path.startsWith('/') || url.scheme in SpecialSchemes
      ? regexes.PathEncodeRe
      : regexes.C0EncodeRe
  url.path = pctEncode(url.path, encodeRe)
}

/**
 *
 * @param {ParsedUrl} url
 */
function pctEncodeUserinfo (url) {
  url.username = pctEncode(url.username, regexes.UserInfoEncodeRe)
  url.password = pctEncode(url.password, regexes.UserInfoEncodeRe)
}

/**
 *
 * @param {ParsedUrl} url
 */
function pctEncodeFragment (url) {
  url.fragment = pctEncode(url.fragment, regexes.C0EncodeRe)
}

/**
 *
 * @param {ParsedUrl} url
 */
function pctEncodeHost (url) {
  url.host = pctEncode(url.host, regexes.HostEncodeRe)
}

/**
 *
 * @param {ParsedUrl} url
 */
function emptyPathToSlash (url) {
  if (!url.path && url.authority && url.scheme in SpecialSchemes) {
    url.path = '/'
  }
}

function dottedDecimal (numOrIp) {
  if (numOrIp == null) {
    return null
  }
  return numberToIp(numOrIp).toString()
}

/**
 *
 * @param {ParsedUrl} url
 */
function normalizeIpAddress (url) {
  if (url.ip4 != null) {
    url.host = dottedDecimal(url.ip4)
  } else if (url.ip6 != null) {
    url.host = `[${url.ip6.toString()}]`
  }
}

/**
 *
 * @param {ParsedUrl} url
 */
function elideDefaultPort (url) {
  if (url.scheme in SpecialSchemes && url.port === SpecialSchemes[url.scheme]) {
    url.colonBeforePort = ''
  } else {
    url.port = ''
  }
}

/**
 *
 * @param {ParsedUrl} url
 */
function cleanUpUserInfo (url) {
  if (!url.password) {
    url.colonBeforePassword = ''
    if (!url.username) {
      url.atSign = ''
    }
  }
}
/**
 *
 * @param {ParsedUrl} url
 */
function twoSlashes (url) {
  if (url.slashes || url.authority || url.scheme === 'file') {
    url.slashes = '//'
  }
}
/**
 *
 * @param {ParsedUrl} url
 */
function punycodeSpecialHost (url) {
  if (url.host && url.scheme && url.scheme in SpecialSchemes) {
    try {
      url.host = punnycode.encode(url.host)
    } catch (e) {
      try {
        url.host = idnaUTS46.toAscii(url.host)
      } catch (e) {}
    }
  }
}
/**
 *
 * @param {ParsedUrl} url
 */
function leadingSlash (url) {
  if (url.scheme in SpecialSchemes && !url.path.startsWith('/')) {
    url.path = `/${url.path}`
  }
}

/**
 *
 * @param {ParsedUrl} url
 */
function removeFragment (url) {
  url.hashSign = ''
  url.fragment = ''
}

/**
 *
 * @param {ParsedUrl} url
 */
function removeUserinfo (url) {
  url.username = ''
  url.colonBeforePassword = ''
  url.password = ''
  url.atSign = ''
}

function pctDecodeTokenRepeatedly (orig) {
  if (orig == null) return orig
  let val = orig
  let newVal
  while (val) {
    newVal = unescape(val)
    if (newVal === val) return val
    val = newVal
  }
}

/**
 *
 * @param {ParsedUrl} url
 * @param skipQuery
 */
function pctDecodeRepeatedly (url, skipQuery = false) {
  url.scheme = pctDecodeTokenRepeatedly(url.scheme)
  url.username = pctDecodeTokenRepeatedly(url.username)
  url.password = pctDecodeTokenRepeatedly(url.password)
  url.host = pctDecodeTokenRepeatedly(url.host)
  url.path = pctDecodeTokenRepeatedly(url.path)
  if (!skipQuery) {
    url.query = pctDecodeTokenRepeatedly(url.query)
  }
  url.fragment = pctDecodeTokenRepeatedly(url.fragment)
}

/**
 *
 * @param {ParsedUrl} url
 */
function pctDecodeRepeatedlyExceptQuery (url) {
  pctDecodeRepeatedly(url, true)
}

/**
 *
 * @param {ParsedUrl} url
 * @param encode_re
 */
function pctEncodeQuery (url, encode_re = regexes.QueryEncodeRe) {
  if (!url.query) return
  let origParts = url.query.split('&')
  const cannonParts = []
  const queryLength = origParts.length
  let queryIndex = 0
  let originalKeyValue
  let newKeyValue
  let eqSplitLength
  let eqSplitTokenIndex
  for (; queryIndex < queryLength; ++queryIndex) {
    // in python split(sep, number) is lines where ''.split(sep, 1) gives an array of 2
    // thus we must supply 2 to JS split(sep, limit) where limit is number of entries
    // in the returned array
    originalKeyValue = origParts[queryIndex].split('=', 2)
    newKeyValue = []
    eqSplitLength = originalKeyValue.length
    for (
      eqSplitTokenIndex = 0;
      eqSplitTokenIndex < eqSplitLength;
      ++eqSplitTokenIndex
    ) {
      newKeyValue.push(
        pctEncode(originalKeyValue[eqSplitTokenIndex], encode_re)
      )
    }
    cannonParts.push(newKeyValue.join('='))
  }
  url.query = cannonParts.join('&')
}

/**
 *
 * @param {ParsedUrl} url
 */
function googlePctEncode (url) {
  url.scheme = pctEncode(url.scheme, regexes.GooglePctEncodeRe)
  url.username = pctEncode(url.username, regexes.GooglePctEncodeRe)
  url.password = pctEncode(url.password, regexes.GooglePctEncodeRe)
  url.host = pctEncode(url.host, regexes.GooglePctEncodeRe)
  url.port = pctEncode(url.port, regexes.GooglePctEncodeRe)
  url.path = pctEncode(url.path, regexes.GooglePctEncodeRe)
  pctEncodeQuery(url, regexes.GooglePctEncodeRe)
  url.fragment = pctEncode(url.fragment, regexes.GooglePctEncodeRe)
}

/**
 *
 * @param {ParsedUrl} url
 */
function lessDumbPctEncode (url) {
  url.scheme = pctEncode(url.scheme, regexes.GooglePctEncodeRe)
  url.username = pctEncode(url.username, regexes.LessDumbUserInfoEncodeRe)
  url.password = pctEncode(url.password, regexes.LessDumbUserInfoEncodeRe)
  url.host = pctEncode(url.host, regexes.GooglePctEncodeRe)
  url.port = pctEncode(url.port, regexes.GooglePctEncodeRe)
  url.path = pctEncode(url.path, regexes.LessDumbPathEncodeRe)
  url.fragment = pctEncode(url.fragment, regexes.GooglePctEncodeRe)
}

/**
 *
 * @param {ParsedUrl} url
 */
function lessDumbPctRecodeQuery (url) {
  if (!url.query) return
  let origParts = url.query.split('&')
  const cannonParts = []
  const queryLength = origParts.length
  let queryIndex = 0
  let originalKeyValue
  let newKeyValue
  let eqSplitLength
  let eqSplitTokenIndex
  for (; queryIndex < queryLength; ++queryIndex) {
    // in python split(sep, number) is lines where ''.split(sep, 1) gives an array of 2
    // thus we must supply 2 to JS split(sep, limit) where limit is number of entries
    // in the returned array
    originalKeyValue = origParts[queryIndex].split('=', 2)
    newKeyValue = []
    eqSplitLength = originalKeyValue.length
    for (
      eqSplitTokenIndex = 0;
      eqSplitTokenIndex < eqSplitLength;
      ++eqSplitTokenIndex
    ) {
      newKeyValue.push(
        pctEncode(
          pctDecodeTokenRepeatedly(originalKeyValue[eqSplitTokenIndex]),
          regexes.LessDumbQueryEncodeRe
        )
      )
    }
    cannonParts.push(newKeyValue.join('='))
  }
  url.query = cannonParts.join('&')
}

/**
 *
 * @param {ParsedUrl} url
 */
function reparseHost (url) {
  const newIp = parseIpV4Or6(url.host)
  url.ip6 = newIp.v6
  url.ip4 = newIp.v4
}

/**
 *
 * @param {ParsedUrl} url
 */
function defaultSchemeHttp (url) {
  if (!url.scheme) {
    url.scheme = 'http'
    url.colonAfterScheme = ':'
    if (url.path) {
      parsePathish(url, url.path)
    }
  }
}

const collapseConsecutiveSlashesRe = /\/\/+/

/**
 *
 * @param {ParsedUrl} url
 */
function collapseConsecutiveSlashes (url) {
  if (url.scheme in SpecialSchemes) {
    url.path = url.path.replace(collapseConsecutiveSlashesRe, '/')
  }
}

const fixHostDotsRegexs = {
  s1: /^\.+/,
  s2: /\.+$/,
  s3: /\.{2,}/
}

/**
 *
 * @param {ParsedUrl} url
 */
function fixHostDots (url) {
  if (url.host) {
    url.host = url.host
      .replace(fixHostDotsRegexs.s1, '')
      .replace(fixHostDotsRegexs.s2, '')
      .replace(fixHostDotsRegexs.s3, '.')
  }
}

/**
 *
 * @param {ParsedUrl} url
 */
function pctDecodeHost (url) {
  if (url.host && url.scheme in SpecialSchemes) {
    url.host = unescape(url.host)
  }
}

/**
 * @param {string} s1
 * @param {string} s2
 * @return {number}
 */
const alphaReorderComparator = (s1, s2) => s1.localeCompare(s2)

/**
 *
 * @param {ParsedUrl} url
 */
function alphaReorderQuery (url) {
  if (url.query) {
    url.query = url.query
      .split('&')
      .sort(alphaReorderComparator)
      .join('&')
  }
}

/**
 *
 * @param {ParsedUrl} url
 */
function httpsToHttp (url) {
  if (url.scheme === 'https') {
    url.scheme = 'http'
  }
}

/**
 *
 * @param {ParsedUrl} url
 */
function stripWWW (url) {
  const m = url.host.match(regexes.WWWRe)
  if (m) {
    url.host = url.host.substring(m[0].length)
  }
}

/**
 *
 * @param {ParsedUrl} url
 */
function lowercasePath (url) {
  url.path = url.path.toLowerCase()
}

/**
 *
 * @param {ParsedUrl} url
 */
function lowercaseQuery (url) {
  url.query = url.query.toLowerCase()
}

/**
 *
 * @param {ParsedUrl} url
 */
function stripSessionIdsFromQuery (url) {
  url.query = url.query.replace(regexes.QuerySessionIdRe, '$1$2')
}

/**
 *
 * @param {ParsedUrl} url
 */
function stripSessionIdsFromPath (url) {
  if (url.path.match(regexes.AspxSuffixRe)) {
    url.path = url.path.replace(regexes.AspxSuffixRe, '')
  }
  url.path = url.path.replace(regexes.PathSessionIdRe, '')
}

/**
 *
 * @param {ParsedUrl} url
 */
function removeRedundantAmpersandsFromQuery (url) {
  url.query = url.query.replace(regexes.RedundantAmpersandRe, '')
}

/**
 *
 * @param {ParsedUrl} url
 */
function omitQuestionMarkIfQueryEmpty (url) {
  if (!url.query) {
    url.questionMark = ''
  }
}

/**
 *
 * @param {ParsedUrl} url
 */
function stripTrailingSlashUnlessEmpty (url) {
  if (url.path !== '/' && url.path.endsWith('/')) {
    url.path = url.path.substring(0, url.path.length - 1)
  }
}

/**
 *
 * @param {string} host
 * @return {string}
 */
function normalizeHost (host) {
  const url = new ParsedUrl()
  url.scheme = 'http'
  url.host = host
  url.host = pctDecodeTokenRepeatedly(url.host)
  reparseHost(url)
  normalizeIpAddress(url)
  fixHostDots(url)
  punycodeSpecialHost(url)
  url.host = pctEncode(url.host, regexes.GooglePctEncodeRe)
  return url.host
}

class Canonicalizer {
  /**
   *
   * @param {Array<function(url: ParsedUrl)>} steps
   */
  constructor (steps) {
    /**
     * @type {Array<function(url: ParsedUrl)>}
     */
    this.steps = steps
  }

  /**
   *
   * @param {string|ParsedUrl} url
   * @return {ParsedUrl}
   */
  canonicalize (url) {
    if (!(url instanceof ParsedUrl)) {
      return this.canonicalize(parseURL(url))
    }
    const numSteps = this.steps.length
    let stepIndex = 0
    for (; stepIndex < numSteps; ++stepIndex) {
      this.steps[stepIndex](url)
    }
    return url
  }

  ruleApplies (matchRule, url, parentURL) {
    return matchRule.applies(this.canonicalize(url))
  }
}

/**
 * @type {Canonicalizer}
 */
const whatwg = new Canonicalizer([
  removeLeadingTrailingJunk,
  removeTabsAndNewlines,
  lowercaseScheme,
  elideDefaultPort,
  cleanUpUserInfo,
  twoSlashes,
  pctDecodeHost,
  reparseHost,
  normalizeIpAddress,
  punycodeSpecialHost,
  pctEncodeHost,
  fixBackSlashes,
  pctEncodePath,
  leadingSlash,
  normalizePathDots,
  emptyPathToSlash,
  pctEncodeUserinfo,
  pctEncodeQuery,
  pctEncodeFragment
])

/**
 * @type {Canonicalizer}
 */
const google = Canonicalizer([
  removeLeadingTrailingJunk,
  defaultSchemeHttp,
  removeTabsAndNewlines,
  lowercaseScheme,
  fixBackSlashes,
  pctEncodePath,
  emptyPathToSlash,
  elideDefaultPort,
  cleanUpUserInfo,
  leadingSlash,
  twoSlashes,
  removeFragment,
  pctDecodeRepeatedly,
  normalizePathDots,
  fixHostDots,
  collapseConsecutiveSlashes,
  punycodeSpecialHost,
  reparseHost,
  normalizeIpAddress,
  googlePctEncode
])

/**
 * @type {Canonicalizer}
 */
const semanticPrecise = Canonicalizer([
  removeLeadingTrailingJunk,
  defaultSchemeHttp,
  removeTabsAndNewlines,
  lowercaseScheme,
  elideDefaultPort,
  cleanUpUserInfo,
  twoSlashes,
  pctDecodeRepeatedlyExceptQuery,
  reparseHost,
  normalizeIpAddress,
  fixHostDots,
  punycodeSpecialHost,
  removeUserinfo,
  lessDumbPctEncode,
  lessDumbPctRecodeQuery,
  fixBackSlashes,
  leadingSlash,
  normalizePathDots,
  collapseConsecutiveSlashes,
  emptyPathToSlash,
  alphaReorderQuery
])

/**
 * @type {Canonicalizer}
 */
const semantic = Canonicalizer(semanticPrecise.steps.concat([removeFragment]))

/**
 * @type {Canonicalizer}
 */
const aggressive = Canonicalizer(
  semantic.steps.concat([
    httpsToHttp,
    stripWWW,
    lowercasePath,
    lowercaseQuery,
    stripSessionIdsFromQuery,
    stripSessionIdsFromPath,
    stripTrailingSlashUnlessEmpty,
    removeRedundantAmpersandsFromQuery,
    omitQuestionMarkIfQueryEmpty,
    alphaReorderQuery // sort again after lowercasing
  ])
)

module.exports = {
  aggressive,
  semantic,
  semanticPrecise,
  google,
  whatwg,
  cleanUpUserInfo,
  twoSlashes,
  Canonicalizer,
  removeLeadingTrailingJunk,
  elideDefaultPort,
  normalizeIpAddress,
  emptyPathToSlash,
  pctEncodeHost,
  pctEncodePath,
  removeTabsAndNewlines,
  resolvePathDots,
  normalizePathDots,
  pctEncodeUserinfo,
  pctEncodeFragment,
  lowercaseScheme,
  fixBackSlashes,
  punycodeSpecialHost,
  leadingSlash,
  removeFragment,
  removeUserinfo,
  pctDecodeTokenRepeatedly,
  pctDecodeRepeatedly,
  pctDecodeRepeatedlyExceptQuery,
  pctEncodeQuery,
  googlePctEncode,
  lessDumbPctEncode,
  lessDumbPctRecodeQuery,
  reparseHost,
  defaultSchemeHttp,
  collapseConsecutiveSlashes,
  fixHostDots,
  pctDecodeHost,
  alphaReorderQuery,
  httpsToHttp,
  stripWWW,
  lowercasePath,
  lowercaseQuery,
  stripSessionIdsFromQuery,
  stripSessionIdsFromPath,
  removeRedundantAmpersandsFromQuery,
  omitQuestionMarkIfQueryEmpty,
  stripTrailingSlashUnlessEmpty,
  normalizeHost
}
