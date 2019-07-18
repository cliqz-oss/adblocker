/*!
 * Copyright (c) 2017-2019 Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { compactTokens } from './compact-set';
import TokensBuffer from './tokens-buffer';
/***************************************************************************
 *  Bitwise helpers
 * ************************************************************************* */
// From: https://stackoverflow.com/a/43122214/1185079
export function bitCount(n) {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}
export function getBit(n, mask) {
    return !!(n & mask);
}
export function setBit(n, mask) {
    return n | mask;
}
export function clearBit(n, mask) {
    return n & ~mask;
}
function fastHashBetween(str, begin, end) {
    var hash = 5381;
    for (var i = begin; i < end; i += 1) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
}
export function fastHash(str) {
    if (!str) {
        return 0;
    }
    return fastHashBetween(str, 0, str.length);
}
export function hashStrings(strings) {
    var result = new Uint32Array(strings.length);
    for (var i = 0; i < strings.length; i += 1) {
        result[i] = fastHash(strings[i]);
    }
    return result;
}
// https://jsperf.com/string-startswith/21
export function fastStartsWith(haystack, needle) {
    if (haystack.length < needle.length) {
        return false;
    }
    var ceil = needle.length;
    for (var i = 0; i < ceil; i += 1) {
        if (haystack[i] !== needle[i]) {
            return false;
        }
    }
    return true;
}
export function fastStartsWithFrom(haystack, needle, start) {
    if (haystack.length - start < needle.length) {
        return false;
    }
    var ceil = start + needle.length;
    for (var i = start; i < ceil; i += 1) {
        if (haystack[i] !== needle[i - start]) {
            return false;
        }
    }
    return true;
}
// Efficient manuel lexer
export function isDigit(ch) {
    // 48 == '0'
    // 57 == '9'
    return ch >= 48 && ch <= 57;
}
export function isAlpha(ch) {
    // Force to lower-case
    ch |= 32;
    // 65 == 'A'
    // 90 == 'Z'
    return ch >= 97 && ch <= 122;
}
function isAlphaExtended(ch) {
    // 192 -> 450
    // À  Á  Â  Ã  Ä  Å  Æ  Ç  È  É  Ê  Ë  Ì  Í  Î  Ï  Ð  Ñ  Ò  Ó  Ô  Õ  Ö  ×  Ø
    // Ù  Ú  Û  Ü  Ý  Þ  ß  à  á  â  ã  ä  å  æ  ç  è  é  ê  ë  ì  í  î  ï  ð  ñ
    // ò  ó  ô  õ  ö  ÷  ø  ù  ú  û  ü  ý  þ  ÿ  Ā  ā  Ă  ă  Ą  ą  Ć  ć  Ĉ  ĉ  Ċ
    // ċ  Č  č  Ď  ď  Đ  đ  Ē  ē  Ĕ  ĕ  Ė  ė  Ę  ę  Ě  ě  Ĝ  ĝ  Ğ  ğ  Ġ  ġ  Ģ  ģ
    // Ĥ  ĥ  Ħ  ħ  Ĩ  ĩ  Ī  ī  Ĭ  ĭ  Į  į  İ  ı  Ĳ  ĳ  Ĵ  ĵ  Ķ  ķ  ĸ  Ĺ  ĺ  Ļ  ļ
    // Ľ  ľ  Ŀ  ŀ  Ł  ł  Ń  ń  Ņ  ņ  Ň  ň  ŉ  Ŋ  ŋ  Ō  ō  Ŏ  ŏ  Ő  ő  Œ  œ  Ŕ  ŕ
    // Ŗ  ŗ  Ř  ř  Ś  ś  Ŝ  ŝ  Ş  ş  Š  š  Ţ  ţ  Ť  ť  Ŧ  ŧ  Ũ  ũ  Ū  ū  Ŭ  ŭ  Ů
    // ů  Ű  ű  Ų  ų  Ŵ  ŵ  Ŷ  ŷ  Ÿ  Ź  ź  Ż  ż  Ž  ž  ſ  ƀ  Ɓ  Ƃ  ƃ  Ƅ  ƅ  Ɔ  Ƈ
    // ƈ  Ɖ  Ɗ  Ƌ  ƌ  ƍ  Ǝ  Ə  Ɛ  Ƒ  ƒ  Ɠ  Ɣ  ƕ  Ɩ  Ɨ  Ƙ  ƙ  ƚ  ƛ  Ɯ  Ɲ  ƞ  Ɵ  Ơ
    // ơ  Ƣ  ƣ  Ƥ  ƥ  Ʀ  Ƨ  ƨ  Ʃ  ƪ  ƫ  Ƭ  ƭ  Ʈ  Ư  ư  Ʊ  Ʋ  Ƴ  ƴ  Ƶ  ƶ  Ʒ  Ƹ  ƹ
    // ƺ  ƻ  Ƽ  ƽ  ƾ  ƿ  ǀ  ǁ  ǂ
    return ch >= 192 && ch <= 450;
}
function isCyrillic(ch) {
    // 1024 -> 1279
    // Ѐ Ё Ђ Ѓ Є Ѕ І Ї Ј Љ Њ Ћ Ќ Ѝ Ў Џ А Б В Г Д Е Ж З И Й К Л М Н О П Р С Т У Ф Х
    // Ц Ч Ш Щ Ъ Ы Ь Э Ю Я а б в г д е ж з и й к л м н о п р с т у ф х ц ч ш щ ъ ы
    // ь э ю я ѐ ё ђ ѓ є ѕ і ї ј љ њ ћ ќ ѝ ў џ Ѡ ѡ Ѣ ѣ Ѥ ѥ Ѧ ѧ Ѩ ѩ Ѫ ѫ Ѭ ѭ Ѯ ѯ
    // Ѱ ѱ Ѳ ѳ Ѵ ѵ Ѷ ѷ Ѹ ѹ Ѻ ѻ Ѽ ѽ Ѿ ѿ Ҁ ҁ ҂ ҃ ҄ ҅ ҆ ҇ ҈ ҉ Ҋ ҋ Ҍ ҍ Ҏ ҏ Ґ ґ Ғ ғ Ҕ ҕ Җ җ Ҙ ҙ
    // Қ қ Ҝ ҝ Ҟ ҟ Ҡ ҡ Ң ң Ҥ ҥ Ҧ ҧ Ҩ ҩ Ҫ ҫ Ҭ ҭ Ү ү Ұ ұ Ҳ ҳ Ҵ ҵ Ҷ ҷ Ҹ ҹ Һ һ Ҽ ҽ Ҿ
    // ҿ Ӏ Ӂ ӂ Ӄ ӄ Ӆ ӆ Ӈ ӈ Ӊ ӊ Ӌ ӌ Ӎ ӎ ӏ Ӑ ӑ Ӓ ӓ Ӕ ӕ Ӗ ӗ Ә ә Ӛ ӛ Ӝ ӝ Ӟ ӟ Ӡ ӡ Ӣ ӣ Ӥ
    // ӥ Ӧ ӧ Ө ө Ӫ ӫ Ӭ ӭ Ӯ ӯ Ӱ ӱ Ӳ ӳ Ӵ ӵ Ӷ ӷ Ӹ ӹ Ӻ ӻ Ӽ ӽ Ӿ ӿ
    return ch >= 1024 && ch <= 1279;
}
function isAllowedFilter(ch) {
    return (isDigit(ch) || isAlpha(ch) || isAlphaExtended(ch) || isCyrillic(ch) || ch === 37 /* '%' */);
}
// Shared TokensBuffer used to avoid having to allocate many typed arrays
var TOKENS_BUFFER = new TokensBuffer(200);
function fastTokenizerNoRegex(pattern, isAllowedCode, skipFirstToken, skipLastToken, buffer) {
    var inside = false;
    var start = 0;
    var precedingCh = 0; // Used to check if a '*' is not just before a token
    for (var i = 0; i < pattern.length; i += 1) {
        var ch = pattern.charCodeAt(i);
        if (isAllowedCode(ch)) {
            if (inside === false) {
                inside = true;
                start = i;
                // Keep track of character preceding token
                if (i > 0) {
                    precedingCh = pattern.charCodeAt(i - 1);
                }
            }
        }
        else if (inside === true) {
            inside = false;
            // Should not be followed by '*'
            if ((skipFirstToken === false || start !== 0) &&
                i - start > 1 &&
                ch !== 42 &&
                precedingCh !== 42) {
                buffer.push(fastHashBetween(pattern, start, i));
                if (buffer.pos === buffer.size) {
                    return;
                }
            }
        }
    }
    if (inside === true &&
        skipLastToken === false &&
        precedingCh !== 42 &&
        pattern.length - start > 1) {
        buffer.push(fastHashBetween(pattern, start, pattern.length));
    }
    return;
}
function fastTokenizer(pattern, isAllowedCode, buffer) {
    var inside = false;
    var start = 0;
    for (var i = 0; i < pattern.length; i += 1) {
        var ch = pattern.charCodeAt(i);
        if (isAllowedCode(ch)) {
            if (inside === false) {
                inside = true;
                start = i;
            }
        }
        else if (inside === true) {
            inside = false;
            buffer.push(fastHashBetween(pattern, start, i));
            if (buffer.pos === buffer.size) {
                return;
            }
        }
    }
    if (inside === true) {
        buffer.push(fastHashBetween(pattern, start, pattern.length));
    }
}
export function tokenizeInPlace(pattern, buffer) {
    fastTokenizerNoRegex(pattern, isAllowedFilter, false, false, buffer);
}
export function tokenize(pattern) {
    TOKENS_BUFFER.seekZero();
    tokenizeInPlace(pattern, TOKENS_BUFFER);
    return TOKENS_BUFFER.slice();
}
export function tokenizeFilterInPlace(pattern, skipFirstToken, skipLastToken, buffer) {
    fastTokenizerNoRegex(pattern, isAllowedFilter, skipFirstToken, skipLastToken, buffer);
}
export function tokenizeFilter(pattern, skipFirstToken, skipLastToken) {
    TOKENS_BUFFER.seekZero();
    tokenizeFilterInPlace(pattern, skipFirstToken, skipLastToken, TOKENS_BUFFER);
    return TOKENS_BUFFER.slice();
}
export function tokenizeRegexInPlace(selector, tokens) {
    var end = selector.length - 1;
    var begin = 1;
    var prev = 0;
    // Try to find the longest safe *prefix* that we can tokenize
    for (; begin < end; begin += 1) {
        var code = selector.charCodeAt(begin);
        // If we encounter '|' before any other opening bracket, then it's not safe
        // to tokenize this filter (e.g.: 'foo|bar'). Instead we abort tokenization
        // to be safe.
        if (code === 124 /* '|' */) {
            return;
        }
        if (code === 40 /* '(' */ ||
            code === 42 /* '*' */ ||
            code === 43 /* '+' */ ||
            code === 63 /* '?' */ ||
            code === 91 /* '[' */ ||
            code === 123 /* '{' */ ||
            (code === 46 /* '.' */ && prev !== 92) /* '\' */ ||
            (code === 92 /* '\' */ && isAlpha(selector.charCodeAt(begin + 1)))) {
            break;
        }
        prev = code;
    }
    // Try to find the longest safe *suffix* that we can tokenize
    prev = 0;
    for (; end >= begin; end -= 1) {
        var code = selector.charCodeAt(end);
        // If we encounter '|' before any other opening bracket, then it's not safe
        // to tokenize this filter (e.g.: 'foo|bar'). Instead we abort tokenization
        // to be safe.
        if (code === 124 /* '|' */) {
            return;
        }
        if (code === 41 /* ')' */ ||
            code === 42 /* '*' */ ||
            code === 43 /* '+' */ ||
            code === 63 /* '?' */ ||
            code === 93 /* ']' */ ||
            code === 125 /* '}' */ ||
            (code === 46 /* '.' */ && selector.charCodeAt(end - 1) !== 92) /* '\' */ ||
            (code === 92 /* '\' */ && isAlpha(prev))) {
            break;
        }
        prev = code;
    }
    if (end < begin) {
        // Full selector is safe
        var skipFirstToken = selector.charCodeAt(1) !== 94 /* '^' */;
        var skipLastToken = selector.charCodeAt(selector.length - 1) !== 36 /* '$' */;
        tokenizeFilterInPlace(selector.slice(1, selector.length - 1), skipFirstToken, skipLastToken, tokens);
    }
    else {
        // Tokenize prefix
        if (begin > 1) {
            tokenizeFilterInPlace(selector.slice(1, begin), selector.charCodeAt(1) !== 94 /* '^' */, // skipFirstToken
            true, tokens);
        }
        // Tokenize suffix
        if (end < selector.length - 1) {
            tokenizeFilterInPlace(selector.slice(end + 1, selector.length - 1), true, selector.charCodeAt(selector.length - 1) !== 94 /* '^' */, // skipLastToken
            tokens);
        }
    }
}
export function createFuzzySignature(pattern) {
    TOKENS_BUFFER.seekZero();
    fastTokenizer(pattern, isAllowedFilter, TOKENS_BUFFER);
    return compactTokens(new Uint32Array(TOKENS_BUFFER.slice()));
}
export function binSearch(arr, elt) {
    if (arr.length === 0) {
        return -1;
    }
    var low = 0;
    var high = arr.length - 1;
    while (low <= high) {
        var mid = (low + high) >>> 1;
        var midVal = arr[mid];
        if (midVal < elt) {
            low = mid + 1;
        }
        else if (midVal > elt) {
            high = mid - 1;
        }
        else {
            return mid;
        }
    }
    return -1;
}
export function binLookup(arr, elt) {
    return binSearch(arr, elt) !== -1;
}
export function updateResponseHeadersWithCSP(details, policies) {
    if (policies === undefined) {
        return {};
    }
    var responseHeaders = details.responseHeaders || [];
    var CSP_HEADER_NAME = 'content-security-policy';
    // Collect existing CSP headers from response
    responseHeaders.forEach(function (_a) {
        var name = _a.name, value = _a.value;
        if (name.toLowerCase() === CSP_HEADER_NAME) {
            policies += "; " + value;
        }
    });
    // Remove all CSP headers from response
    responseHeaders = responseHeaders.filter(function (_a) {
        var name = _a.name;
        return name.toLowerCase() !== CSP_HEADER_NAME;
    });
    // Add updated CSP header
    responseHeaders.push({ name: CSP_HEADER_NAME, value: policies });
    return { responseHeaders: responseHeaders };
}
var hasUnicodeRe = /[^\u0000-\u00ff]/;
export function hasUnicode(str) {
    return hasUnicodeRe.test(str);
}
