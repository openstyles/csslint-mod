import NamedColors from './named-colors';

/** Much faster than flat array or regexp */
export class Bucket {
  /**
   * @param {string|string[]} src - length < 100
   * @param {string} [separator]
   */
  constructor(src, separator = ' ') {
    /** @type {Map<number, string|string[]>} */
    this.map = new Map();
    this.addFrom(src, separator);
  }

  /**
   * @param {string|string[]} src - length < 100
   * @param {string} [separator]
   * @return {Bucket}
   */
  addFrom(src, separator = ' ') {
    for (let str of typeof src === 'string' ? src.split(separator) : src) {
      let c = (str = str.toLowerCase()).charCodeAt(0);
      if (c === CC`"`) c = (str = str.slice(1, -1)).charCodeAt(0);
      src = this.map.get(c = c * 100 + str.length);
      if (src == null) this.map.set(c, str);
      else if (typeof src === 'string') this.map.set(c, [src, str]);
      else src.push(str);
    }
    return this;
  }

  /** @return {string} */
  join(sep) {
    const res = [];
    for (const v of this.map.values()) {
      if (typeof v === 'string') res.push(v);
      else res.push(...v);
    }
    return res.join(sep);
  }

  /**
   * @param {Token} tok
   * @param {string} [lowText] - text to use instead of token's text
   * @param {number} [vendorPos] - check ignoring vendor prefix
   * @return {boolean}
   */
  has(tok, lowText, vendorPos) {
    let val;
    let low = lowText ?? tok.lowText;
    let len = (low ?? tok).length;
    if (len >= 100 || (val =
      this.map.get(
        (vendorPos ? tok.vendor & 0xFFFF : tok.code) * 100 +
        (vendorPos ? len -= vendorPos : len))
    ) == null) return false;
    if (len === 1) return true;
    low ??= tok.lowText = tok.text.toLowerCase();
    return val === low || (
      typeof val === 'object' ? val.includes(vendorPos ? low.slice(vendorPos) : low)
        : vendorPos ? low.endsWith(val) : false);
  }
}

export const and = new Bucket('and');
export const andOr = new Bucket('and or');
export const attrIS = new Bucket('i s ]'); // "]" is to improve the error message,
export const auto = new Bucket('auto');
export const calc = new Bucket('calc calc-size clamp if min max progress random asin atan atan2 cos exp hypot log pow sin sqrt tan abs mod rem round sign sibling-count sibling-index'); // eslint-disable-line max-len
export const colors = new Bucket(NamedColors);
export const containerFn = new Bucket('anchored( scroll-state( style(');
export const important = new Bucket('important');
/** When a value starting from "f" or "t" is added make sure to fix parser.keyframes() */
export const keyframe = new Bucket('from to contain cover entry entry-crossing exit exit-crossing scroll'); // eslint-disable-line max-len
export const layer = new Bucket('layer');
export const not = new Bucket('not');
export const notOnly = new Bucket('not only');
export const of = new Bucket('of');
export const or = new Bucket('or');
export const returns = new Bucket('returns');
export const to = new Bucket('to');

export default Bucket;
