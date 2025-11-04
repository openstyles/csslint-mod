import Bucket from './bucket';
import Properties from './properties';
import StringSource from './string-source';
import {clipString} from './util';
import {PropValueIterator} from './validation';
import VTComplex from './validation-complex';
import VTFunctions from './validation-functions';
import VTSimple from './validation-simple';

const rxAltSep = /\s*\|\s*/;
const rxAndAndSep = /\s*&&\s*/y;
const rxBraces = /{\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?}/y; // {n,} = {n,Infinity}
const rxFuncBegin = /([-\w]+)\(\s*(\))?/y;
const rxFuncEnd = /\s*\)/y;
const rxGroupBegin = /\[\s*/y;
const rxGroupEnd = /\s*]/y;
const rxOrOrSep = /\s*\|\|\s*/y;
const rxOrSep = /\s*\|(?!\|)\s*/y;
const rxPlainTextAlt = /[-\w]+(?:\s*\|\s*[-\w]+)*(?=\s*\|(?!\|)\s*|\s*]|\s+\)|\s*$)/y;
const rxSeqSep = /\s+(?![&|)\]])/y;
const rxTerm = /<[^>\s]+>|"[^"]*"|'[^']*'|[^\s?*+#{}()[\]|&]+/y;

/**
 * This class implements a combinator library for matcher functions.
 * https://developer.mozilla.org/docs/Web/CSS/Value_definition_syntax#Component_value_combinators
 * @prop {string} [_string]
 * @prop {(expr: PropValueIterator, p: Token) => boolean} [test]
 */
export default class Matcher {
  /**
   * @param {number} [meta] - for alt/seq/many/braces that control matchers
   */
  constructor(meta) {
    this._meta = meta;
  }

  /**
   * @param {PropValueIterator} expr
   * @param {Token} [p]
   * @return {boolean}
   */
  match(expr, p) {
    const {i} = expr;
    if (!p && !(p = expr.parts[i]))
      return (/**@type{BracesMatcher}*/this).min === 0;
    let res = this._meta;
    if (res === ALT) {
      for (const m of (/**@type{AltMatcher}*/this).ms)
        if ((res = m.match(expr, p)))
          break;
    } else if (res) {
      res = this.test(expr, p);
    } else {
      res = p.isVar ||
        (((res = (/**@type{SimpleMatcher}*/this).fn)) ? !!res(p) : this.test(expr, p)) ||
        expr.tryAttr && p.isAttr;
      if (res && expr.i < expr.parts.length)
        ++expr.i;
    }
    if (!res) expr.i = i;
    return res;
  }

  toString() {
    return this._string;
  }

  /** Matcher for one or more juxtaposed words, which all must occur, in the given order.
   * @param {Matcher[]} ms
   * @return {Matcher}
   */
  static alt(ms) {
    return !ms[1] ? ms[0] : new AltMatcher(ms);
  }

  braces(min, max, marker, sep) {
    return new BracesMatcher(this, min, max, marker,
      sep && new SeqMatcher([
        typeof sep === 'string' ? singleTerm(sep) : sep,
        this,
      ]),
    );
  }

  /**
   * @param {boolean[] | boolean} [req]
   * @param {Matcher[]} ms
   * @return {Matcher | ManyMatcher}
   */
  static many(req, ms) {
    return !ms[1] ? ms[0] : new ManyMatcher(req, ms);
  }

  static seq(ms) {
    return !ms[1] ? ms[0] : new SeqMatcher(ms);
  }
}

/**
 * ALT: OROR [ " | " OROR ]*  (exactly one matches)
 */
class AltMatcher extends Matcher {
  /** @param {Matcher[]} ms */
  constructor(ms) {
    super(ALT);
    this.ms = ms;
  }

  toString(prec) {
    return (prec = prec > ALT ? '[ ' : '') +
      (this._string || this.ms.map(m => m.toString(ALT)).join(' | ')) +
      (prec ? ' ]' : '');
  }
}

/**
 * MOD: "?" | "*" | "+" | "#" | "{" | "#{"
 * @param {StringSource} src
 * @return {Matcher}
 */
class BracesMatcher extends Matcher {
  /**
   * @param {Matcher} m
   * @param {number} min
   * @param {number} max
   * @param {string} [marker]
   * @param {string|Matcher} [sep]
   */
  constructor(m, min, max, marker, sep) {
    super(MOD);
    this.m = m;
    this.min = min;
    this.max = max;
    this.marker = marker;
    this.sep = sep;
  }

