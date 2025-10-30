import Bucket from './bucket';
import {GlobalKeywords, isOwn} from './util';
import {
  ANGLE, FUNCTION, IDENT, LENGTH, NUMBER, PCT, RESOLUTION, STRING, TIME, URANGE,
} from './tokens';

const buAlpha = new Bucket('alpha');
/** https://www.w3.org/TR/css-values-4/#custom-idents */
export const buGlobalKeywords = new Bucket(GlobalKeywords);
const buReserved = new Bucket(GlobalKeywords)
  .addFrom(['default']);
const buReservedAnim = new Bucket(GlobalKeywords)
  .addFrom(['default', 'will-change', 'auto', 'scroll-position', 'contents']);
const buReservedGrid = new Bucket(GlobalKeywords)
  .addFrom(['default', 'span', 'auto']);
const buReservedAuto = new Bucket(GlobalKeywords)
  .addFrom(['default', 'auto']);

/** @type {{[id: string]: (p: Token) => boolean}} */
const VTSimple = {
  __proto__: null,
  '<animateable-feature-name>': p => p.id === IDENT && !buReservedAnim.has(p),
  '<angle>': p => p.isCalc || p.id === ANGLE,
  '<angle-or-0>': p => p.isCalc || p.is0 || p.id === ANGLE,
  '<ascii4>': p => p.id === STRING && p.length === 4 && !/[^\x20-\x7E]/.test(p.text),
  '<attr>': p => p.isAttr,
  '<custom-ident>': p => p.id === IDENT && !buReserved.has(p),
  '<custom-prop>': p => p.type === '--' && p.id === IDENT,
  '<flex>': p => p.isCalc || p.units === 'fr' && p.number >= 0,
  '<func>': p => p.id === FUNCTION,
  '<hue>': p => p.isCalc || p.id === NUMBER || p.id === ANGLE,
  '<ident>': p => p.id === IDENT,
  '<ident-for-grid>': p => p.id === IDENT && !buReservedGrid.has(p),
  '<ident-not-none>': p => p.id === IDENT && p.type !== 'none' && !buReserved.has(p),
  '<ident-not-auto-none>': p => p.id === IDENT && p.type !== 'none' && !buReservedAuto.has(p),
  '<ie-function>': p => p.id === FUNCTION && p.type === 'ie',
  '<int>': p => p.isCalc || p.isInt,
  '<int0-1>': p => p.isCalc || p.is0 || p.isInt && p.number === 1,
  '<int0+>': p => p.isCalc || p.isInt && p.number >= 0,
  '<int1+>': p => p.isCalc || p.isInt && p.number > 0,
  '<int2-4>': p => p.isCalc || p.isInt && (p = p.number) >= 2 && p <= 4,
  '<len>': p => p.isCalc || p.is0 || p.id === LENGTH,
  '<len0+>': p => p.isCalc || p.is0 || p.id === LENGTH && p.number >= 0,
  '<len-pct>': p => p.isCalc || p.is0 || p.id === LENGTH || p.id === PCT,
  '<len-pct0+>': p => p.isCalc || p.is0 || p.number >= 0 && (p.id === PCT || p.id === LENGTH),
  '<named-or-hex-color>': p => p.type === 'color',
  '<num>': p => p.isCalc || p.id === NUMBER,
  '<num0+>': p => p.isCalc || p.id === NUMBER && p.number >= 0,
  '<num0-1>': p => p.isCalc || p.id === NUMBER && (p = p.number) >= 0 && p <= 1,
  '<num1-1000>': p => p.isCalc || p.id === NUMBER && (p = p.number) >= 1 && p <= 1000,
  '<num-pct>': p => p.isCalc || p.id === NUMBER || p.id === PCT,
  '<num-pct0+>': p => p.isCalc || p.number >= 0 && (p.id === NUMBER || p.id === PCT),
  '<num-pct-none>': p => p.isCalc || p.type === 'none' || p.id === NUMBER || p.id === PCT,
  '<pct>': p => p.isCalc || p.is0 || p.id === PCT,
  '<pct0+>': p => p.isCalc || p.is0 || p.number >= 0 && p.id === PCT,
  '<pct0-100>': p => p.isCalc || p.is0 || p.id === PCT && (p = p.number) >= 0 && p <= 100,
  '<keyframes-name>': p => p.id === STRING || p.id === IDENT && !buReserved.has(p),
  '<resolution>': p => p.id === RESOLUTION,
  '<string>': p => p.id === STRING,
  '<time>': p => p.isCalc || p.id === TIME,
  '<time0+>': p => p.isCalc || p.id === TIME && p.number >= 0,
  '<unicode-range>': p => p.id === URANGE,
  '<uri>': p => p.uri != null,
};

for (const type of ['hsl', 'hwb', 'lab', 'lch', 'rgb']) {
  const letters = {};
  for (let i = 0; i < type.length;) letters[type.charCodeAt(i++)] = 1;
  VTSimple[`<rel-${type}>`] = p => p.type === 'none'
    || (p.length === 1 ? isOwn(letters, p.code) : p.length === 5 && buAlpha.has(p));
  VTSimple[`<rel-${type}-num-pct>`] = p => p.type === 'none'
    || p.isCalc || p.id === NUMBER || p.id === PCT
    || (p.length === 1 ? isOwn(letters, p.code) : p.length === 5 && buAlpha.has(p));
}

export default VTSimple;
