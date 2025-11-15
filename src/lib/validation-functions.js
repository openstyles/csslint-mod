/* eslint-disable max-len */
import {pick} from './util.js';

const _ = {
  __proto__: null,
  'anchor': '<custom-prop>? && [inside|outside|top|left|right|bottom|start|end|self-start|self-end|center|<pct>] [, <len-pct>]?',
  'anchor-size': '[<custom-prop> || [width|height|block|inline|self-block|self-inline] ]? [, <len-pct>]?',
  'conic-gradient': '[ [ [ [ from <angle-zero> ]? <at-pos>? ] || <color-interpolation-method> ] , ]? [ <angular-color-stop> [, [ [<angle-pct-zero> ,]? <angular-color-stop> ]# ]? ]',
  'linear-gradient': '[ [ [ [ <angle-zero> | to [[left|right] || [top|bottom]] ] || <color-interpolation-method> ] , ]? <color-stop-list> ]?',
  'radial-gradient': '[ [ [ [ [circle|ellipse] || [<radial-extent> | <len0+> | <len-pct0+>{2}] ]? <at-pos>? ] || <color-interpolation-method> ] , ]? <color-stop-list>',
  ray: '<angle> && [<radial-extent> | sides]? && contain? && [at <position>]?',
  rect: '[ <len> | auto ]#{4} <border-radius-round>?',
  inset: '<len-pct>{1,4} <border-radius-round>?',
  xywh: '<len-pct>{2} <len-pct0+>{2} <border-radius-round>?',
};
const VTFunctions = {
  _,
  basicShape: pick(_, ['inset', 'rect', 'xywh'], {
    __proto__: null,
    circle: '<shape-radius> <at-pos>?',
    ellipse: '<shape-radius>{2}? <at-pos>?',
    path: '[ <fill-rule> , ]? <string>',
    polygon: '[ <fill-rule> , ]? [ <len-pct> <len-pct> ]#',
    shape: '[ [from|move|line|hline|vline|curve|smooth|arc] [to|by]? [<ident>|<len-pct>]+ ]#',
  }),
  color: {
    __proto__: null,
    'alpha': 'from <color> <alpha>?',
    'color-mix': '[ <color-interpolation-method> , ]? [ <color> && <pct0-100>? ]#{2}',
    'color': '[<predefined-rgb>|<xyz-space>] <num-pct-none>{3} <alpha>? | from <color> [[<predefined-rgb> [<num-pct-none>|r|g|b]{3} | <xyz-space> [<num-pct-none>|x|y|z]{3}] | [<custom-prop> <num-pct-none>+ ]] [/ [alpha|<num-pct-none>]]?',
    'hsl': '<hue> , <pct>#{2} [ , <num-pct0+> ]? | ' +
      '[ <hue> | none ] <num-pct-none>{2} <alpha>? | ' +
      'from <color> [ <hue> | <rel-hsl> ] <rel-hsl-num-pct>{2} [ / <rel-hsl-num-pct> ]?',
    'hwb': '[ <hue> | none ] <num-pct-none>{2} <alpha>? | ' +
      'from <color> [ <hue> | <rel-hwb> ] <rel-hwb-num-pct>{2} [ / <rel-hwb-num-pct> ]?',
    'lab': '<num-pct-none>{3} <alpha>? | ' +
      'from <color> <rel-lab-num-pct>{3} [ / <rel-lab-num-pct> ]?',
    'lch': '<num-pct-none>{2} [ <hue> | none ] <alpha>? | ' +
      'from <color> <rel-lch-num-pct>{2} [ <hue> | <rel-lch> ] [ / <rel-lch-num-pct> ]?',
    'light-dark': '<color>#{2}',
    'rgb': '[ <num>#{3} | <pct>#{3} ] [ , <num-pct0+> ]? | ' +
      '<num-pct-none>{3} <alpha>? | ' +
      'from <color> <rel-rgb-num-pct>{3} [ / <rel-rgb-num-pct> ]?',
  },
  cornerShape: {
    __proto__: null,
    superellipse: '<num> | infinity | -infinity',
  },
  dynaRange: {
    __proto__: null,
    'dynamic-range-limit-mix': '[ <dynamic-range> && <pct0-100> ]#{2,}',
  },
  filter: {
    __proto__: null,
    'blur': '<len>?',
    'brightness': '<num-pct>?',
    'contrast': '<num-pct>?',
    'drop-shadow': '[ <len>{2,3} && <color>? ]?',
    'grayscale': '<num-pct>?',
    'hue-rotate': '<angle-zero>?',
    'invert': '<num-pct>?',
    'opacity': '<num-pct>?',
    'saturate': '<num-pct>?',
    'sepia': '<num-pct>?',
  },
  transform: {
    __proto__: null,
    matrix: '<num>#{6}',
    matrix3d: '<num>#{16}',
    perspective: '<len0+> | none',
    rotate: '<angle-zero> | none',
    rotate3d: '<num>#{3} , <angle-zero>',
    rotateX: '<angle-zero>',
    rotateY: '<angle-zero>',
    rotateZ: '<angle-zero>',
    scale: '[ <num-pct> ]#{1,2} | none',
    scale3d: '<num-pct>#{3}',
    scaleX: '<num-pct>',
    scaleY: '<num-pct>',
    scaleZ: '<num-pct>',
    skew: '<angle-zero> [ , <angle-zero> ]?',
    skewX: '<angle-zero>',
    skewY: '<angle-zero>',
    translate: '<len-pct>#{1,2} | none',
    translate3d: '<len-pct>#{2} , <len>',
    translateX: '<len-pct>',
    translateY: '<len-pct>',
    translateZ: '<len>',
  },
};

{
  let obj = VTFunctions.color;
  for (const k of ['hsl', 'rgb']) obj[k + 'a'] = obj[k];
  for (const k of ['lab', 'lch']) obj['ok' + k] = obj[k];
  obj = VTFunctions.transform;
  for (const key in obj) {
    const low = key.toLowerCase();
    if (low !== key) Object.defineProperty(obj, low, {value: obj[key], writable: true});
  }
}
for (const key in _)
  if (key.endsWith('-gradient'))
    _['repeating-' + key] = _[key];

export default VTFunctions;