  /**
   * @param {PropValueIterator} expr
   * @param {Token} p
   * @return {boolean|number}
   */
  test(expr, p) {
    let i = 0;
    const {min, max, sep, m} = this;
    while (i < max && (i && sep || m).match(expr, p)) {
      p = undefined; // clearing because expr points to the next part now
      i++;
    }
    return i >= min && (i || true);
  }

  toString() {
    const {marker, min, max} = this;
    return this._string || (this.m.toString(MOD) + (marker || '') + (
      !marker || marker === '#' && !(min === 1 || max === Infinity)
        ? `{${min}${min === max ? '' : `,${max === Infinity ? '' : max}`}}`
        : ''));
  }
}

/**
 * TERM: <fn:listName> | name() | name( body )
 */
class FuncMatcher extends Matcher {
  /**
   * @param {{}} [list]
   * @param {string} [name]
   * @param {string} [body]
   */
  constructor(list, name, body) {
    super();
    this.list = list;
    this.name = name;
    this.body = body;
  }

  /**
   * @param {PropValueIterator} expr
   * @param {Token} p
   * @return {!boolean|number|void}
   */
  test(expr, p) {
    const name = p.name; if (!name) return;
    let e, m, vi;
    const {list} = this;
    if (list)
      m = list[name]; // VTFunctions doesn't have vendor-prefixed names
    else if (name === (e = this.name) || (vi = p.prefix) && vi + name === e)
      m = this.body;
    if (!m)
      return m != null; // true = no check if `body` is false i.e. no specs for params
    if ((e = p.expr)) {
      if (e.isVar) return true;
      else vi = new PropValueIterator(e);
    }
    if (!(m instanceof Matcher)) {
      m = (typeof m === 'function' ? m(Matcher) : cache[m] || parse(m));
      if (list) list[name] = m;
    }
    if (!e)
      return m.min === 0;
    return m.match(vi) && vi.i >= vi.parts.length
      || !(expr.badFunc = [e, m]);
  }

  toString(prec) {
    let s = this.name;
    return s ? this._string || `${s}(${(s = this.body) && !prec ? ` ${s} ` : ''})`
      : (prec > ALT ? '[ ' : '') +
        (this._string || Object.keys(this.list).join('() | ') + '()') +
        (prec > ALT ? ' ]' : '');
  }
}

/**
 * OROR: ANDAND [ " || " ANDAND ]*  (at least one matches in any order)
 * This will backtrack through even successful matches to try to
 * maximize the number of items matched.
 */
class ManyMatcher extends Matcher {
  /**
   * @param {boolean[] | false} [req]
   * @param {Matcher[]} ms
   */
  constructor(req, ms) {
    super(OROR);
    this.ms = ms;
    this.req = req === true ? Array(ms.length).fill(true)
      : req ?? ms.map(m => (/**@type{BracesMatcher}*/m).min !== 0);
  }

  /**
   * @param {PropValueIterator} expr
   * @return {!boolean}
   */
  test(expr) {
    const state = [];
    state.expr = expr;
    state.max = 0;
    // If couldn't get a complete match, retrace our steps to make the
    // match with the maximum # of required elements.
    if (!this._testRun(state, 0))
      this._testRun(state, 0, true);
    if (!this.req)
      return state.max > 0;
    // Use finer-grained specification of which matchers are required.
    for (let i = 0; i < this.req.length; i++)
      if (this.req[i] && !state[i])
        return false;
    return true;
  }

  _testRun(state, count, retry) {
    const {expr} = state;
    const {ms} = this;
    for (let i = 0, ei, x; i < ms.length; i++) {
      if (!state[i] && (
        (ei = expr.i) + 1 > expr.parts.length ||
        (x = ms[i].match(expr)) && (x > 1 || x === 1 || ms[i].min !== 0)
        // Seeing only real matches e.g. <foo> inside <foo>? or <foo>* or <foo>#{0,n}
        // Not using `>=` because `true>=1` and we don't want booleans here
      )) {
        state[i] = true;
        if (this._testRun(state, count + (!this.req || this.req[i] ? 1 : 0), retry))
          return true;
        state[i] = false;
        expr.i = ei;
      }
    }
    if (retry) return count === state.max;
    state.max = Math.max(state.max, count);
    return count === ms.length;
  }

