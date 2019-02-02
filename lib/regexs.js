/* eslint-disable no-control-regex, no-useless-escape */
/**
 * @type {RegExp}
 */
exports.LeadingJunkRE = /^(?<junk>[\x00-\x20]*)(?<rest>.*)$/s

/**
 * @type {RegExp}
 */
exports.TrailingJunkRe = /^(?<rest>.*?)(?<junk>[\x00-\x20]*)$/s

/**
 * @type {RegExp}
 */
exports.URLRe = /^(?:(?<scheme>[a-zA-Z][^:]*)(?<colonAfterScheme>[:]))?(?<pathish>[^?#]*)(?:(?<questionMark>[?])(?<query>[^#]*))?(?:(?<hashSign>[#])(?<fragment>.*))?$/s

/**
 * @type {RegExp}
 */
exports.SpecialPathishRe = /^(?<slashes>[/\\\r\n\t]*)(?<authority>[^/\\]*)(?<path>[/\\].*)?$/s

/**
 * @type {RegExp}
 */
exports.NonSpecialPathishRe = /^(?<slashes>[\r\n\t]*(?:\/[\r\n\t]*){2})(?<authority>[^/]*)(?<path>[/].*)?$/s

/**
 * @type {RegExp}
 */
exports.FilePathishRe = /(?<slashes>[\r\n\t]*(?:[/\\][\r\n\t]*){2})(?<host>[^/\\]*)(?<path>[/\\].*)?/

/**
 * @type {RegExp}
 */
exports.AuthorityRE = /^(?:(?<username>[^:]*)((?<colonBeforePassword>:)(?<password>.*))?(?<atSign>@))?(?<host>\[[^\]]*]|[^:]*)(?:(?<colonBeforePort>:)(?<port>.*))?$/s

/**
 * @type {RegExp}
 */
exports.TabAndNewlineRegex = /[\x09\x0a\x0d]/

/**
 * @type {RegExp}
 */
exports.SpecialPathSeparatorsRegex = /[^/\\]/g

/**
 * @type {RegExp}
 */
exports.SpecialPathSegmentsRegex = /[/\\]/g

/**
 * @type {RegExp}
 */
exports.NonspecialPathSeparatorsRegex = /[^/]/g

/**
 * @type {RegExp}
 */
exports.NonspecialPathSegmentsRegex = /[/]/g

/**
 * @type {RegExp}
 */
exports.PathDotsRegex = /^(?<one>[.]|%2e)(?<two>[.]|%2e)?$/i

/**
 * The C0 control percent-encode set are C0 controls and all code points greater than U+007E.
 * @type {RegExp}
 */
exports.C0EncodeRe = /[\x00-\x1f\x7f-\xff]/

/**
 * The path percent-encode set is the C0 control percent-encode set and
 * code points U+0020, '"', "#", "<", ">", "?", "`", "{", and "}".
 * @type {RegExp}
 */
exports.PathEncodeRe = /[\x00-\x20\x7f-\xff"#<>?`{}]/

/**
 * If byte is less than 0x21, greater than 0x7E, or is 0x22, 0x23, 0x3C,
 * or 0x3E, append byte, percent encoded, to url's query.
 * @type {RegExp}
 */
exports.QueryEncodeRe = /[\x00-\x20\x22\x23\x3c\x3e\x7f-\xff]/

/**
 * The userinfo percent-encode set is the path percent-encode set and code
 * points "/", ":", ";", "=", "@", "[", "\", "]", "^", and "|".
 * @type {RegExp}
 */
exports.UserInfoEncodeRe = /[\x00-\x20\x7f-\xff"#<>?`{}/:;=@\[\\\]^|]/

/**
 * XXX need to take a closer look at whatwg host parsing, this regex is a hack
 * to fix handling of host containing "%20"
 * @type {RegExp}
 */
exports.HostEncodeRe = /[\x00-\x20\x7f-\xff]/

/**
 * @type {RegExp}
 */
exports.GooglePctEncodeRe = /[\x00-\x20\x7f-\xff#%]/

/**
 * @type {RegExp}
 */
exports.LessDumbUserInfoEncodeRe = /[\x00-\x20\x7f-\xff#%:@]/

/**
 * @type {RegExp}
 */
exports.LessDumbPathEncodeRe = /[\x00-\x20\x7f-\xff#%?]/

/**
 * @type {RegExp}
 */
exports.LessDumbQueryEncodeRe = /[\x00-\x20\x7f-\xff#%&=]/

/**
 * @type {RegExp}
 */
exports.WWWRe = /^www\d*\.'/

/**
 * can't use the lookbehind in the java version because:
 * sre_constants.error: look-behind requires fixed-width pattern
 * @type {RegExp}
 */
exports.QuerySessionIdRe = new RegExp(
  '(&|^)(?:' +
    'jsessionid=[0-9a-z$]{10,}' +
    '|sessionid=[0-9a-z]{16,}' +
    '|phpsessid=[0-9a-z]{16,}' +
    '|sid=[0-9a-z]{16,}' +
    '|aspsessionid[a-z]{8}=[0-9a-z]{16,}' +
    '|cfid=[0-9]+&cftoken=[0-9a-z-]+' +
    ')(&|$)',
  'i'
)

/**
 * @type {RegExp}
 */
exports.AspxSuffixRe = /.*\\.aspx\\Z/

/**
 * @type {RegExp}
 */
exports.AspxPathSessionIdRe = /(?<=\/)\\([0-9a-z]{24}\\)[/]|(?<=\/)(?:\((?:[a-z]\([0-9a-z]{24}\))+\)\/)/

/**
 * @type {RegExp}
 */
exports.PathSessionIdRe = /;jsessionid=[0-9a-z]{32}$/

/**
 * @type {RegExp}
 */
exports.RedundantAmpersandRe = /^&+|&+$|(?<=&)&+/

/* eslint-enable no-control-regex, no-useless-escape */
