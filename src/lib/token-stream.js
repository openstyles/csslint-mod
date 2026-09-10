/* eslint-disable class-methods-use-this */
import Bucket from './bucket';
import StringSource from './string-source';
import Token from './token';
import Tokens, {TokenIdByCode} from './tokens';
import Units, {UnitTypeIds} from './units';
import {
  clipString, define, documentFuncs, isOwn, ParseError, PDESC, rxUnescapeLF, toLowAscii,
} from './util';

export const TT = {
  attrEq: [ATTR_EQ, EQUALS],
  attrEqEnd: [ATTR_EQ, EQUALS, RBRACKET],
  attrStart: [PIPE, IDENT, STAR],
  attrNameEnd: [RBRACKET, UVAR, WS],
  combinator: [PLUS, GT, COMBINATOR],
  condition: [FUNCTION, IDENT, LPAREN],
  declEnd: [SEMICOLON, RBRACE],
  docFunc: [FUNCTION, IDENT/* while typing a new func */, URI],
  identStar: [IDENT, STAR],
  identString: [IDENT, STRING],
  mediaList: [IDENT, LPAREN],
  mediaOp: [COLON, EQUALS, EQ_CMP, LT, GT, LPAREN],
  mediaValue: [IDENT, NUMBER, DIMENSION, LENGTH],
  propCustomEnd: [DELIM, SEMICOLON, RBRACE, RBRACKET, RPAREN, INVALID],
  propValEnd: [DELIM, SEMICOLON, RBRACE],
  propValEndParen: [DELIM, SEMICOLON, RBRACE, RPAREN],
  pseudo: [FUNCTION, IDENT],
  selectorStart: [AMP, PIPE, IDENT, STAR, HASH, DOT, LBRACKET, COLON],
};
export const OrDie = {must: true};
export const OrDieReusing = {must: true, reuse: true};
/** For these tokens stream.match() will return a UVAR unless the next token is a direct match */
const UVAR_PROXY = [PCT, ...TT.mediaValue, ...TT.identString]
  .reduce((res, id) => (res[id] = true) && res, []);