  toString(prec) {
    const {req} = this;
    const p = req ? ANDAND : OROR;
    const s = this._string || this.ms.map((m, i) =>
      !req || req[i]
        ? m.toString(p)
        : m.toString(MOD).replace(/[^?]$/, '$&?'),
    ).join(req ? ' && ' : ' || ');
    return prec > p ? `[ ${s} ]` : s;
  }
}

/**
 * SEQ: TERM [" " TERM]*
 * Matching terms in specified order.
 * Space is mandatory between terms e.g. [foo <type> , <term> bar]
 * @param {StringSource} src
 * @return {Matcher}
 */
class SeqMatcher extends Matcher {
  /** @param {Matcher[]} */
  constructor(ms) {
    super(SEQ);
    this.ms = ms;
  }

  /**
   * @param {PropValueIterator} expr
   * @param {Token} p
   * @return {!boolean|void}
   */
  test(expr, p) {
    let min1, i, m, res;
    for (i = 0; (m = this.ms[i++]); p = undefined) {
      if (!(res = m.match(expr, p)))
        return;
      if (!min1 && (m.min !== 0 || res === 1 || res > 1))
        min1 = true;
      // a number >= 1 is returned only from BracesMatcher.test
    }
    return true;
  }

  toString(prec) {
    return (prec = prec > SEQ ? '[ ' : '') +
      (this._string || this.ms.map(m => m.toString(SEQ)).join(' ')) +
      (prec ? ' ]' : '');
  }
}

/**
 * TERM: <type>
 */
class SimpleMatcher extends Matcher {
  /**
   * @param {(p: Token) => ?} fn
   */
  constructor(fn) {
    super();
    this.fn = fn;
  }
}

/**
 * TERM: literal [ | literal]+
 */
class StringsMatcher extends Matcher {
  /** @type {Bucket} */
  bu;
  /**
   * @param {string} str
   */
  constructor(str) {
    super();
    this.str = str;
  }

  /**
   * @param {?} expr
   * @param {Token} p
   * @return {!boolean}
   */
  test(expr, p) {
    const bu = this.bu ??= (expr = this.str.split(rxAltSep), this.str = '', new Bucket(expr));
    return bu.has(p) // the bucket may have -vendor-prefixed-text too
      || p.vendorPos && bu.has(p, undefined, p.vendorPos) || false;
  }

  toString(prec) {
    return prec > ALT && (this.bu ? this.bu.map.size > 1 : rxAltSep.test(this.str))
      ? `[ ${this._string} ]`
      : this._string;
  }
}

/** Simple recursive-descent parseAlt to build matchers from strings.
 * @param {string} str
 * @return {Matcher}
 */
const parse = Matcher.parse = str => {
  const source = new StringSource(str);
  const res = parseAlt(source);
  if (!source.eof()) {
    const {offset: i, string} = source;
    throw new Error(`Internal grammar error. Unexpected "${
      clipString(string.slice(i, 31), 30)}" at position ${i} in "${string}".`);
  }
  cache[str] = res;
  return res;
};

/**
 * ALT: OROR [ " | " OROR ]*  (exactly one matches)
 * OROR: ANDAND [ " || " ANDAND ]*  (at least one matches in any order)
 * ANDAND: SEQ [ " && " SEQ ]*  (all match in any order)
 * SEQ: TERM [" " TERM]*  (all match in specified order)
 * TERM: [ "<" type ">" | literal | "[ " ALT " ]" | fn "()" | fn "( " ALT " )" ] MOD?
 * MOD: "?" | "*" | "+" | "#" | [ "{" | "#{" ] <num>[,[<num>]?]? "}" ]
 * The specified literal spaces like " | " are optional except " " in SEQ (i.e. \s+)
 * @param {StringSource} src
 * @return {Matcher}
 */
