const { range, SliceArray, SliceString } = require('slice')
const { Parser, ParsedUrl } = require('./parse')
const {
  TabAndNewlineRegex,
  SpecialPathSegmentsRegex,
  NonspecialPathSeparatorsRegex,
  NonspecialPathSegmentsRegex,
  SpecialPathSeparatorsRegex,
  PathDotsRegex
} = require('./regexs')
const { SpecialSchemes } = require('./misc')

class CanonHelper {
  /**
   *
   * @param {ParsedUrl} url
   */
  static removeLeadingTrailingJunk (url) {
    url.leadingJunk = ''
    url.trailingJunk = ''
  }

  /**
   *
   * @param {ParsedUrl} url
   */
  static removeTabsAndNewlines (url) {
    url.leadingJunk = url.leadingJunk.replace(TabAndNewlineRegex, '')
    url.scheme = url.scheme.replace(TabAndNewlineRegex, '')
    url.colonAfterScheme = url.colonAfterScheme.replace(TabAndNewlineRegex, '')
    url.slashes = url.slashes.replace(TabAndNewlineRegex, '')
    url.username = url.username.replace(TabAndNewlineRegex, '')
    url.colonBeforePassword = url.colonBeforePassword.replace(
      TabAndNewlineRegex,
      ''
    )
    url.password = url.password.replace(TabAndNewlineRegex, '')
    url.atSign = url.atSign.replace(TabAndNewlineRegex, '')
    url.host = url.host.replace(TabAndNewlineRegex, '')
    url.colonBeforePort = url.colonBeforePort.replace(TabAndNewlineRegex, '')
    url.port = url.port.replace(TabAndNewlineRegex, '')
    url.path = url.path.replace(TabAndNewlineRegex, '')
    url.questionMark = url.questionMark.replace(TabAndNewlineRegex, '')
    url.query = url.query.replace(TabAndNewlineRegex, '')
    url.hashSign = url.hashSign.replace(TabAndNewlineRegex, '')
    url.fragment = url.fragment.replace(TabAndNewlineRegex, '')
    url.trailingJunk = url.trailingJunk.replace(TabAndNewlineRegex, '')
  }

  /**
   *
   * @param {ParsedUrl} url
   */
  static lowercaseScheme (url) {
    url.scheme = url.scheme.toLowerCase()
  }

  /**
   *
   * @param {ParsedUrl} url
   */
  static fixBackSlashes (url) {
    if (url.scheme in SpecialSchemes) {
      url.slashes = ''.padStart(url.slashes.length, '/')
      url.path = url.path.replace('\\', '/')
    }
  }

  static resolvePathDots (path, special = false) {
    if (path == null) return path
    const pathSeparatorsRe = special
      ? SpecialPathSeparatorsRegex
      : NonspecialPathSeparatorsRegex
    const pathSegmentsRe = special
      ? SpecialPathSegmentsRegex
      : NonspecialPathSegmentsRegex
    if (path.startsWith('/') || (special && path.startsWith('\\'))) {
      const sepBytes = path.replace(pathSeparatorsRe, '')
      const separators = []
      for (let i = 0; i < sepBytes.length; ++i) {
        separators.push(sepBytes.substring(i, i + 1))
      }
      const segments = SliceArray.from(path.split(pathSegmentsRe))[[1,,]]
      const op = SliceArray(separators.length + segments.length)
      op[[, , 2]] = SliceArray.from(separators)
      op[[1, , 2]] = SliceArray.from(path.split(pathSegmentsRe))[[1,,]]
      const newPath = []
      let i = 0
      while (i < op.length) {
        let m = op[i].match(PathDotsRegex)
        // console.log(m)
        if (m != null) {
          if (m.groups.two) {
            if (newPath.length > 1) {
              newPath.pop()
            }
            if (newPath.length > 1) {
              newPath.pop()
            }
          }
          i += 1
        } else {
          newPath.push(op[i])
        }
        i += 1
      }
      return newPath.join('')
    }
    return path
  }
}

class Canonicalizer {
  constructor (steps) {
    this.steps = steps
  }

  canonicalize (url) {}

  ruleApplies (matchRule, url, parentURL) {}
}

module.exports = { CanonHelper, Canonicalizer }