// Sticky `y` flag must be used in expressions for StringSource's readMatch
// Groups must be non-capturing (?:foo) unless explicitly necessary
const rxCommentUso = /(\*)\[\[[-\w]+]]\*\/|\*(?:[^*]+|\*(?!\/))*(?:\*\/|$)/y;
const rxDigits = /\d+/y;
const rxMaybeQuote = /\s*(['"]?)/y;
const rxName = /(?:[-_\da-zA-Z\u00A1-\uFFFF]+|\\(?:[0-9a-fA-F]{1,6}\s?|.|$))+/y;
const rxNth = /(even|odd)|(?:([-+]?\d*n)(?:\s*([-+])(\s*\d+)?)?|[-+]?\d+)((?=\s+of\s+|\s*\)))?/yi;
const rxNumberDigit = /\d*(?:(\.)\d*)?(?:(e)[+-]?\d+)?/iy;
const rxNumberDot = /\d+(?:(e)[+-]?\d+)?/iy;
const rxNumberSign = /(?:(\.)\d+|\d+(?:(\.)\d*)?)(?:(e)[+-]?\d+)?/iy;
const rxSign = /[-+]/y;
const rxSpace = /\s+/y;
const rxSpaceCmtRParen = /(?=\s|\/\*|\))/y;
const rxSpaceComments = /(?:\s+|\/\*(?:[^*]+|\*(?!\/))*(?:\*\/|$))+/y;
const rxSpaceRParen = /\s*\)/y;
const rxStringDoubleQ = /(?:[^\n\\"]+|\\(?:[0-9a-fA-F]{1,6}\s?|.|\n|$))*/y;
const rxStringSingleQ = /(?:[^\n\\']+|\\(?:[0-9a-fA-F]{1,6}\s?|.|\n|$))*/y;
const rxUnescapeNoLF = /\\(?:([0-9a-fA-F]{1,6})\s?|(.))/g;
const rxUnicodeRange = /\+([\da-f]{1,6})(\?{1,6}|-([\da-f]{1,6}))?/iy; // U was already consumed
const rxUnquotedUrl = /(?:[-!#$%&*-[\]-~\u00A1-\uFFFF]+|\\(?:[0-9a-fA-F]{1,6}\s|.|$))+/y;
const [rxDeclBlock, rxDeclValue] = ((
  exclude = String.raw`'"{}()[\]\\/`,
  orSlash = ']|/(?!\\*))',
  blk = String.raw`(?:"[^"\n\\]*"|[^${exclude}${orSlash}*`,
  common = `(?:${[
    rxUnescapeLF.source,
    `"${rxStringDoubleQ.source}(?:"|\n|$)`, // \n for bad string
    `'${rxStringSingleQ.source}(?:'|\n|$)`, // \n for bad string
    String.raw`\(${blk}\)|\[${blk}]`,
    String.raw`/\*(?:[^*]+|\*(?!\/))*(?:\*\/|$)`,
  ].join('|')}|`
) => [`{${blk}}|[^`, '[^;'].map(str => RegExp(common + str + exclude + orSlash + '+', 'y')))();
const isIdentChar = c => c >= CC`a` && c <= CC`z` || c >= CC`A` && c <= CC`Z` ||
  c === CC`-` || c === CC`\\` || c === CC`_` || c >= 160/*unicode*/ || c >= CC`0` && c <= CC`9`;
const isIdentStart = (a, b) => a >= CC`a` && a <= CC`z` || a >= CC`A` && a <= CC`Z` ||
  a === CC`_` || a >= 160/*unicode*/ ||
  (a === CC`-` ? b !== CC`-` && isIdentStart(b)
    : a === CC`\\` && b != null && b !== CC`\n`);
const isSpace = c => c === CC`\t` || c === CC`\n` || c === CC` `;
const unescapeNoLF = (m, code, char) => char || String.fromCodePoint(parseInt(code, 16));

/**
 * @property {boolean} isUvp
 * @typedef {true[]} TokenMap - index is a token id
 */
TT.nestSel = [...TT.selectorStart, ...TT.combinator];
TT.nestSelBlock = [...TT.nestSel, LBRACE];
for (const k in TT) {
  TT[k] = TT[k].reduce((res, id) => {
    if (UVAR_PROXY[id]) res.isUvp = 1;
    res[id] = true;
    return res;
  }, []);
}

/**
 * @property {()=>Token|false} grab - gets the next token skipping WS and UVAR
 * @property {Token} token - Last consumed token object
 */
export default class TokenStream {

  constructor(input) {
    this.source = new StringSource(input ? `${input}` : '');
    /** Number of consumed "&" tokens */
    this._amp = 0;
    /** Lookahead buffer size */
    this._max = 4;
    /** Closing token of the currently processed block */
    this._pair = 0;
    this._resetBuf();
    define(this, 'grab', {writable: true, value: this.get.bind(this, false, false, false)});
  }

  _resetBuf() {
    this.token = null;
    /** Lookahead token buffer */
    this._buf = [];
    /** Current index may change due to unget() */
    this._cur = 0;
    /** Wrapping around the index to avoid splicing/shifting the array */
    this._cycle = 0;
  }

  /**
   * @param {boolean} [uvar] - include UVAR
   * @param {boolean} [ws] - include WS
   * @param {boolean} [cmt] - include COMMENT
   * @return {Token}
   */
  get(uvar, ws = true, cmt) {
    let {_buf: buf, _cur: i, _max: MAX} = this;
    let tok, ti, slot;
    do {
      slot = (i + this._cycle) % MAX;
      if (i >= buf.length) {
        if (buf.length < MAX) i++;
        else this._cycle = (this._cycle + 1) % MAX;
        ti = (tok = buf[slot] = this._getToken(uvar, ws, cmt)).id;
        break;
      }
      ++i;
      ti = (tok = buf[slot]).id;
    } while (!cmt && ti === COMMENT || !ws && ti === WS || !uvar && ti === UVAR);
    if (ti === AMP) this._amp++;
    this._cur = i;
    this.token = tok;
    return tok;
  }

  /**
   * Consumes the next token if it matches the condition(s).
   * @param {Token|TokenMap} what
   * @param {Bucket} [text]
   * @param {Token} [tok]
   * @param {{must?: boolean}} [opts]
   * @return {Token|false}
   */
  match(what, text, tok = this.get(), opts) {
    if ((typeof what === 'object' ? isOwn(what, tok.id) : !what || tok.id === what) &&
        (!text || text.has(tok))) {
      return tok;
    }
    if (opts !== UVAR) {
      this.unget();
      if (opts && opts.must) this._failure(text || what, tok);
      return false;
    }
  }

  /** @return {Token|false} */
  matchOrDie(what, text, tok) {
    return this.match(what, text, tok, OrDie);
  }

  /**
   * Skips whitespace and consumes the next token if it matches the condition(s).
   * @param {Token|TokenMap} what
   * @param {{}|Bucket} [opts]
   * @param {Token|boolean} [opts.reuse]
   * @param {boolean} [opts.must]
   * @param {Bucket} [opts.text]
   * @return {Token|false}
   */
  matchSmart(what, opts = {}) {
    let tok;
    const text = opts.has ? opts : (tok = opts.reuse, opts.text);
    const ws = typeof what === 'object' ? WS in what : what === WS;
    let uvp = !ws && !text && (typeof what === 'object' ? what.isUvp : isOwn(UVAR_PROXY, what));
    tok = tok && (tok.id != null ? tok : this.token) || this.get(uvp, ws);
    uvp = uvp && tok.is & IS_VAR;
    return this.match(what, text, tok, uvp ? UVAR : opts) ||
      uvp && (this.match(what, text, this.grab()) || tok) ||
      false;
  }

  /** @return {Token} */
  peekCached() {
    return this._cur < this._buf.length && this._buf[(this._cur + this._cycle) % this._max];
  }

  /** Restores the last consumed token to the token stream. */
  unget() {
    if (this._cur) {
      if (this.token?.id === AMP) this._amp--;
      this.token = this._buf[(--this._cur - 1 + this._cycle + this._max) % this._max];
    } else {
      throw new Error('Too much lookahead.');
    }
  }

  _failure(goal = '', tok = this.token, throwIt = true) {
    goal = typeof goal === 'string' ? goal :
      goal instanceof Bucket ? `"${goal.join('", "')}"` :
        (+goal ? [goal] : goal).reduce((res, v, id) => res + (res ? ', ' : '') +
          ((v = Tokens[v === true ? id : v]).text ? `"${v.text}"` : v.name), '');
    const found = tok.id ? `"${clipString(tok)}"` : '';
    const str = goal ? `Expected ${goal}${found && ` but found ${found}`}.`
      : `Unexpected ${found || 'end of file'}.`;
    const err = new ParseError(str, tok);
    if (throwIt) throw err;
    return err;
  }

  /**
   * @param {boolean} [uvar]
   * @param {boolean} [ws]
   * @param {boolean} [cmt]
   * @return {Token}
   */
  _getToken(uvar, ws, cmt) {
    const src = this.source;
    let a, b, c, v, text, col, line, offset;
    while (true) {
      ({col, line, offset} = src);
      a = src.readCode(); if (a == null) break;
      b = src.string.charCodeAt(src.offset);
      if (a === CC`\t` || a === CC`\n` || a === CC` `) {
        if (isSpace(b)) src.readMatch(rxSpace);
        if (ws) { v = WS; break; }
      } else if (a === CC`/`) {
        if (b !== CC`*`) { v = DIV; break; }
        v = src.readMatch(rxCommentUso, true);
        if (uvar && v[1]) { v = UVAR; break; }
        if (cmt && v[0]) { v = COMMENT; break; }
        v = 0;
      } else break;
    }
    const tok = new Token(v || CHAR, col, line, offset, src.string, a);
    if (v) {
      if (v === UVAR) tok.is = IS_VAR;
    // [0-9]
    } else if (a >= CC`0` && a <= CC`9`) {
      v = b >= CC`0` && b <= CC`9` || b === CC`.` ||
        (b === CC`E` || b === CC`e`) && (c = src.string.charCodeAt(src.offset + 1)) === CC`+` ||
        c === CC`-` || c >= CC`0` && c <= CC`9`;
      text = this._number(src, tok, a, b, v, rxNumberDigit);
    // [-+.]
    } else if ((a === CC`-` || (a === CC`+` ? tok.id = PLUS : a === CC`.` && (tok.id = DOT))) && (
    /* [-+.][0-9] */ b >= CC`0` && b <= CC`9` ||
    /* [-+].[0-9] */ b === CC`.` && a !== CC`.` &&
      (c ??= src.string.charCodeAt(src.offset + 1)) >= CC`0` && c <= CC`9`
    )) {
      text = this._number(src, tok, a, b, 1, a === CC`.` ? rxNumberDot : rxNumberSign);
    // \ checking before _ident() to exclude non-ident escape
    } else if (a === CC`\\` && (
      b == null
        ? text = '\uFFFD'
        : b === CC`\n` && (tok.id = WS, text = src.readMatch(rxSpace))
    )) {
    // -
    } else if (a === CC`-`) {
      if (b === CC`-`/* -- */) {
        if (isIdentChar(c ??= src.string.charCodeAt(src.offset + 1))) {
          text = this._ident(src, tok, a, b, 1, c, 1);
        } else if (c === CC`>`/* --> */) {
          src.col += 2; src.offset += 2;
          tok.id = CDCO;
        } else {
          tok.id = MINUS;
        }
      } else if (isIdentStart(b, b === CC`\\` && (c ??= src.string.charCodeAt(src.offset + 1)))) {
        text = this._ident(src, tok, a, b, 1, c);
      } else {
        tok.id = MINUS;
      }
    // U+ u+
    } else if ((a === CC`U` || a === CC`u`) && b === CC`+`) {
      v = src.readMatch(rxUnicodeRange, true);
      if (v && parseInt(v[1], 16) <= 0x10FFFF && (
        v[3] ? parseInt(v[3], 16) <= 0x10FFFF
          : !v[2] || (v[1] + v[2]).length <= 6
      )) {
        tok.id = URANGE;
      } else {
        if (v) { src.col -= (v = v[0].length); src.offset -= v; }
        tok.id = IDENT;
      }
    } else if ((v = b === CC`=`
    /* $= *= ^= |= ~= */
      ? (a === CC`$` || a === CC`*` || a === CC`^` || a === CC`|` || a === CC`~`) &&
        ATTR_EQ
    /* <= >= */
      || (a === CC`<` || a === CC`>`) && EQ_CMP
    /* || */
      : a === CC`|` && b === CC`|` &&
        COMBINATOR
    )) {
      tok.id = v;
      src.col++; src.offset++;
    // #
    } else if (a === CC`#`) {
      if (isIdentChar(b)) {
        text = this._ident(src, tok, a, b, 1);
        tok.id = HASH;
      }
    // *
    } else if (a === CC`*`) {
      tok.id = STAR;
      if (isIdentStart(b)) tok.hack = '*';
    // [.,:;>+~=|*{}[]()]
    } else if ((v = TokenIdByCode[a])) {
      tok.id = v;
    // ["']
    } else if (a === CC`"` || a === CC`'`) {
      src.readMatch(a === CC`"` ? rxStringDoubleQ : rxStringSingleQ);
      if (src.readMatchCode(a)) {
        tok.id = STRING;
        tok.type = 'string';
      } else {
        tok.id = INVALID;
      }
    // @
    } else if (a === CC`@`) {
      if (isIdentStart(b, c ??= b === CC`-` || b === CC`\\` ? src.peek(2) : c)) {
        src.col++; src.offset++;
        v = this._ident(src, null, b, c ?? src.string.charCodeAt(src.offset));
        a = v.name;
        text = v.esc && `@${a}`;
        a = a.charCodeAt(0) === CC`-` && (v = a.indexOf('-', 1)) > 1 ? a.slice(v + 1) : a;
        tok.atName = a.toLowerCase();
        tok.id = AT;
      }
    // >
    } else if (a === CC`>`) {
      tok.id = GT;
    // <
    } else if (a === CC`<`) {
      tok.id = b === CC`!` && src.readMatchStr('!--') ? CDCO : LT;
    // a-z A-Z \ _ unicode ("-" was handled above)
    } else if (isIdentStart(a, b)) {
      text = this._ident(src, tok, a, b);
    } else if (a == null) {
      tok.id = EOF;
    }
    tok.end = {
      col: src.col,
      line: src.line,
      offset: src.offset,
    };
    if (text) { PDESC.value = text; define(tok, 'text', PDESC); }
    return tok;
  }

  /**
   * @param {StringSource} src
   * @param {Token} [tok]
   * @param {number} a - 1st char code, already consumed
   * @param {number} b - 2nd char code
   * @param {number} [bYes] - is `b` an ident char
   * @param {number} [c] - 3rd char code
   * @param {number} [cYes] - is `c` an ident char
   * @return {undefined | string | {esc: boolean, name: string}}
   */
  _ident(src, tok, a, b,
    bYes = a === CC`\\` ? b != null && b !== CC`\n` : isIdentChar(b),
    c = bYes && src.string.charCodeAt(src.offset + 1),
    cYes = c && (b === CC`\\` ? a !== CC`\\` && c !== CC`\n` : isIdentChar(c))
  ) {
    const first = a === CC`\\` && bYes ? (src.col--, src.offset--, '') : String.fromCharCode(a);
    const str = cYes || !first ? src.readMatch(rxName)
      : bYes ? (src.col++, src.offset++, String.fromCharCode(b))
        : '';
    const esc = a === CC`\\` || b === CC`\\` || c === CC`\\`
      || str.length > 3 && str.includes('\\');
    const name = esc ? (first + str).replace(rxUnescapeNoLF, unescapeNoLF) : first + str;
    if (!tok)
      return {esc, name};
    let dashed, lc, ovrValue;
    if (esc) {
      cYes = ovrValue = name;
      if (a === CC`\\` || b === CC`\\`) b = name.charCodeAt(1);
      if (a === CC`\\`) a = tok.code = toLowAscii(name.charCodeAt(0));
    }
    const vpLen = a === CC`-` && (b === CC`-` ? (dashed = true, 0) : name.indexOf('-', 2) + 1);
    const next = cYes || !first ? src.string.charCodeAt(src.offset) : bYes ? c : b;
    if (dashed) tok.type = '--';
    if (next === CC`(`) {
      src.col++; src.offset++;
      lc = name.toLowerCase();
      if (documentFuncs[lc] === 1 && (b = this._uriValue(src)) != null) {
        tok.id = URI;
        tok.type = 'uri';
        tok.uri = b;
      } else {
        tok.id = dashed ? DASHED_FUNCTION : FUNCTION;
      }
      tok.name = vpLen ? lc.slice(vpLen) : lc;
      tok.prefix = vpLen ? lc.slice(0, vpLen) : '';
    } else if (next === CC`:` && name === 'progid') {
      ovrValue = name + src.readMatch(/.*?\(/y);
      tok.id = FUNCTION;
      tok.name = ovrValue.slice(0, -1).toLowerCase();
      tok.type = 'ie';
    } else {
      tok.id = IDENT;
      if (!dashed) {
        if (a === CC`-` || (b = name.length) < 3 || b > 20) {
          tok.type = 'ident'; // named color min length is 3 (red), max is 20 (lightgoldenrodyellow)
        } else if (a === 110/*n*/ && name.length === 4 && name.toLowerCase() === 'none') {
          tok.type = 'none';
        }
      }
    }
    if (vpLen) {
      tok.vendor = (lc ? lc.charCodeAt(vpLen) : toLowAscii(name.charCodeAt(vpLen))) + (vpLen << 16);
    }
    return ovrValue;
  }

  _number(src, tok, a, b, bYes, rx) {
    const numStr = String.fromCharCode(a) + (bYes ? (b = src.readMatch(rx, true))[0] : '');
    const isFloat = a === CC`.` || bYes && (b[1] || b[2] || b[3]);
    let ovrText, units;
    a = bYes ? src.string.charCodeAt(src.offset) : b;
    if (a === 37) { // %
      tok.id = PCT;
      tok.type = units = '%';
      src.col++; src.offset++;
    } else if (isIdentStart(a,
      b = a === CC`-` || a === CC`\\` ? src.string.charCodeAt(src.offset + 1) : null
    )) {
      src.col++; src.offset++;
      a = this._ident(src, null, a, b ?? src.string.charCodeAt(src.offset));
      units = a.name;
      ovrText = a.esc && (numStr + units);
      a = Units[units = units.toLowerCase()] || '';
      tok.id = a && UnitTypeIds[a] || DIMENSION;
      tok.type = a;
    } else {
      tok.id = NUMBER;
    }
    tok.units = units || '';
    tok.number = a = +numStr;
    tok.is = !units && !a ? IS_0 | IS_INT : !units && !isFloat ? IS_INT : 0;
    return ovrText;
  }

  /** @param {StringSource} src */
  _spaceCmt(src) {
    const c = src.string.charCodeAt(src.offset);
    return (c === CC`/` || isSpace(c)) && src.readMatch(rxSpaceComments) || '';
  }

  /**
   * Consumes the closing ")" on success
   * @param {StringSource} [src]
   * @return {string|void}
   */
  _uriValue(src) {
    let v = src.peek();
    if (v === CC`"` || v === CC`'`
      || isSpace(v) && (rxMaybeQuote.lastIndex = src.offset, rxMaybeQuote.exec(src.string)[1]))
      return;
    src.mark();
    if ((v = src.readMatch(rxUnquotedUrl)) && v.includes('\\')) {
      v = v.replace(rxUnescapeNoLF, unescapeNoLF);
    }
    if (v != null && (src.readMatchCode(CC`)`) || src.readMatch(rxSpaceRParen))) {
      return v;
    }
    src.reset();
  }

  readNthChild() {
    const src = this.source;
    const m = (this._spaceCmt(src), src.readMatch(rxNth, true)); if (!m) return;
    let [, evenOdd, nth, sign, int, next] = m;
    let a, b, ws;
    if (evenOdd) a = evenOdd;
    else if (!(a = nth)) b = m[0]; // B
    else if ((sign || !next && (ws = this._spaceCmt(src), sign = src.readMatch(rxSign)))) {
      if (int || (src.mark(), this._spaceCmt(src), int = src.readMatch(rxDigits))) {
        b = sign + int.trim();
      } else return src.reset();
    }
    if ((a || b) && (ws || src.readMatch(rxSpaceCmtRParen) != null)) {
      return [a || '', b || ''];
    }
  }

  /**
   * @param {boolean} [inBlock] - to read to the end of the current {}-block
   */
  skipDeclBlock(inBlock) {
    let c = this.peekCached();
    if (c && (c.id === RBRACE || c.id === SEMICOLON)) return;
    for (let src = this.source, stack = [], end = inBlock ? CC`}` : -1; (c = src.peek());) {
      if (c === end || end < 0 && (c === CC`;` || c === CC`}`)) {
        end = stack.pop();
        if (!end || end < 0 && c === CC`}`) {
          if (end || c === CC`;`) src.readCode(); // consuming ; or } of own block
          break;
        }
      } else if (c === CC`}` || c === CC`)` || c === CC`]`) {
        break;
      } else if ((c = c === CC`{` ? CC`}` : c === CC`(` ? CC`)`
        : c === CC`[` && CC`]`)) {
        stack.push(end);
        end = c;
      }
      src.readCode();
      src.readMatch(end > 0 ? rxDeclBlock : rxDeclValue);
    }
    this._resetBuf();
  }
}