const parseAlt = src => {
  const alts = [];
  let literals = '';
  let litIndex;
  do {
    let s = src.peek();
    if ((/* a-z - */ s >= 97 && s <= 122 || s === 45) && (s = src.readMatch(rxPlainTextAlt))) {
      if (literals) literals += ' | ';
      else litIndex = alts.length;
      literals += s;
    } else {
      const ors = [];
      do {
        const ands = [];
        do {
          const seq = [];
          do {
            seq.push(parseTerm(src));
          } while (src.readMatch(rxSeqSep));
          ands.push(!seq[1] ? seq[0] : new SeqMatcher(seq));
        } while (src.readMatch(rxAndAndSep));
        ors.push(Matcher.many(null, ands));
      } while (src.readMatch(rxOrOrSep));
      alts.push(!ors[1] ? ors[0] : new ManyMatcher(false, ors));
    }
  } while (src.readMatch(rxOrSep));
  if (literals)
    alts.splice(litIndex, 0, singleTerm(literals));
  return !alts[1] ? alts[0] : new AltMatcher(alts);
};

/**
 * @param {StringSource} src
 * @return {Matcher}
 */
const parseTerm = src => {
  let m, fn;
  fn = src.peek();
  if (/* [ */ fn === 91 && src.readMatch(rxGroupBegin)) {
    m = parseAlt(src);
    if (!src.readMatch(rxGroupEnd))
      parsingFailed(src, rxGroupEnd);
  } else if (/* a-z - */
    (fn >= 97 && fn <= 122 || fn === 45) &&
    (fn = src.readMatch(rxFuncBegin, true))
  ) {
    m = new FuncMatcher(
      null,
      fn[1].toLowerCase(),
      fn[2] // if there's no inline body grammar in `src`
        ? VTFunctions._[fn[1]] || false /* for FuncMatcher.test */
        : parseAlt(src),
    );
    if (!fn[2] && !src.readMatch(rxFuncEnd)) parsingFailed(src, rxFuncEnd);
  } else {
    m = singleTerm(src.readMatch(rxTerm) || parsingFailed(src, rxTerm));
  }
  fn = src.peek();
  if (fn === 123/* { */ || fn === 35/* # */ && src.peek(2) === 123) {
    const hash = fn === 35 ? src.read() : '';
    const [, a, comma, b = comma ? Infinity : a] = src.readMatch(rxBraces, true)
      || parsingFailed(src, rxBraces);
    m = m.braces(+a, +b, hash, hash && ',');
    if (src.peek() === 63 /* ? */) {
      src.read();
      if (+a === 1) m.min = 0; // modify 1->0 inplace
      else m = m.braces(0, 1, '?');
    }
    return m;
  }
  if (fn === 63 /* ? */) {
    m = m.braces(0, 1, '?');
  } else if (fn === 42 /* * */) {
    m = m.braces(0, Infinity, '*');
  } else if (fn === 43 /* + */) {
    m = m.braces(1, Infinity, '+');
  } else if (fn === 35 /* # */) {
    fn = src.peek(2) !== 63 /* ? */ ? 1 : (src.read(2), 0);
    m = m.braces(fn, Infinity, '#', ',');
  } else fn = 0;
  if (fn) src.read();
  return m;
};

/**
 * @param {StringSource} src
 * @param {RegExp|string} m
 * @throws
 */
const parsingFailed = (src, m) => {
  throw new Error('Internal grammar error. ' +
    `Expected ${m} at ${src.offset} in ${src.string}`);
};

/** Matcher for a single type
 * @param {string} str
 * @return {Matcher}
 */
const singleTerm = Matcher.term = str => {
  const origStr = str;
  let m = cache[str = str.toLowerCase()];
  if (m) return m;
  if (str.charCodeAt(0) !== 60 /* < */) {
    m = new StringsMatcher(str);
    m._string = origStr;
  } else if (str.startsWith('<fn:')) {
    m = new FuncMatcher(VTFunctions[origStr.slice(4, -1)]);
  } else if ((m = VTSimple[str])) {
    m = new SimpleMatcher(m);
    m._string = str;
  } else {
    m = VTComplex[str] || Properties[str.slice(1, -1)];
    if (!m) throw new Error(`Unknown grammar term ${str}`);
    m = m instanceof Matcher ? m : m.call ? m(Matcher) : cache[m] || parse(m);
    if (str === '<url>') m._string = origStr;
  }
  cache[str] = m;
  return m;
};


/** @type {{[key:string]: Matcher}} */
const cache = Matcher.cache = {__proto__: null};
// Precedence of combinators.
const MOD = Matcher.MOD = 5;
const SEQ = Matcher.SEQ = 4;
const ANDAND = Matcher.ANDAND = 3;
const OROR = Matcher.OROR = 2;
const ALT = Matcher.ALT = 1;
