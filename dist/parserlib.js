/**
 * CSS2 system colors: https://www.w3.org/TR/css3-color/#css2-system
 * CSS4 system colors: https://drafts.csswg.org/css-color-4/#css-system-colors
 */
const NamedColors = [
  'currentColor',
  'transparent',
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgrey',
  'darkgreen',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'grey',
  'green',
  'greenyellow',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgrey',
  'lightgreen',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
  'ActiveBorder',
  'ActiveCaption',
  'ActiveText',
  'AppWorkspace',
  'Background',
  'ButtonBorder',
  'ButtonFace',
  'ButtonHighlight',
  'ButtonShadow',
  'ButtonText',
  'Canvas',
  'CanvasText',
  'CaptionText',
  'Field',
  'FieldText',
  'GrayText',
  'Highlight',
  'HighlightText',
  'InactiveBorder',
  'InactiveCaption',
  'InactiveCaptionText',
  'InfoBackground',
  'InfoText',
  'LinkText',
  'Mark',
  'MarkText',
  'Menu',
  'MenuText',
  'Scrollbar',
  'ThreeDDarkShadow',
  'ThreeDFace',
  'ThreeDHighlight',
  'ThreeDLightShadow',
  'ThreeDShadow',
  'VisitedText',
  'Window',
  'WindowFrame',
  'WindowText',
];

const GlobalKeywords = ['initial', 'inherit', 'revert', 'unset'];
const {assign, defineProperty: define} = Object;
const PDESC = {configurable: true, enumerable: true, writable: true, value: null};
const isOwn = Object.call.bind({}.hasOwnProperty);
const pick = (obj, keys, dst = {}) => {
  for (const k of keys) dst[k] = obj[k];
  return dst;
};
const rxUnescapeLF = /\\(?:(?:([0-9a-fA-F]{1,6})|(.))[\t ]?|(\n))/g;
const unescapeLF = (m, code, char, LF) =>
  LF ? '' : char || String.fromCodePoint(parseInt(code, 16));
const parseString = str => str.slice(1, -1).replace(rxUnescapeLF, unescapeLF);
const toLowAscii = c => c >= 65 && c <= 90 ? c + 32 : c;

class EventDispatcher {
  constructor() {
    /** @type {Record<string,Set>} */
    this._listeners = {__proto__: null};
  }
  addListener(type, fn) {
    (this._listeners[type] || (this._listeners[type] = new Set())).add(fn);
  }
  fire(event) {
    const type = typeof event === 'object' && event.type;
    const list = this._listeners[type || event];
    if (!list) return;
    if (!type) event = {type};
    list.forEach(fn => fn(event));
  }
  removeListener(type, fn) {
    const list = this._listeners[type];
    if (list) list.delete(fn);
  }
}

class ParseError extends Error {
  constructor(message, pos) {
    super();
    this.name = this.constructor.name;
    this.col = pos.col;
    this.line = pos.line;
    this.offset = pos.offset;
    this.message = message;
  }
}

function clipString(s, len = 30) {
  return (s = `${s}`).length > len ? s.slice(0, len) + '...' : s;
}

/** Much faster than flat array or regexp */
class Bucket {
  constructor(src) {
    this.addFrom(src);
  }

  /**
   * @param {string|string[]} src - length < 100
   * @return {Bucket}
   */
  addFrom(src) {
    for (let str of typeof src === 'string' ? [src] : src) {
      let c = (str = str.toLowerCase()).charCodeAt(0);
      if (c === 34 /* " */) c = (str = str.slice(1, -1)).charCodeAt(0);
      src = this[c = c * 100 + str.length];
      if (src == null) this[c] = str;
      else if (typeof src === 'string') this[c] = [src, str];
      else src.push(str);
    }
    return this;
  }

  /** @return {string} */
  join(sep) {
    let res = '';
    for (const v of Object.values(this)) {
      res += `${res ? sep : ''}${typeof v === 'string' ? v : v.join(sep)}`;
    }
    return res;
  }

  /**
   * @param {Token} tok
   * @param {number} [c] - first char code
   * @param {string} [lowText] - text to use instead of token's text
   * @return {boolean | any}
   */
  has(tok, c = tok.code, lowText) {
    const len = (lowText || tok).length;
    if (!isOwn(this, c = c * 100 + len)) return false;
    if (len === 1) return true;
    const val = this[c];
    const low = lowText || (tok.lowText ??= tok.text.toLowerCase());
    return typeof val === 'string' ? val === low : val.includes(low);
  }
}

const B = /** @type {{[key:string]: Bucket}} */ {
  attrIS: ['i', 's', ']'], // "]" is to improve the error message,
  calc: ['abs', 'calc', 'calc-size', 'clamp', 'if', 'min', 'max', 'mod',
    'progress', 'rem', 'round', 'sign'],
  colors: NamedColors,
  containerFn: ['scroll-state(', 'style('],
  marginSyms: [
    'bottom-center', 'bottom-left-corner', 'bottom-left', 'bottom-right-corner', 'bottom-right',
    'left-bottom', 'left-middle', 'left-top',
    'right-bottom', 'right-middle', 'right-top',
    'top-center', 'top-left-corner', 'top-left', 'top-right-corner', 'top-right',
  ],
  // autogenerated:
  and: null,
  andNoneNotOr: null,
  andOr: null,
  auto: null,
  evenOdd: null,
  fromTo: null,
  important: null,
  layer: null,
  n: null,
  none: null,
  not: null,
  notOnly: null,
  of: null,
  or: null,
  returns: null,
  to: null,
};
for (const k in B)
  B[k] = new Bucket(B[k] || k.split(/(?=[A-Z])/)); // splitting by an Uppercase A-Z letter

const Combinators = [];
/*  \t   */ Combinators[9] =
/*  \n   */ Combinators[10] =
/*  \f   */ Combinators[12] =
/*  \r   */ Combinators[13] =
/*  " "  */ Combinators[32] = 'descendant';
/*   >   */ Combinators[62] = 'child';
/*   +   */ Combinators[43] = 'adjacent-sibling';
/*   ~   */ Combinators[126] = 'sibling';
/*  ||   */ Combinators[124] = 'column';

/* eslint-disable max-len */

const Properties = {
  __proto__: null,
  'accent-color': 'auto | <color>',
  'align-items': 'normal | stretch | anchor-center | <baseline-position> | <overflow-position>? <self-position>',
  'align-content': 'normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>',
  'align-self': 'auto | <align-items>',
  'all': GlobalKeywords.join('|'),
  'alignment-baseline': 'auto | baseline | use-script | before-edge | text-before-edge | ' +
    'after-edge | text-after-edge | central | middle | ideographic | alphabetic | ' +
    'hanging | mathematical',
  'anchor-name': 'none | <custom-prop>#',
  'anchor-scope': 'none | all | <custom-prop>#',
  'animation': '[ <time0+> || <timing-function> || <time> || [ infinite | <num0+> ] || ' +
    '<animation-direction> || <animation-fill-mode> || ' +
    '[ running | paused ] || [ none | <custom-ident> | <string> ] || <animation-timeline> ]#',
  'animation-composition': '[ replace | add | accumulate ]#',
  'animation-delay': '<time>#',
  'animation-direction': '<animation-direction>#',
  'animation-duration': '[ auto | <time0+> ]#',
  'animation-fill-mode': '<animation-fill-mode>#',
  'animation-iteration-count': '[ <num> | infinite ]#',
  'animation-name': '[ none | <keyframes-name> ]#',
  'animation-play-state': '[ running | paused ]#',
  'animation-timeline': '<animation-timeline>#',
  'animation-timing-function': '<timing-function>#',
  'appearance': 'none | auto',
  '-moz-appearance': 'none | button | button-arrow-down | button-arrow-next | button-arrow-previous | button-arrow-up | button-bevel | button-focus | caret | checkbox | checkbox-container | checkbox-label | checkmenuitem | dualbutton | groupbox | listbox | listitem | menuarrow | menubar | menucheckbox | menuimage | menuitem | menuitemtext | menulist | menulist-button | menulist-text | menulist-textfield | menupopup | menuradio | menuseparator | meterbar | meterchunk | progressbar | progressbar-vertical | progresschunk | progresschunk-vertical | radio | radio-container | radio-label | radiomenuitem | range | range-thumb | resizer | resizerpanel | scale-horizontal | scalethumbend | scalethumb-horizontal | scalethumbstart | scalethumbtick | scalethumb-vertical | scale-vertical | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | separator | sheet | spinner | spinner-downbutton | spinner-textfield | spinner-upbutton | splitter | statusbar | statusbarpanel | tab | tabpanel | tabpanels | tab-scroll-arrow-back | tab-scroll-arrow-forward | textfield | textfield-multiline | toolbar | toolbarbutton | toolbarbutton-dropdown | toolbargripper | toolbox | tooltip | treeheader | treeheadercell | treeheadersortarrow | treeitem | treeline | treetwisty | treetwistyopen | treeview | -moz-mac-unified-toolbar | -moz-win-borderless-glass | -moz-win-browsertabbar-toolbox | -moz-win-communicationstext | -moz-win-communications-toolbox | -moz-win-exclude-glass | -moz-win-glass | -moz-win-mediatext | -moz-win-media-toolbox | -moz-window-button-box | -moz-window-button-box-maximized | -moz-window-button-close | -moz-window-button-maximize | -moz-window-button-minimize | -moz-window-button-restore | -moz-window-frame-bottom | -moz-window-frame-left | -moz-window-frame-right | -moz-window-titlebar | -moz-window-titlebar-maximized',
  '-webkit-appearance': 'auto | none | button | button-bevel | caps-lock-indicator | caret | checkbox | default-button | listbox | listitem | media-fullscreen-button | media-mute-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | push-button | radio | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbargripper-horizontal | scrollbargripper-vertical | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical',
  'aspect-ratio': 'auto || <ratio>',

  'backdrop-filter': '<filter-function-list> | none',
  'backface-visibility': '<vis-hid>',
  'background': '[ <bg-layer> , ]* <final-bg-layer>',
  'background-attachment': '<attachment>#',
  'background-blend-mode': '<blend-mode>',
  'background-clip': '[ <box> | text ]#',
  'background-color': '<color>',
  'background-image': '<bg-image>#',
  'background-origin': '<box>#',
  'background-position': '<bg-position>#',
  'background-position-x': '[ center | [ left | right ]? <len-pct>? ]#',
  'background-position-y': '[ center | [ top | bottom ]? <len-pct>? ]#',
  'background-repeat': '<repeat-style>#',
  'background-size': '<bg-size>#',
  'baseline-shift': 'baseline | sub | super | <len-pct>',
  'baseline-source': 'auto | first | last',
  'block-size': '<width>',
  'border-collapse': 'collapse | separate',
  'border-image': '<border-image-source> || <border-image-slice> ' +
    '[ / <border-image-width> | / <border-image-width>? / <border-image-outset> ]? || ' +
    '<border-image-repeat>',
  'border-image-outset': '[ <len0+> | <num0+> ]{1,4}',
  'border-image-repeat': '[ stretch | repeat | round | space ]{1,2}',
  'border-image-slice': '<border-image-slice>',
  'border-image-source': '<image> | none',
  'border-image-width': '[ <len-pct0+> | <num0+> | auto ]{1,4}',
  'border-spacing': '<len>{1,2}',
  //#region border shorthand
  'border': '<border-shorthand>',
  'border-block': '<border-shorthand>',
  'border-block-end': '<border-shorthand>',
  'border-block-start': '<border-shorthand>',
  'border-bottom': '<border-shorthand>',
  'border-inline': '<border-shorthand>',
  'border-inline-end': '<border-shorthand>',
  'border-inline-start': '<border-shorthand>',
  'border-left': '<border-shorthand>',
  'border-right': '<border-shorthand>',
  'border-top': '<border-shorthand>',
  //#endregion
  //#region border color
  'border-color': '<color>{1,4}',
  'border-block-color': '<color>{1,2}',
  'border-block-end-color': '<color>',
  'border-block-start-color': '<color>',
  'border-bottom-color': '<color>',
  'border-inline-color': '<color>{1,2}',
  'border-inline-end-color': '<color>',
  'border-inline-start-color': '<color>',
  'border-left-color': '<color>',
  'border-right-color': '<color>',
  'border-top-color': '<color>',
  //#endregion
  //#region border style
  'border-block-end-style': '<border-style>',
  'border-block-start-style': '<border-style>',
  'border-block-style': '<border-style>{1,2}',
  'border-bottom-style': '<border-style>',
  'border-inline-end-style': '<border-style>',
  'border-inline-start-style': '<border-style>',
  'border-inline-style': '<border-style>{1,2}',
  'border-left-style': '<border-style>',
  'border-right-style': '<border-style>',
  'border-style': '<border-style>{1,4}',
  'border-top-style': '<border-style>',
  //#endregion
  //#region border width
  'border-width': '<border-width>{1,4}',
  'border-block-end-width': '<border-width>',
  'border-block-start-width': '<border-width>',
  'border-block-width': '<border-width>{1,2}',
  'border-bottom-width': '<border-width>',
  'border-inline-end-width': '<border-width>',
  'border-inline-start-width': '<border-width>',
  'border-inline-width': '<border-width>{1,2}',
  'border-left-width': '<border-width>',
  'border-right-width': '<border-width>',
  'border-top-width': '<border-width>',
  //#endregion
  //#region border radius (shorthands)
  'border-radius': '<len-pct0+>{1,4} [ / <len-pct0+>{1,4} ]?',
  'border-block-end-radius': '<border-top-radius>',
  'border-block-start-radius': '<border-top-radius>',
  'border-bottom-radius': '<border-top-radius>',
  'border-inline-end-radius': '<border-top-radius>',
  'border-inline-start-radius': '<border-top-radius>',
  'border-left-radius': '<border-top-radius>',
  'border-right-radius': '<border-top-radius>',
  'border-top-radius': '<len-pct0+>{1,2} [ / <len-pct0+>{1,2} ]?',
  //#endregion
  //#region border radius (single)
  'border-bottom-left-radius': '<len-pct>{1,2}',
  'border-bottom-right-radius': '<len-pct>{1,2}',
  'border-end-end-radius': '<len-pct>{1,2}',
  'border-end-start-radius': '<len-pct>{1,2}',
  'border-start-end-radius': '<len-pct>{1,2}',
  'border-start-start-radius': '<len-pct>{1,2}',
  'border-top-left-radius': '<len-pct>{1,2}',
  'border-top-right-radius': '<len-pct>{1,2}',
  //#endregion
  'bottom': '<top>',
  'box-decoration-break': 'slice | clone',
  'box-shadow': 'none | <shadow>#',
  'box-sizing': 'content-box | border-box',
  'break-after': '<break-inside> | always | left | right | page | column',
  'break-before': '<break-after>',
  'break-inside': 'auto | avoid | avoid-page | avoid-column',

  'caret': '<caret-color> || <caret-animation> || <caret-shape>',
  'caret-animation': 'auto | manual',
  'caret-color': 'auto | <color>',
  'caret-shape': 'auto | bar | block | underscore',
  'caption-side': 'top | bottom | inline-start | inline-end',
  'clear': 'none | right | left | both | inline-start | inline-end',
  'clip': 'rect() | auto',
  'clip-path': '<url> | [ <basic-shape> || <geometry-box> ] | none',
  'clip-rule': '<fill-rule>',
  'color': '<color>',
  'color-interpolation': 'auto | sRGB | linearRGB',
  'color-interpolation-filters': '<color-interpolation>',
  'color-profile': 1,
  'color-rendering': 'auto | optimizeSpeed | optimizeQuality',
  'color-scheme': 'normal | [ light | dark | <custom-ident> ]+ && only?',
  'column-count': '<int> | auto',
  'column-fill': 'auto | balance',
  'column-gap': 'normal | <len-pct>',
  'column-rule': '<border-shorthand>',
  'column-rule-color': '<color>',
  'column-rule-style': '<border-style>',
  'column-rule-width': '<border-width>',
  'column-span': 'none | all',
  'column-width': '<len> | auto',
  'columns': 1,
  'contain': 'none | strict | content | [ size || layout || style || paint ]',
  'contain-intrinsic-block-size': '<contain-intrinsic>',
  'contain-intrinsic-height': '<contain-intrinsic>',
  'contain-intrinsic-inline-size': '<contain-intrinsic>',
  'contain-intrinsic-size': '<contain-intrinsic>{1,2}',
  'contain-intrinsic-width': '<contain-intrinsic>',
  'container': '<container-name> [ / <container-type> ]?',
  'container-name': 'none | <ident-not-none>+',
  'container-type': 'normal || [ size | inline-size ]',
  'content': 'normal | none | <content-list> [ / <string> ]?',
  'content-visibility': 'auto | <vis-hid>',
  //#region corner (shorthands)
  'corner': '<border-radius> || <corner-shape>',
  'corner-top': '<border-top-radius> || <corner-top-shape>',
  'corner-bottom': '<corner-top>',
  'corner-left': '<corner-top>',
  'corner-right': '<corner-top>',
  'corner-block-start': '<corner-top>',
  'corner-block-end': '<corner-top>',
  'corner-inline-start': '<corner-top>',
  'corner-inline-end': '<corner-top>',
  //#endregion
  //#region corner (single)
  'corner-top-left': '<border-top-left-radius> || <corner-top-left-shape>',
  'corner-top-right': '<corner-top-left>',
  'corner-bottom-left': '<corner-top-left>',
  'corner-bottom-right': '<corner-top-left>',
  'corner-end-end': '<corner-top-left>',
  'corner-end-start': '<corner-top-left>',
  'corner-start-end': '<corner-top-left>',
  'corner-start-start': '<corner-top-left>',
  //#endregion
  //#region corner shape (shorthands)
  'corner-shape': '<corner-shape-value>{1,4}',
  'corner-top-shape': '<corner-shape-value>{1,2}',
  'corner-block-end-shape': '<corner-top-shape>',
  'corner-block-start-shape': '<corner-top-shape>',
  'corner-bottom-shape': '<corner-top-shape>',
  'corner-inline-end-shape': '<corner-top-shape>',
  'corner-inline-start-shape': '<corner-top-shape>',
  'corner-left-shape': '<corner-top-shape>',
  'corner-right-shape': '<corner-top-shape>',
  //#endregion
  //#region corner shape (single)
  'corner-bottom-left-shape': '<corner-shape-value>',
  'corner-bottom-right-shape': '<corner-shape-value>',
  'corner-end-end-shape': '<corner-shape-value>',
  'corner-end-start-shape': '<corner-shape-value>',
  'corner-start-end-shape': '<corner-shape-value>',
  'corner-start-start-shape': '<corner-shape-value>',
  'corner-top-left-shape': '<corner-shape-value>',
  'corner-top-right-shape': '<corner-shape-value>',
  //#endregion
  'counter-increment': '<counter>',
  'counter-reset': '<counter>',
  'counter-set': '<counter>',
  'cursor': '[ [ <url> | image-set() ] [ <num> <num> ]? , ]* ' +
    '[ auto | default | none | context-menu | help | pointer | progress | wait | ' +
    'cell | crosshair | text | vertical-text | alias | copy | move | no-drop | ' +
    'not-allowed | grab | grabbing | e-resize | n-resize | ne-resize | nw-resize | ' +
    's-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | ' +
    'nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | ' +
    'zoom-in | zoom-out ]',
  'cx': '<x>',
  'cy': '<x>',

  'd': 1,
  'direction': 'ltr | rtl',
  'display': '[ <display-outside> || <display-inside> ] | ' +
    '<display-listitem> | <display-internal> | <display-box> | <display-legacy> | ' +
    '-webkit-box | -webkit-inline-box | -ms-flexbox', // deprecated and nonstandard
  'dominant-baseline': 'auto | text-bottom | alphabetic | ideographic | middle | central | ' +
    'mathematical | hanging | text-top',
  'dynamic-range-limit': '<dynamic-range> | <fn:dynaRange>',

  'empty-cells': 'show | hide',

  'field-sizing': 'fixed | content',
  'fill': '<paint>',
  'fill-opacity': '<num0-1>',
  'fill-rule': 'nonzero | evenodd',
  'filter': '<filter-function-list> | <ie-function> | none',
  'flex': 'none | [ <num>{1,2} || <flex-basis> ]',
  'flex-basis': 'content | <width>',
  'flex-direction': 'row | row-reverse | column | column-reverse',
  'flex-flow': '<flex-direction> || <flex-wrap>',
  'flex-grow': '<num>',
  'flex-shrink': '<num>',
  'flex-wrap': 'nowrap | wrap | wrap-reverse',
  'float': 'left | right | none | inline-start | inline-end',
  'flood-color': 1,
  'flood-opacity': '<num0-1>',
  // matching no-pct first because Matcher doesn't retry for a longer match in nested definitions
  'font': '<font-short-tweak-no-pct>? <font-short-core> | ' +
    '[ <font-short-tweak-no-pct> || <pct> ]? <font-short-core> | ' +
    'caption | icon | menu | message-box | small-caption | status-bar',
  'font-family': '[ <generic-family> | <family-name> ]#',
  'font-feature-settings': '[ <ascii4> [ <int0+> | on | off ]? ]# | normal',
  'font-kerning': 'auto | normal | none',
  'font-language-override': 'normal | <string>',
  'font-optical-sizing': 'auto | none',
  'font-palette': 'none | normal | light | dark | <custom-ident>',
  'font-size': '<absolute-size> | <relative-size> | <len-pct0+>',
  'font-size-adjust': 'none | [ex-height|cap-height|ch-width|ic-width|ic-height]? [from-font|<num0+>]',
  'font-stretch': '<font-stretch-named> | <pct>',
  'font-style': 'normal | italic | oblique <angle>?',
  'font-synthesis': 'none | [ weight || style ]',
  'font-synthesis-style': 'auto | none',
  'font-synthesis-weight': 'auto | none',
  'font-synthesis-small-caps': 'auto | none',
  'font-variant': 'normal | none | [ ' +
    '<font-variant-ligatures> || <font-variant-alternates> || ' +
    '<font-variant-caps> || <font-variant-numeric> || <font-variant-east-asian> ]',
  'font-variant-alternates': '<font-variant-alternates> | normal',
  'font-variant-caps': '<font-variant-caps> | normal',
  'font-variant-east-asian': '<font-variant-east-asian> | normal',
  'font-variant-emoji': 'auto | text | emoji | unicode',
  'font-variant-ligatures': '<font-variant-ligatures> | normal | none',
  'font-variant-numeric': '<font-variant-numeric> | normal',
  'font-variant-position': 'normal | sub | super',
  'font-variation-settings': 'normal | [ <string> <num> ]#',
  'font-weight': 'normal | bold | bolder | lighter | <num1-1000>',
  'forced-color-adjust': 'auto | none | preserve-parent-color',

  'gap': '<column-gap>{1,2}',
  'grid':
    '<grid-template> | <grid-template-rows> / [ auto-flow && dense? ] <grid-auto-columns>? | ' +
    '[ auto-flow && dense? ] <grid-auto-rows>? / <grid-template-columns>',
  'grid-area': '<grid-line> [ / <grid-line> ]{0,3}',
  'grid-auto-columns': '<track-size>+',
  'grid-auto-flow': '[ row | column ] || dense',
  'grid-auto-rows': '<track-size>+',
  'grid-column': '<grid-line> [ / <grid-line> ]?',
  'grid-column-end': '<grid-line>',
  'grid-column-gap': -1,
  'grid-column-start': '<grid-line>',
  'grid-gap': -1,
  'grid-row': '<grid-line> [ / <grid-line> ]?',
  'grid-row-end': '<grid-line>',
  'grid-row-gap': -1,
  'grid-row-start': '<grid-line>',
  'grid-template': 'none | [ <grid-template-rows> / <grid-template-columns> ] | ' +
    '[ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?',
  'grid-template-areas': 'none | <string>+',
  'grid-template-columns': '<grid-template-rows>',
  'grid-template-rows': 'none | <track-list> | <auto-track-list> | ' +
    'subgrid [ <line-names> | repeat( [ <int1+> | auto-fill ] , <line-names>+ ) ]*',

  'hanging-punctuation': 'none | [ first || [ force-end | allow-end ] || last ]',
  'height': '<width>',
  'hyphenate-character': '<string> | auto',
  'hyphenate-limit-chars': '[ auto | <int> ]{1,3}',
  'hyphens': 'none | manual | auto',

  'image-orientation': 'from-image | none | [ <angle> || flip ]',
  'image-rendering': 'auto | smooth | high-quality | crisp-edges | pixelated | ' +
    'optimizeSpeed | optimizeQuality | -webkit-optimize-contrast',
  'image-resolution': 1,
  'inline-size': '<width>',
  'inset': '<top>{1,4}',
  'inset-block': '<top>{1,2}',
  'inset-block-end': '<top>',
  'inset-block-start': '<top>',
  'inset-inline': '<top>{1,2}',
  'inset-inline-end': '<top>',
  'inset-inline-start': '<top>',
  'interactivity': 'auto | inert',
  'interpolate-size': 'numeric-only | allow-keywords',
  'isolation': 'auto | isolate',

  'justify-content': 'normal | <content-distribution> | ' +
    '<overflow-position>? [ <content-position> | left | right ]',
  'justify-items': 'normal | stretch | anchor-center | <baseline-position> | [ <overflow-position>? <self-position> ] | [ legacy || [ left | right | center ] ]',
  'justify-self': 'auto | normal | stretch | anchor-center | <baseline-position> | <overflow-position>? [ <self-position> | left | right ]',

  'left': '<top>',
  'letter-spacing': '<len> | normal',
  'lighting-color': '<color>',
  'line-height': '<line-height>',
  'line-break': 'auto | loose | normal | strict | anywhere',
  'list-style': '<list-style-position> || <list-style-image> || <list-style-type>',
  'list-style-image': '<image> | none',
  'list-style-position': 'inside | outside',
  'list-style-type': '<string> | disc | circle | square | decimal | decimal-leading-zero | ' +
    'lower-roman | upper-roman | lower-greek | lower-latin | upper-latin | armenian | ' +
    'georgian | lower-alpha | upper-alpha | none | symbols()',

  'math-depth': 'auto-add | add(<int>) | <int>',
  'math-shift': '<math-style>',
  'math-style': 'normal | compact',
  'margin': '<top>{1,4}',
  'margin-top': '<top>',
  'margin-bottom': '<top>',
  'margin-left': '<top>',
  'margin-right': '<top>',
  'margin-block': '<top>{1,2}',
  'margin-block-end': '<top>',
  'margin-block-start': '<top>',
  'margin-inline': '<top>{1,2}',
  'margin-inline-end': '<top>',
  'margin-inline-start': '<top>',
  'marker': -1,
  'marker-end': 1,
  'marker-mid': 1,
  'marker-start': 1,
  'mask': '[ [ none | <image> ] || <position> [ / <bg-size> ]? || <repeat-style> || ' +
    '<geometry-box> || [ <geometry-box> | no-clip ] || ' +
    '<compositing-operator> || <masking-mode> ]#',
  'mask-border': '<mask-border-source> ||' +
    '<mask-border-slice> [ / <mask-border-width>? [ / <mask-border-outset> ]? ]? ||' +
    '<mask-border-repeat> || <mask-border-mode>',
  'mask-border-mode': '<mask-type>',
  'mask-border-outset': '[ <len> | <num> ]{1,4}',
  'mask-border-repeat': '[ stretch | repeat | round | space ]{1,2}',
  'mask-border-slice': '<num-pct>{1,4} fill?',
  'mask-border-source': 'none | <image>',
  'mask-border-width': '[ <len-pct> | <num> | auto ]{1,4}',
  'mask-clip': '[ <coord-box> | no-clip ]#',
  'mask-composite': '<compositing-operator>#',
  'mask-image': '[ none | <image> ]#',
  'mask-mode': '<masking-mode>#',
  'mask-origin': '<coord-box>#',
  'mask-position': '<position>#',
  'mask-repeat': '<repeat-style>#',
  'mask-size': '<bg-size>#',
  'mask-type': 'luminance | alpha',
  'max-height': '<max-width>',
  'max-width': 'none | <width-base>',
  'min-height': '<width>',
  'min-width': '<width>',
  'max-block-size': '<max-width>',
  'max-inline-size': '<max-width>',
  'min-block-size': '<width>',
  'min-inline-size': '<width>',
  'mix-blend-mode': '<blend-mode>',

  'object-fit': 'fill | contain | cover | none | scale-down',
  'object-position': '<position>',
  'object-view-box': 'none | inset() | rect() | xywh()',
  'offset':
    '[ <offset-position>? <offset-path> [<len-pct> || <offset-rotate>]? | <offset-position> ] ' +
    '[ / <offset-anchor> ]?',
  'offset-anchor': 'auto | <position>',
  'offset-distance': '<len-pct>',
  'offset-path': 'none | [ ray() | <url> | <basic-shape> ] || <coord-box>',
  'offset-position': 'auto | <position>',
  'offset-rotate': '[ auto | reverse ] || <angle>',
  'opacity': '<num0-1> | <pct>',
  'order': '<int>',
  'orphans': '<int>',
  'outline': '[ <color> | invert ] || [ auto | <border-style> ] || <border-width>',
  'outline-color': '<color> | invert',
  'outline-offset': '<len>',
  'outline-style': '<border-style> | auto',
  'outline-width': '<border-width>',
  'overflow': '<overflow>{1,2}',
  'overflow-anchor': 'auto | none',
  'overflow-block': '<overflow>',
  'overflow-clip-margin': 'visual-box | <len0+>',
  'overflow-inline': '<overflow>',
  'overflow-wrap': 'normal | break-word | anywhere',
  'overflow-x': '<overflow>',
  'overflow-y': '<overflow>',
  'overscroll-behavior': '<overscroll>{1,2}',
  'overscroll-behavior-block': '<overscroll>',
  'overscroll-behavior-inline': '<overscroll>',
  'overscroll-behavior-x': '<overscroll>',
  'overscroll-behavior-y': '<overscroll>',

  'padding': '<len-pct0+>{1,4}',
  'padding-block': '<len-pct0+>{1,2}',
  'padding-block-end': '<len-pct0+>',
  'padding-block-start': '<len-pct0+>',
  'padding-bottom': '<len-pct0+>',
  'padding-inline': '<len-pct0+>{1,2}',
  'padding-inline-end': '<len-pct0+>',
  'padding-inline-start': '<len-pct0+>',
  'padding-left': '<len-pct0+>',
  'padding-right': '<len-pct0+>',
  'padding-top': '<len-pct0+>',
  'page': 'auto | <custom-ident>',
  'page-break-after': 'auto | always | avoid | left | right | recto | verso',
  'page-break-before': '<page-break-after>',
  'page-break-inside': 'auto | avoid',
  'paint-order': 'normal | [ fill || stroke || markers ]',
  'perspective': 'none | <len0+>',
  'perspective-origin': '<position>',
  'place-content': '<align-content> <justify-content>?',
  'place-items': '[ normal | stretch | <baseline-position> | <self-position> ] ' +
    '[ normal | stretch | <baseline-position> | <self-position> ]?',
  'place-self': '<align-self> <justify-self>?',
  'pointer-events': 'auto | none | visiblePainted | visibleFill | visibleStroke | visible | ' +
    'painted | fill | stroke | all',
  'position': 'static | relative | absolute | fixed | sticky',
  'position-anchor': 'auto | <custom-prop>',
  'position-area': 'auto | <position-area>',
  'position-try': '<position-try-order>? <position-try-fallbacks>',
  'position-try-order': 'normal | most-width | most-height | most-block-size | most-inline-size',
  'position-try-fallbacks': 'none | [<custom-prop> || flip-block || flip-inline || flip-start | <position-area> ]#',
  'position-visibility': 'always | [ anchors-valid || anchors-visible || no-overflow ]',
  'print-color-adjust': 'economy | exact',

  'quotes': 1,

  'r': 1, // SVG
  'rx': '<x> | auto', // SVG
  'ry': '<rx>', // SVG
  'reading-flow': 'normal|source-order|flex-visual|flex-flow|grid-rows|grid-columns|grid-order',
  'reading-order': '<int>',
  'rendering-intent': 1, // SVG
  'resize': 'none | both | horizontal | vertical | block | inline',
  'right': '<top>',
  'rotate': 'none | [ x | y | z | <num>{3} ]? && <angle>',
  'row-gap': '<column-gap>',
  'ruby-align': 'start | center | space-between | space-around',
  'ruby-position': 'alternate || [over|under] | inter-character',

  'scale': 'none | <num-pct>{1,3}',
  'scroll-behavior': 'auto | smooth',
  'scroll-margin': '<len>{1,4}',
  'scroll-margin-bottom': '<len>',
  'scroll-margin-left': '<len>',
  'scroll-margin-right': '<len>',
  'scroll-margin-top': '<len>',
  'scroll-margin-block': '<len>{1,2}',
  'scroll-margin-block-end': '<len>',
  'scroll-margin-block-start': '<len>',
  'scroll-margin-inline': '<len>{1,2}',
  'scroll-margin-inline-end': '<len>',
  'scroll-margin-inline-start': '<len>',
  'scroll-padding': '<top>{1,4}',
  'scroll-padding-left': '<top>',
  'scroll-padding-right': '<top>',
  'scroll-padding-top': '<top>',
  'scroll-padding-bottom': '<top>',
  'scroll-padding-block': '<top>{1,2}',
  'scroll-padding-block-end': '<top>',
  'scroll-padding-block-start': '<top>',
  'scroll-padding-inline': '<top>{1,2}',
  'scroll-padding-inline-end': '<top>',
  'scroll-padding-inline-start': '<top>',
  'scroll-snap-align': '[ none | start | end | center ]{1,2}',
  'scroll-snap-stop': 'normal | always',
  'scroll-snap-type': 'none | [ x | y | block | inline | both ] [ mandatory | proximity ]?',
  'scroll-target-group': 'none | auto',
  'scroll-timeline': '[ <scroll-timeline-name> ' +
    '[ <scroll-timeline-axis> || <scroll-timeline-attachment> ]? ]#',
  'scroll-timeline-attachment': '[ local | defer | ancestor ]#',
  'scroll-timeline-axis': '<axis>#',
  'scroll-timeline-name': 'none | <custom-ident>#',
  'scrollbar-color': 'auto | dark | light | <color>{2}',
  'scrollbar-gutter': 'auto | stable && both-edges?',
  'scrollbar-width': 'auto | thin | none',
  'shape-image-threshold': '<num-pct>',
  'shape-margin': '<len-pct>',
  'shape-rendering': 'auto | optimizeSpeed | crispEdges | geometricPrecision',
  'shape-outside': 'none | [ <basic-shape> || <shape-box> ] | <image>',
  'speak': 'auto | never | always',
  'stop-color': 1,
  'stop-opacity': '<num0-1>',
  'stroke': '<paint>',
  'stroke-dasharray': 'none | <dasharray>',
  'stroke-dashoffset': '<len-pct> | <num>',
  'stroke-linecap': 'butt | round | square',
  'stroke-linejoin': 'miter | miter-clip | round | bevel | arcs',
  'stroke-miterlimit': '<num0+>',
  'stroke-opacity': '<num0-1>',
  'stroke-width': '<len-pct> | <num>',

  'table-layout': 'auto | fixed',
  'tab-size': '<num> | <len>',
  'text-align': '<text-align> | justify-all',
  'text-align-last': '<text-align> | auto',
  'text-anchor': 'start | middle | end',
  'text-autospace': 'normal | <autospace> | auto',
  'text-box': 'normal | <text-box-trim> || <text-box-edge>',
  'text-box-edge': 'auto | text | [text|cap|ex] [text|alphabetic]',
  'text-box-trim': 'none | trim-start | trim-end | trim-both',
  'text-combine-upright': 'none | all | [ digits <int2-4>? ]',
  'text-decoration': '<text-decoration-line> || <text-decoration-style> || <color>',
  'text-decoration-color': '<color>',
  'text-decoration-line': 'none | [ underline || overline || line-through || blink ]',
  'text-decoration-skip': 'none | auto',
  'text-decoration-skip-ink': 'none | auto | all',
  'text-decoration-style': 'solid | double | dotted | dashed | wavy',
  'text-decoration-thickness': 'auto | from-font | <len-pct>',
  'text-emphasis': '<text-emphasis-style> || <color>',
  'text-emphasis-color': '<color>',
  'text-emphasis-style': 'none | <string> | ' +
    '[ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ]',
  'text-emphasis-position': '[ over | under ] && [ right | left ]?',
  'text-indent': '<len-pct> && hanging? && each-line?',
  'text-justify': 'auto | none | inter-word | inter-character',
  'text-orientation': 'mixed | upright | sideways',
  'text-overflow': 'clip | ellipsis',
  'text-rendering': 'auto | optimizeSpeed | optimizeLegibility | geometricPrecision',
  'text-shadow': 'none | [ <color>? && <len>{2,3} ]#',
  'text-size-adjust': 'auto | none | <pct0+>',
  'text-spacing-trim': 'auto|space-all|normal|space-first|trim-start|trim-both|trim-all',
  'text-transform': 'none | math-auto | ' +
    '[ capitalize|uppercase|lowercase ] || full-width || full-size-kana',
  'text-underline-offset': '<len-pct> | auto',
  'text-underline-position': 'auto | [ under || [ left | right ] ]',
  'text-wrap': 'wrap | nowrap | balance | stable | pretty',
  'text-wrap-mode': 'wrap | nowrap',
  'text-wrap-style': 'auto | balance | stable | pretty',
  'top': 'auto | <len-pct> | anchor() | anchor-size()',
  'touch-action': 'auto|none|pan-x|pan-y|pan-left|pan-right|pan-up|pan-down|manipulation',
  'transform': 'none | <fn:transform>+',
  'transform-box': 'content-box | border-box | fill-box | stroke-box | view-box',
  'transform-origin': '[ left | center | right | <len-pct> ] ' +
    '[ top | center | bottom | <len-pct> ] <len>? | ' +
    '[ left | center | right | top | bottom | <len-pct> ] | ' +
    '[ [ center | left | right ] && [ center | top | bottom ] ] <len>?',
  'transform-style': 'flat | preserve-3d',
  'transition': '[ [ none | [ all | <custom-ident> ]# ] || <time> || <timing-function> || <time> || <txbhv> ]#',
  'transition-behavior': '<txbhv>#',
  'transition-delay': '<time>#',
  'transition-duration': '<time>#',
  'transition-property': 'none | [ all | <custom-ident> ]#',
  'transition-timing-function': '<timing-function>#',
  'translate': 'none | <len-pct> [ <len-pct> <len>? ]?',

  'unicode-range': '<unicode-range>#',
  'unicode-bidi': 'normal | embed | isolate | bidi-override | isolate-override | plaintext',
  'user-select': 'auto | text | none | contain | all',

  'vertical-align': 'auto | use-script | baseline | sub | super | top | text-top | ' +
    'central | middle | bottom | text-bottom | <len-pct>',
  'view-transition-class': 'none | <ident-not-none>+',
  'view-transition-name': 'none | auto | match-element | <custom-ident>',
  'visibility': '<vis-hid> | collapse',

  'white-space': 'normal | pre | pre-wrap | pre-line | <white-space-collapse> || <text-wrap-mode>',
  'white-space-collapse': 'collapse|discard|preserve|preserve-breaks|preserve-spaces|break-spaces',
  'widows': '<int>',
  'width': 'auto | <width-base>',
  'will-change': 'auto | <animateable-feature>#',
  'word-break': 'normal | keep-all | break-all | break-word',
  'word-spacing': '<len> | normal',
  'word-wrap': 'normal | break-word | anywhere',
  'writing-mode': 'horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr',

  'x': '<len-pct> | <num>',
  'y': '<x>',
  'z-index': '<int> | auto',
  'zoom': '<num> | <pct> | normal',

  // nonstandard https://compat.spec.whatwg.org/
  '-webkit-box-reflect': '[ above | below | right | left ]? <len>? <image>?',
  '-webkit-text-fill-color': '<color>',
  '-webkit-text-stroke': '<border-width> || <color>',
  '-webkit-text-stroke-color': '<color>',
  '-webkit-text-stroke-width': '<border-width>',
  '-webkit-user-modify': 'read-only | read-write | write-only',
};
Properties['-ms-appearance'] = 'icon | ' + (
  Properties['-o-appearance'] = 'none | window | desktop | workspace | document | tooltip | dialog | button | push-button | hyperlink | radio | radio-button | checkbox | menu-item | tab | menu | menubar | pull-down-menu | pop-up-menu | list-menu | radio-group | checkbox-group | outline-tree | range | field | combo-box | signature | password | normal'
);

class StringSource {

  constructor(text) {
    // https://www.w3.org/TR/css-syntax-3/#input-preprocessing
    this._break = (
      this.string = text.replace(/\r\n?|\f/g, '\n')
    ).indexOf('\n');
    this.line = 1;
    this.col = 1;
    this.offset = 0;
  }

  eof() {
    return this.offset >= this.string.length;
  }

  /** @return {number} */
  peek(distance = 1) {
    return this.string.charCodeAt(this.offset + distance - 1);
  }

  mark() {
    return (this._bookmark = {o: this.offset, l: this.line, c: this.col, b: this._break});
  }

  reset(b = this._bookmark) {
    if (b) {
      ({o: this.offset, l: this.line, c: this.col, b: this._break} = b);
      this._bookmark = null;
    }
  }

  /**
   * Reads characters that match either text or a regular expression and returns those characters.
   * If a match is found, the row and column are adjusted.
   * @param {RegExp} m - must be `sticky`
   * @param {boolean} [asRe]
   * @return {string|RegExpExecArray|void}
   */
  readMatch(m, asRe) {
    const res = (m.lastIndex = this.offset, m.exec(this.string));
    if (res) return (m = res[0]) && this.read(m.length, m) && (asRe ? res : m);
  }

  /** @param {number} code */
  readMatchCode(code) {
    if (code === this.string.charCodeAt(this.offset)) {
      if (code === 10)
        return this.read(1, '\n');
      this.col++; this.offset++;
      return String.fromCharCode(code);
    }
  }

  /** @param {string} m */
  readMatchStr(m) {
    const len = m.length;
    const {offset: i, string: str} = this;
    if (!len || str.charCodeAt(i) === m.charCodeAt(0) && (
      len === 1 ||
      str.charCodeAt(i + len - 1) === m.charCodeAt(len - 1) && str.substr(i, len) === m
    )) {
      return m && this.read(len, m);
    }
  }

  /**
   * Reads a given number of characters. If the end of the input is reached,
   * it reads only the remaining characters and does not throw an error.
   * @param {number} count The number of characters to read.
   * @param {string} [text] Use an already extracted text and only increment the cursor
   * @return {string}
   */
  read(count = 1, text) {
    let {offset: i, _break: br, string} = this;
    if (count <= 0 || text == null && !(text = string.substr(i, count))) return '';
    this.offset = i += (count = text.length); // may be less than requested
    if (i <= br || br < 0) {
      this.col += count;
    } else {
      let brPrev;
      let {line} = this;
      do ++line; while ((br = string.indexOf('\n', (brPrev = br) + 1)) >= 0 && br < i);
      this._break = br;
      this.line = line;
      this.col = i - brPrev;
    }
    return text;
  }

  /** @return {number|undefined} */
  readCode() {
    const c = this.string.charCodeAt(this.offset++);
    if (c === 10) {
      this.col = 1;
      this.line++;
      this._break = this.string.indexOf('\n', this.offset);
    } else if (c >= 0) { // fast NaN check
      this.col++;
    } else {
      this.offset--; // restore EOF
      return;
    }
    return c;
  }
}

const containerDir = '|x|y|block|inline';
const containerStuck = 'none|top|right|bottom|left|block-start|inline-start|block-end|inline-end';
const containerScroll = containerStuck + containerDir;

const ScopedProperties = {
  __proto__: null,
  'container': {
    __proto__: null,
    'aspect-ratio': '<ratio>',
    'block-size': '<len>',
    'height': '<len>',
    'inline-size': '<len>',
    'orientation': 'portrait|landscape',
    'scrollable': containerScroll,
    'scrolled': containerScroll,
    'snapped': 'none|both' + containerDir,
    'stuck': containerStuck,
    'width': '<len>',
  },
  'counter-style': {
    __proto__: null,
    'additive-symbols': '<pad>#',
    'fallback': '<ident-not-none>',
    'negative': '<prefix>{1,2}',
    'pad': '<int0+> && <prefix>',
    'prefix': '<string> | <image> | <custom-ident>',
    'range': '[ [ <int> | infinite ]{2} ]# | auto',
    'speak-as': 'auto | bullets | numbers | words | spell-out | <ident-not-none>',
    'suffix': '<prefix>',
    'symbols': '<prefix>+',
    'system': 'cyclic | numeric | alphabetic | symbolic | additive | [fixed <int>?] | ' +
      '[ extends <ident-not-none> ]',
  },
  'font-face': pick(Properties, [
    'font-family',
    'font-size',
    'font-variant',
    'font-variation-settings',
    'unicode-range',
  ], {
    __proto__: null,
    'ascent-override': '[ normal | <pct0+> ]{1,2}',
    'descent-override': '[ normal | <pct0+> ]{1,2}',
    'font-display': 'auto | block | swap | fallback | optional',
    'font-stretch': 'auto | <font-stretch>{1,2}',
    'font-style': 'auto | normal | italic | oblique <angle>{0,2}',
    'font-weight': 'auto | [ normal | bold | <num1-1000> ]{1,2}',
    'line-gap-override': '[ normal | <pct0+> ]{1,2}',
    'size-adjust': '<pct0+>',
    'src': '[ url() [ format( <string># ) ]? | local( <family-name> ) ]#',
  }),
  'font-palette-values': pick(Properties, ['font-family'], {
    __proto__: null,
    'base-palette': 'light | dark | <int0+>',
    'override-colors': '[ <int0+> <color> ]#',
  }),
  'function': {
    __proto__: null,
    'result': 1,
  },
  'media': {
    __proto__: null,
    '<all>': true,
    'any-hover': 'none | hover',
    'any-pointer': 'none | coarse | fine',
    'color': '<int>',
    'color-gamut': 'srgb | p3 | rec2020',
    'color-index': '<int>',
    'grid': '<int0-1>',
    'hover': 'none | hover',
    'monochrome': '<int>',
    'overflow-block': 'none | scroll | paged',
    'overflow-inline': 'none | scroll',
    'pointer': 'none | coarse | fine',
    'resolution': '<resolution> | infinite',
    'scan': 'interlace | progressive',
    'update': 'none | slow | fast',
    // deprecated
    'device-aspect-ratio': '<ratio>',
    'device-height': '<len>',
    'device-width': '<len>',
  },
  'page': {
    __proto__: null,
    '<all>': true,
    'bleed': 'auto | <len>',
    'marks': 'none | [ crop || cross ]',
    'size': '<len>{1,2} | auto | [ [ A3 | A4 | A5 | B4 | B5 | JIS-B4 | JIS-B5 | ' +
      'ledger | legal | letter ] || [ portrait | landscape ] ]',
  },
  'property': {
    __proto__: null,
    'inherits': 'true | false',
    'initial-value': 1,
    'syntax': '<string>',
  },
  'view-transition': {
    __proto__: null,
    '<all>': true,
    'navigation': 'auto | none',
    'types': 'none | <ident-not-none>+',
  },
};

/* eslint-disable max-len */
const VTComplex = {
  __proto__: null,
  '<absolute-size>': 'xx-small | x-small | small | medium | large | x-large | xx-large',
  '<alpha>': '/ <num-pct-none>',
  '<angular-color-stop>': '<color> <angle-pct-zero>{0,2}',
  '<animateable-feature>': 'scroll-position | contents | <animateable-feature-name>',
  '<animation-direction>': 'normal | reverse | alternate | alternate-reverse',
  '<animation-fill-mode>': 'none | forwards | backwards | both',
  '<animation-timeline>': 'auto | none | <custom-ident> | ' +
    'scroll( [ [ root | nearest | self ] || <axis> ]? ) | ' +
    'view( [ <axis> || [ [ auto | <len-pct> ]{1,2} ]# ]? )',
  '<at-pos>': 'at <position>',
  '<attachment>': 'scroll | fixed | local',
  '<auto-repeat>':
    'repeat( [ auto-fill | auto-fit ] , [ <line-names>? <fixed-size> ]+ <line-names>? )',
  '<auto-track-list>':
    '[ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>? <auto-repeat> ' +
    '[ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>?',
  '<autospace>': 'no-autospace | ' +
    '[ ideograph-alpha || ideograph-numeric || punctuation ] || [ insert|replace ]',
  '<axis>': 'block | inline | vertical | horizontal',
  '<baseline-position>': '[ first | last ]? baseline',
  '<basic-shape>': '<fn:basicShape>',
  '<bg-image>': '<image> | none',
  '<bg-layer>': '<bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || ' +
    '<attachment> || <box>{1,2}',
  '<bg-position>':
    '[ center | [ left | right ] <len-pct>? ] && [ center | [ top | bottom ] <len-pct>? ] | ' +
    '[ left | center | right | <len-pct> ] [ top | center | bottom | <len-pct> ] | ' +
    '[ left | center | right | top | bottom | <len-pct> ]',
  '<bg-size>': '[ <len-pct> | auto ]{1,2} | cover | contain',
  '<blend-mode>': 'normal | multiply | screen | overlay | darken | lighten | color-dodge | ' +
    'color-burn | hard-light | soft-light | difference | exclusion | hue | ' +
    'saturation | color | luminosity | plus-darker | plus-lighter',
  '<border-image-slice>': M => M.many([true],
    // [<num> | <pct>]{1,4} && fill?
    // but 'fill' can appear between any of the numbers
    ['<num-pct0+>', '<num-pct0+>', '<num-pct0+>', '<num-pct0+>', 'fill'].map(M.term)),
  '<border-radius-round>': 'round <border-radius>',
  '<border-shorthand>': '<border-width> || <border-style> || <color>',
  '<border-style>':
    'none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset',
  '<border-width>': '<len> | thin | medium | thick',
  '<box>': 'padding-box | border-box | content-box',
  '<box-fsv>': 'fill-box | stroke-box | view-box',
  '<color>': '<named-or-hex-color> | <fn:color>',
  '<color-interpolation-method>': 'in [ <rectangular-color-space> | <polar-color-space> <hue-interpolation-method>? ]',
  '<color-stop-list>': '<linear-color-stop> [, [ [<len-pct> ,]? <linear-color-stop> ]# ]?',
  '<compositing-operator>': 'add | subtract | intersect | exclude',
  '<contain-intrinsic>': 'auto? [ none | <len> ]',
  '<content-distribution>': 'space-between | space-around | space-evenly | stretch',
  '<content-list>':
    '[ <string> | <image> | <attr> | ' +
    'content( text | before | after | first-letter | marker ) | ' +
    'counter() | counters() | leader() | ' +
    'open-quote | close-quote | no-open-quote | no-close-quote | ' +
    'target-counter() | target-counters() | target-text() ]+',
  '<content-position>': 'center | start | end | flex-start | flex-end',
  '<coord-box>': '<box> | <box-fsv>',
  '<corner-shape-value>': 'round|scoop|bevel|notch|square|squircle|<fn:cornerShape>',
  '<counter>': '[ <ident-not-none> <int>? ]+ | none',
  '<dasharray>': M => M.alt([M.term('<len-pct0+>'), M.term('<num0+>')])
    .braces(1, Infinity, '#', M.term(',').braces(0, 1, '?')),
  '<display-box>': 'contents | none',
  '<display-inside>': 'flow | flow-root | table | flex | grid | ruby',
  '<display-internal>': 'table-row-group | table-header-group | table-footer-group | ' +
    'table-row | table-cell | table-column-group | table-column | table-caption | ' +
    'ruby-base | ruby-text | ruby-base-container | ruby-text-container',
  '<display-legacy>': 'inline-block | inline-table | inline-flex | inline-grid',
  '<display-listitem>': '<display-outside>? && [ flow | flow-root ]? && list-item',
  '<display-outside>': 'block | inline | run-in',
  '<dynamic-range>': 'standard | no-limit | constrained',
  '<explicit-track-list>': '[ <line-names>? <track-size> ]+ <line-names>?',
  '<family-name>': '<string> | <custom-ident>+',
  // https://drafts.fxtf.org/filter-effects/#supported-filter-functions
  // Value may be omitted in which case the default is used
  '<filter-function-list>': '[ <fn:filter> | <url> ]+',
  '<final-bg-layer>': '<color> || <bg-image> || <bg-position> [ / <bg-size> ]? || ' +
    '<repeat-style> || <attachment> || <box>{1,2}',
  '<fixed-repeat>': 'repeat( [ <int1+> ] , [ <line-names>? <fixed-size> ]+ <line-names>? )',
  '<fixed-size>':
    '<len-pct> | minmax( <len-pct> , <track-breadth> | <inflexible-breadth> , <len-pct> )',
  '<flex-direction>': 'row | row-reverse | column | column-reverse',
  '<flex-wrap>': 'nowrap | wrap | wrap-reverse',
  '<font-short-core>': '<font-size> [ / <line-height> ]? <font-family>',
  '<font-short-tweak-no-pct>':
    '<font-style> || [ normal | small-caps ] || <font-weight> || <font-stretch-named>',
  '<font-stretch-named>': 'normal | ultra-condensed | extra-condensed | condensed | ' +
    'semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded',
  '<font-variant-alternates>': 'stylistic() || historical-forms || styleset() || ' +
    'character-variant() || swash() || ornaments() || annotation()',
  '<font-variant-caps>':
    'small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps',
  '<font-variant-east-asian>': '[ jis78|jis83|jis90|jis04|simplified|traditional ] || ' +
    '[ full-width | proportional-width ] || ruby',
  '<font-variant-ligatures>': '[ common-ligatures | no-common-ligatures ] || ' +
    '[ discretionary-ligatures | no-discretionary-ligatures ] || ' +
    '[ historical-ligatures | no-historical-ligatures ] || ' +
    '[ contextual | no-contextual ]',
  '<font-variant-numeric>': '[ lining-nums | oldstyle-nums ] || ' +
    '[ proportional-nums | tabular-nums ] || ' +
    '[ diagonal-fractions | stacked-fractions ] || ' +
    'ordinal || slashed-zero',
  '<generic-family>': 'serif | sans-serif | cursive | fantasy | monospace | system-ui | ' +
    'emoji | math | fangsong | ui-serif | ui-sans-serif | ui-monospace | ui-rounded',
  '<geometry-box>': '<shape-box> | <box-fsv>',
  '<gradient>': 'radial-gradient() | linear-gradient() | conic-gradient() | gradient() | ' +
    'repeating-radial-gradient() | repeating-linear-gradient() | repeating-conic-gradient() | ' +
    'repeating-gradient()',
  '<grid-line>': 'auto | [ <int> && <ident-for-grid>? ] | <ident-for-grid> | ' +
    '[ span && [ <int> || <ident-for-grid> ] ]',
  '<hue-interpolation-method>': '[shorter|longer|increasing|decreasing] hue',
  '<image>': '<image-no-set> | image-set( <image-set># )',
  '<image-no-set>': '<url> | <gradient> | -webkit-cross-fade()',
  '<image-set>': '[ <image-no-set> | <string> ] [ <resolution> || type( <string> ) ]',
  '<inflexible-breadth>': '<len-pct> | min-content | max-content | auto',
  '<line-height>': '<num> | <len-pct> | normal',
  '<line-names>': '"[" <ident-for-grid> "]"',
  '<linear-color-stop>': '<color> <len-pct>?',
  '<masking-mode>': 'alpha | luminance | match-source',
  '<overflow-position>': 'unsafe | safe',
  '<overflow>': '<vis-hid> | clip | scroll | auto | overlay', // TODO: warning about `overlay`
  '<overscroll>': 'contain | none | auto',
  '<paint>': 'none | <color> | <url> [ none | <color> ]? | context-fill | context-stroke',
  '<polar-color-space>': 'hsl | hwb | lch | oklch',
  // Because our `alt` combinator is ordered, we need to test these
  // in order from longest possible match to shortest.
  '<position>':
    '[ [ left | right ] <len-pct> ] && [ [ top | bottom ] <len-pct> ] | ' +
    '[ left | center | right | <len-pct> ] ' +
    '[ top | center | bottom | <len-pct> ]? | ' +
    '[ left | center | right ] || [ top | center | bottom ]',
  '<position-area>': '[left|center|right|span-left|span-right|x-start|x-end|span-x-start|span-x-end|self-x-start|self-x-end|span-self-x-start|span-self-x-end|span-all] || [top|center|bottom|span-top|span-bottom|y-start|y-end|span-y-start|span-y-end|self-y-start|self-y-end|span-self-y-start|span-self-y-end|span-all] | [block-start|center|block-end|span-block-start|span-block-end|span-all] || [inline-start|center|inline-end|span-inline-start|span-inline-end|span-all] | [self-block-start|center|self-block-end|span-self-block-start|span-self-block-end|span-all] || [self-inline-start|center|self-inline-end|span-self-inline-start|span-self-inline-end|span-all] | [start|center|end|span-start|span-end|span-all]{1,2} | [self-start|center|self-end|span-self-start|span-self-end|span-all]{1,2}',
  '<ratio>': '<num0+> [ / <num0+> ]?',
  '<radial-extent>': 'closest-corner | closest-side | farthest-corner | farthest-side',
  '<relative-size>': 'smaller | larger',
  '<repeat-style>': 'repeat-x | repeat-y | [ repeat | space | round | no-repeat ]{1,2}',
  '<rectangular-color-space>': 'srgb|srgb-linear|display-p3|display-p3-linear|a98-rgb|prophoto-rgb|rec2020|lab|oklab|xyz|xyz-d50|xyz-d65',
  '<self-position>': 'center | start | end | self-start | self-end | flex-start | flex-end',
  '<shadow>': 'inset? && [ <len>{2,4} && <color>? ]',
  '<shape-box>': '<box> | margin-box',
  '<shape-radius>': '<len-pct0+> | closest-side | farthest-side',
  '<timing-function>': 'linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end | ' +
    'cubic-bezier( <num0-1> , <num> , <num0-1> , <num> ) | ' +
    'linear( [ <num> && <pct>{0,2} ]# ) | ' +
    'steps( <int> [ , [ jump-start | jump-end | jump-none | jump-both | start | end ] ]? )',
  '<text-align>': 'start | end | left | right | center | justify | match-parent',
  '<track-breadth>': '<len-pct> | <flex> | min-content | max-content | auto',
  '<track-list>': '[ <line-names>? [ <track-size> | <track-repeat> ] ]+ <line-names>?',
  '<track-repeat>': 'repeat( [ <int1+> ] , [ <line-names>? <track-size> ]+ <line-names>? )',
  '<track-size>': '<track-breadth> | minmax( <inflexible-breadth> , <track-breadth> ) | ' +
    'fit-content( <len-pct> )',
  '<txbhv>': 'normal | allow-discrete',
  '<url>': '<uri> | src( <string> [ <ident> | <func> ]* )',
  '<vis-hid>': 'visible | hidden',
  '<width-base>': '<len-pct> | min-content | max-content | fit-content | stretch | contain | ' +
    '-moz-available | -webkit-fill-available | anchor-size() | calc-size()',
};

let i;
/**
 * Based on https://www.w3.org/TR/css3-syntax/#lexical
 * Each key is re-assigned to a sequential index, starting with EOF=0.
 * Each value is converted into {name:string, text?:string} and stored as Tokens[index],
 * e.g. AMP:'&' becomes AMP:1 and a new element is added at 1: {name:'AMP', text:'&'}.
 */
const Tokens = {__proto__: null};
/** EOF must be the first token */
const EOF = (Tokens[i = 0] = {name: 'EOF'}, i);
const AMP = (Tokens[++i] = {name: 'AMP', text: '&'}, i);
const AT = (Tokens[++i] = {name: 'AT'}, i);
const ATTR_EQ = (Tokens[++i] = {name: 'ATTR_EQ', text: ['|=', '~=', '^=', '*=', '$=']}, i);
/** CDO and CDC */
const CDCO = (Tokens[++i] = {name: 'CDCO'}, i);
const CHAR = (Tokens[++i] = {name: 'CHAR'}, i);
const LT = (Tokens[++i] = {name: 'LT', text: '<'}, i);
const COLON = (Tokens[++i] = {name: 'COLON', text: ':'}, i);
/** Not using "+" and ">" which can be math ops */
const COMBINATOR = (Tokens[++i] = {name: 'COMBINATOR', text: ['~', '||']}, i);
const COMMA = (Tokens[++i] = {name: 'COMMA', text: ','}, i);
const COMMENT = (Tokens[++i] = {name: 'COMMENT'}, i);
const DASHED_FUNCTION = (Tokens[++i] = {name: 'DASHED_FUNCTION'}, i);
const DELIM = (Tokens[++i] = {name: 'DELIM', text: '!'}, i);
const DIV = (Tokens[++i] = {name: 'DIV', text: '/'}, i);
const DOT = (Tokens[++i] = {name: 'DOT', text: '.'}, i);
const EQUALS = (Tokens[++i] = {name: 'EQUALS', text: '='}, i);
const EQ_CMP = (Tokens[++i] = {name: 'EQ_CMP', text: ['>=', '<=']}, i);
const FUNCTION = (Tokens[++i] = {name: 'FUNCTION'}, i);
const GT = (Tokens[++i] = {name: 'GT', text: '>'}, i);
const HASH = (Tokens[++i] = {name: 'HASH', text: '#'}, i);
const IDENT = (Tokens[++i] = {name: 'IDENT'}, i);
const INVALID = (Tokens[++i] = {name: 'INVALID'}, i);
const LBRACE = (Tokens[++i] = {name: 'LBRACE', text: '{'}, i);
const LBRACKET = (Tokens[++i] = {name: 'LBRACKET', text: '['}, i);
const LPAREN = (Tokens[++i] = {name: 'LPAREN', text: '('}, i);
const MINUS = (Tokens[++i] = {name: 'MINUS', text: '-'}, i);
const PIPE = (Tokens[++i] = {name: 'PIPE', text: '|'}, i);
const PLUS = (Tokens[++i] = {name: 'PLUS', text: '+'}, i);
const RBRACE = (Tokens[++i] = {name: 'RBRACE', text: '}'}, i);
const RBRACKET = (Tokens[++i] = {name: 'RBRACKET', text: ']'}, i);
const RPAREN = (Tokens[++i] = {name: 'RPAREN', text: ')'}, i);
const SEMICOLON = (Tokens[++i] = {name: 'SEMICOLON', text: ';'}, i);
const STAR = (Tokens[++i] = {name: 'STAR', text: '*'}, i);
const STRING = (Tokens[++i] = {name: 'STRING'}, i);
const URANGE = (Tokens[++i] = {name: 'URANGE'}, i);
const URI = (Tokens[++i] = {name: 'URI'}, i);
const UVAR = (Tokens[++i] = {name: 'UVAR'}, i); /*[[userstyles-org-variable]]*/
const WS = (Tokens[++i] = {name: 'WS'}, i);
// numbers
const ANGLE = (Tokens[++i] = {name: 'ANGLE'}, i);
const DIMENSION = (Tokens[++i] = {name: 'DIMENSION'}, i);
const FLEX = (Tokens[++i] = {name: 'FLEX'}, i);
const FREQUENCY = (Tokens[++i] = {name: 'FREQUENCY'}, i);
const LENGTH = (Tokens[++i] = {name: 'LENGTH'}, i);
const NUMBER = (Tokens[++i] = {name: 'NUMBER'}, i);
const PCT = (Tokens[++i] = {name: 'PCT'}, i);
const RESOLUTION = (Tokens[++i] = {name: 'RESOLUTION'}, i);
const TIME = (Tokens[++i] = {name: 'TIME'}, i);

const TokenIdByCode = [];

for (i in Tokens) {
  const token = Tokens[i];
  const {text} = token;
  Tokens[token.name] = i = +i;
  if (text) {
    for (const str of typeof text === 'string' ? [text] : text) {
      if (str.length === 1) TokenIdByCode[str.charCodeAt(0)] = i;
    }
  }
}

const buAlpha = new Bucket('alpha');
/** https://www.w3.org/TR/css-values-4/#custom-idents */
const buGlobalKeywords = new Bucket(GlobalKeywords);
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
  '<angle-pct-zero>': p => p.isCalc || p.is0 || p.id === ANGLE || p.id === PCT,
  '<angle-zero>': p => p.isCalc || p.is0 || p.id === ANGLE,
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

const validationCache = new Map();

/** @property {Array} [badFunc] */
class PropValueIterator {
  /** @param {TokenValue} value */
  constructor(value) {
    this.i = 0;
    this.parts = value.parts;
    this.value = value;
  }

  get hasNext() {
    return this.i < this.parts.length;
  }

  /** @returns {?Token} */
  next() {
    if (this.i < this.parts.length) return this.parts[++this.i];
  }
}

class ValidationError extends Error {
  constructor(message, pos) {
    super();
    this.col = pos.col;
    this.line = pos.line;
    this.offset = pos.offset;
    this.message = message;
  }
}

/**
 * @param {Token} tok
 * @param {TokenValue} value
 * @param {TokenStream} stream
 * @param {string|Object} Props
 * @return {ValidationError|void}
 */
function validateProperty(tok, value, stream, Props) {
  const pp = value.parts;
  const p0 = pp[0];
  Props = typeof Props === 'string' ? ScopedProperties[Props] : Props || Properties;
  let spec, res, vp;
  let prop = tok.lowText ??= tok.text.toLowerCase();
  do {
    spec = Props[prop] || Props['<all>'] && (Props = Properties)[prop];
  } while (!spec && !res && (vp = tok.vendorPos) && (res = prop = prop.slice(vp)));
  if (typeof spec === 'number' || !spec && vp) {
    return;
  }
  if (!spec) {
    prop = Props === Properties || !Properties[prop] ? 'Unknown' : 'Misplaced';
    return new ValidationError(`${prop} property "${tok}".`, tok);
  }
  if (value.isVar) {
    return;
  }
  if (p0.id === IDENT && buGlobalKeywords.has(p0)) {
    return pp[1] && vtFailure(pp[1], true);
  }
  const valueSrc = value.text.trim();
  let known = validationCache.get(prop);
  if (known && known.has(valueSrc)) {
    return;
  }
  // Property-specific validation.
  const expr = new PropValueIterator(value);
  let m = Matcher.cache[spec] || Matcher.parse(spec);
  res = m.match(expr, p0);
  if ((!res || expr.hasNext) && /\battr\(/i.test(valueSrc)) {
    if (!res) {
      expr.i = 0;
      expr.tryAttr = true;
      res = m.match(expr);
    }
    for (let i, epp = expr.parts; (i = expr.i) < epp.length && epp[i].isAttr;) {
      expr.next();
    }
  }
  if (expr.hasNext && (res || expr.i)) return vtFailure(expr.parts[expr.i]);
  if (!res && (m = expr.badFunc)) return vtFailure(m[0], vtDescribe(spec, m[1]));
  if (!res) return vtFailure(expr.value, vtDescribe(spec));
  if (!known) validationCache.set(prop, (known = new Set()));
  known.add(valueSrc);
}

function vtDescribe(type, m) {
  if (!m) m = VTComplex[type] || type[0] === '<' && Properties[type.slice(1, -1)];
  return m instanceof Matcher ? m.toString(0) : vtExplode(m || type);
}

function vtExplode(text) {
  return !text.includes('<') ? text
    : (Matcher.cache[text] || Matcher.parse(text)).toString(0);
}

function vtFailure(unit, what) {
  if (!what || what === true ? (what = 'end of value') : !unit.isVar) {
    return new ValidationError(`Expected ${what} but found "${clipString(unit)}".`, unit);
  }
}

/* eslint-disable max-len */

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
    'color-mix': '[ <color-interpolation-method> , ]? [ <color> && <pct0-100>? ]#{2}',
    'color': 'from <color> [ ' +
        '<custom-prop> [ <num-pct-none> <custom-ident> ]# | ' +
        '<rectangular-color-space> [ <num-pct-none> | r | g | b | x | y | z ]{3} ' +
      '] [ / <num-pct-none> | r | g | b | x | y | z ]? | ' +
      '[ <rectangular-color-space> <num-pct-none>{3} | <custom-prop> <num-pct-none># ] <alpha>?',
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
 */
class Matcher {
  /**
   * @param {(this: Matcher, expr: PropValueIterator, p?: Token) => boolean} matchFunc
   * @param {string|function} toString
   * @param {Matcher.Arg.Braces | Matcher.Arg.Func | Bucket | ((p: Token) => boolean) | Matcher[]} [arg]
   * @param {boolean} [isMeta] - true for alt/seq/many/braces that control matchers
   */
  constructor(matchFunc, toString, arg, isMeta) {
    this.matchFunc = matchFunc;
    this.arg = arg;
    this.isMeta = isMeta;
    if (toString.call) this.toString = toString;
    else this._string = toString;
  }

  /**
   * @param {PropValueIterator} expr
   * @param {Token} [p]
   * @return {boolean}
   */
  match(expr, p) {
    const {i} = expr;
    if (!p && !(p = expr.parts[i])) return this.arg.min === 0;
    const isMeta = this.isMeta;
    const res = !isMeta && p.isVar ||
      this.matchFunc(expr, p) ||
      !isMeta && expr.tryAttr && p.isAttr;
    if (!res) {
      expr.i = i;
    } else if (!isMeta && expr.i < expr.parts.length) ++expr.i;
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
    return !ms[1] ? ms[0] : new Matcher(Matcher.altTest, Matcher.altToStr, ms, true);
  }

  /**
   * @this {Matcher}
   * @param {PropValueIterator} expr
   * @param {Token} p
   * @return {!boolean|void}
   */
  static altTest(expr, p) {
    const ms = this.arg;
    for (const m of ms)
      if (m.match(expr, p))
        return true;
  }

  /** @this {Matcher} */
  static altToStr(prec) {
    return (prec = prec > ALT ? '[ ' : '') +
      this.arg.map(m => m.toString(ALT)).join(' | ') +
      (prec ? ' ]' : '');
  }

  braces(min, max, marker, sep) {
    /** @namespace Matcher.Arg.Braces */
    return new Matcher(Matcher.bracesTest, Matcher.bracesToStr, {
      m: this,
      min, max, marker,
      sep: sep && Matcher.seq([sep.matchFunc ? sep : Matcher.term(sep), this]),
    }, true);
  }

  /**
   * @this {Matcher}
   * @param {PropValueIterator} expr
   * @param {Token} p
   * @return {!boolean|number}
   */
  static bracesTest(expr, p) {
    let i = 0;
    const {min, max, sep, m} = this.arg;
    while (i < max && (i && sep || m).match(expr, p)) {
      p = undefined; // clearing because expr points to the next part now
      i++;
    }
    return i >= min && (i || true);
  }

  /** @this {Matcher} */
  static bracesToStr() {
    const {marker, min, max, m} = this.arg;
    return m.toString(MOD) + (marker || '') + (
      !marker || marker === '#' && !(min === 1 || max === Infinity)
        ? `{${min}${min === max ? '' : `,${max === Infinity ? '' : max}`}}`
        : '');
  }

  /**
   * @this {Matcher}
   * @param {PropValueIterator} expr
   * @param {Token} p
   * @return {!boolean|number|void}
   */
  static funcTest(expr, p) {
    const name = p.name; if (!name) return;
    let e, m, vi;
    const {arg} = this;
    const {list} = arg;
    if (list)
      m = list[name]; // VTFunctions doesn't have vendor-prefixed names
    else if (name === (e = arg.name) || (vi = p.prefix) && vi + name === e)
      m = arg.body;
    if (!m)
      return m != null; // true = no check if `body` is false i.e. no specs for params
    if ((e = p.expr)) {
      if (e.isVar) return true;
      else vi = new PropValueIterator(e);
    }
    if (!m.matchFunc) {
      m = (m.call ? m(Matcher) : cache[m] || Matcher.parse(m));
      if (list) list[name] = m;
    }
    if (!e)
      return m.arg.min === 0;
    return m.match(vi) && vi.i >= vi.parts.length
      || !(expr.badFunc = [e, m]);
  }

  /** @this {Matcher} */
  static funcToStr(prec) {
    const {name, body, list} = this.arg;
    return name ? `${name}(${body && !prec ? ` ${body} ` : ''})` :
      (prec = prec > ALT ? '[ ' : '') +
      Object.keys(list).join('() | ') +
      (prec ? '() ]' : '()');
  }

  /**
   * @param {boolean?} req
   * @param {Matcher[]} ms
   * @return {Matcher | Matcher & {req: false | boolean[]}}
   */
  static many(req, ms) {
    if (!ms[1])
      return ms[0];
    const res = new Matcher(Matcher.manyTest, Matcher.manyToStr, ms, true);
    res.req = req === true ? Array(ms.length).fill(true) :
      req == null ? ms.map(m => !m.arg || m.arg.marker !== '?')
        : req;
    return res;
  }

  /**
   * Matcher for two or more options: double bar (||) and double ampersand (&&) operators,
   * as well as variants of && where some of the alternatives are optional.
   * This will backtrack through even successful matches to try to
   * maximize the number of items matched.
   * @this {Matcher}
   * @param {PropValueIterator} expr
   * @return {!boolean}
   */
  static manyTest(expr) {
    const state = [];
    state.expr = expr;
    state.max = 0;
    // If couldn't get a complete match, retrace our steps to make the
    // match with the maximum # of required elements.
    if (!this.manyTestRun(state, 0)) this.manyTestRun(state, 0, true);
    if (!this.req) return state.max > 0;
    // Use finer-grained specification of which matchers are required.
    for (let i = 0; i < this.req.length; i++) {
      if (this.req[i] && !state[i]) return false;
    }
    return true;
  }

  manyTestRun(state, count, retry) {
    for (let i = 0, {expr} = state, ms = this.arg, ei, x; i < ms.length; i++) {
      if (!state[i] && (
        (ei = expr.i) + 1 > expr.parts.length ||
        (x = ms[i].match(expr)) && (x > 1 || x === 1 || ms[i].arg.min !== 0)
        // Seeing only real matches e.g. <foo> inside <foo>? or <foo>* or <foo>#{0,n}
        // Not using `>=` because `true>=1` and we don't want booleans here
      )) {
        state[i] = true;
        if (this.manyTestRun(state, count + (!this.req || this.req[i] ? 1 : 0), retry)) {
          return true;
        }
        state[i] = false;
        expr.i = ei;
      }
    }
    if (retry) return count === state.max;
    state.max = Math.max(state.max, count);
    return count === this.arg.length;
  }

  /** @this {Matcher} */
  static manyToStr(prec) {
    const {req} = this;
    const p = req ? ANDAND : OROR;
    const s = this.arg.map((m, i) =>
      !req || req[i]
        ? m.toString(p)
        : m.toString(MOD).replace(/[^?]$/, '$&?'),
    ).join(req ? ' && ' : ' || ');
    return prec > p ? `[ ${s} ]` : s;
  }

  /** Simple recursive-descent parseAlt to build matchers from strings. */
  static parse(str) {
    const source = new StringSource(str);
    const res = Matcher.parseAlt(source);
    if (!source.eof()) {
      const {offset: i, string} = source;
      throw new Error(`Internal grammar error. Unexpected "${
        clipString(string.slice(i, 31), 30)}" at position ${i} in "${string}".`);
    }
    cache[str] = res;
    return res;
  }

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
  static parseAlt(src) {
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
              seq.push(Matcher.parseTerm(src));
            } while (src.readMatch(rxSeqSep));
            ands.push(Matcher.seq(seq));
          } while (src.readMatch(rxAndAndSep));
          ors.push(Matcher.many(null, ands));
        } while (src.readMatch(rxOrOrSep));
        alts.push(Matcher.many(false, ors));
      }
    } while (src.readMatch(rxOrSep));
    if (literals)
      alts.splice(litIndex, 0, Matcher.term(literals));
    return Matcher.alt(alts);
  }

  /**
   * @param {StringSource} src
   * @return {Matcher}
   */
  static parseTerm(src) {
    let m, fn;
    fn = src.peek();
    if (/* [ */ fn === 91 && src.readMatch(rxGroupBegin)) {
      m = Matcher.parseAlt(src);
      if (!src.readMatch(rxGroupEnd))
        Matcher.parsingFailed(src, rxGroupEnd);
    } else if (/* a-z - */
      (fn >= 97 && fn <= 122 || fn === 45) &&
      (fn = src.readMatch(rxFuncBegin, true))
    ) {
      /** @namespace Matcher.Arg.Func */
      m = new Matcher(Matcher.funcTest, Matcher.funcToStr, {
        name: fn[1].toLowerCase(),
        body: fn[2] // if there's no inline body grammar in `src`
          ? VTFunctions._[fn[1]] || false /* for funcTest */
          : Matcher.parseAlt(src),
      });
      if (!fn[2] && !src.readMatch(rxFuncEnd)) Matcher.parsingFailed(src, rxFuncEnd);
    } else {
      m = Matcher.term(src.readMatch(rxTerm) || Matcher.parsingFailed(src, rxTerm));
    }
    fn = src.peek();
    if (fn === 123/* { */ || fn === 35/* # */ && src.peek(2) === 123) {
      const hash = fn === 35 ? src.read() : '';
      const [, a, comma, b = comma ? Infinity : a] = src.readMatch(rxBraces, true)
        || Matcher.parsingFailed(src, rxBraces);
      m = m.braces(+a, +b, hash, hash && ',');
      if (src.peek() === 63 /* ? */) {
        src.read();
        if (+a === 1) m.arg.min = 0; // modify 1->0 inplace
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
  }

  /**
   * @param {StringSource} src
   * @param {RegExp|string} m
   * @throws
   */
  static parsingFailed(src, m) {
    throw new Error('Internal grammar error. ' +
      `Expected ${m} at ${src.offset} in ${src.string}`);
  }

  static seq(ms) {
    return !ms[1] ? ms[0] : new Matcher(Matcher.seqTest, Matcher.seqToStr, ms, true);
  }

  /**
   * @this {Matcher}
   * @param {PropValueIterator} expr
   * @param {Token} p
   * @return {!boolean|void}
   */
  static seqTest(expr, p) {
    let min1, i, m, res;
    for (i = 0; (m = this.arg[i++]); p = undefined) {
      if (!(res = m.match(expr, p))) return;
      if (!min1 && (m.arg.min !== 0 || res === 1 || res > 1)) min1 = true;
      // a number >= 1 is returned only from bracesTest
    }
    return true;
  }

  /** @this {Matcher} */
  static seqToStr(prec) {
    return (prec = prec > SEQ ? '[ ' : '') +
      this.arg.map(m => m.toString(SEQ)).join(' ') +
      (prec ? ' ]' : '');
  }

  /**
   * @this {Matcher}
   * @param {PropValueIterator} expr
   * @param {Token} p
   * @return {!boolean}
   */
  static simpleTest(expr, p) {
    return !!this.arg(p);
  }

  /**
   * @this {Matcher}
   * @param {PropValueIterator} expr
   * @param {Token} p
   * @return {!boolean|void}
   */
  static stringArrTest(expr, p) {
    // If the bucket has -vendor-prefixed-text we will use the token as-is without unprefixing it
    return this.arg.has(p) || p.vendorCode &&
      (expr = this.arg[p.vendorCode * 100 + p.length - p.vendorPos]) &&
      (p = p.text.slice(p.vendorPos).toLowerCase()) &&
      (typeof expr === 'string' ? expr === p : expr.includes(p));
  }

  /** @this {Matcher} */
  static stringArrToStr(prec) {
    return (prec = prec > ALT && this._string.includes('|') ? '[ ' : '') +
      this._string + (prec ? ' ]' : '');
  }

  /** Matcher for a single type */
  static term(str) {
    const origStr = str;
    let m = cache[str = str.toLowerCase()];
    if (m) return m;
    if (str[0] !== '<') {
      m = new Matcher(Matcher.stringArrTest, Matcher.stringArrToStr,
        new Bucket(str.split(rxAltSep)));
      m._string = str;
    } else if (str.startsWith('<fn:')) {
      /** @namespace Matcher.Arg.FuncList */
      m = new Matcher(Matcher.funcTest, Matcher.funcToStr,
        {list: VTFunctions[origStr.slice(4, -1)]});
    } else if ((m = VTSimple[str])) {
      m = new Matcher(Matcher.simpleTest, str, m);
    } else {
      m = VTComplex[str] || Properties[str.slice(1, -1)];
      if (!m) throw new Error(`Unknown grammar term ${str}`);
      m = m.matchFunc ? m : m.call ? m(Matcher) : cache[m] || Matcher.parse(m);
      if (str === '<url>') {
        m._string = str;
        delete m.toString;
      }
    }
    cache[str] = m;
    return m;
  }
}

/** @type {{[key:string]: Matcher}} */
const cache = Matcher.cache = {__proto__: null};
// Precedence of combinators.
const MOD = Matcher.MOD = 5;
const SEQ = Matcher.SEQ = 4;
const ANDAND = Matcher.ANDAND = 3;
const OROR = Matcher.OROR = 2;
const ALT = Matcher.ALT = 1;

/**
 * @property {[]} [args] added in selectors
 * @property {string} [atName] lowercase name of @-rule without -vendor- prefix
 * @property {TokenValue} [expr] body of function or block
 * @property {boolean} [is0] number is an integer 0 without units
 * @property {boolean} [isAttr] = attr()
 * @property {boolean} [isCalc] = calc()
 * @property {boolean} [isInt] = integer without units
 * @property {boolean} [isVar] = var(), env(), /*[[var]]* /
 * @property {'*'|'_'} [hack] for property name in IE mode
 * @property {string} [lowText] text.toLowerCase() added on demand
 * @property {string} [name] name of function
 * @property {number} [number] parsed number
 * @property {string} [prefix] lowercase `-vendor-` prefix
 * @property {string} [units] lowercase units of a number
 * @property {string} [uri] parsed uri string
 * @property {number} [vendorCode] char code of vendor name i.e. 102 for "f" in -moz-foo
 * @property {number} [vendorPos] position of vendor name i.e. 5 for "f" in -moz-foo
 */
class Token {
  constructor(id, col, line, offset, input, code) {
    /** @type {number} */
    this.id = id;
    this.col = col;
    this.line = line;
    this.offset = offset;
    this.offset2 = offset + 1;
    this.type = '';
    this.code = toLowAscii(code);
    this._input = input;
  }

  /** @return {Token} */
  static from(tok) {
    return assign(Object.create(this.prototype), tok);
  }

  get length() {
    return isOwn(this, 'text') ? this.text.length : this.offset2 - this.offset;
  }

  get string() {
    const str = PDESC.value = parseString(this.text);
    define(this, 'string', PDESC);
    return str;
  }

  set string(val) {
    PDESC.value = val;
    define(this, 'string', PDESC);
  }

  get text() {
    return this._input.slice(this.offset, this.offset2);
  }

  set text(val) {
    PDESC.value = val;
    define(this, 'text', PDESC);
  }

  valueOf() {
    return this.text;
  }

  toString() {
    return this.text;
  }
}

class TokenFunc extends Token {
  /**
   * @param {Token} tok
   * @param {TokenValue} [expr]
   * @param {Token} [end]
   * @return {Token}
   */
  static from(tok, expr, end) {
    tok = super.from(tok);
    if (isOwn(tok, 'text')) tok.offsetBody = tok.offset2;
    if (end) tok.offset2 = end.offset2;
    if (expr) {
      tok.expr = expr;
      let n = tok.name;
      if (B.calc.has(tok, tok.code, n)) {
        tok.isCalc = true;
      } else if (n === 'var' || n === 'env' || tok.id === DASHED_FUNCTION) {
        tok.isVar = true;
      } else if (n === 'attr' && (n = expr.parts[0]) && (n.id === IDENT || n.id === UVAR)) {
        tok.isAttr = true;
      }
    }
    return tok;
  }

  toString() { // FIXME: account for escapes
    const s = this._input;
    return isOwn(this, 'text')
      ? this.text + s.slice(this.offsetBody + 1, this.offset2)
      : s.slice(this.offset, this.offset2);
  }
}

/**
 * @template T
 * @prop {T[]} parts
 */
class TokenValue extends Token {
  /** @return {TokenValue} */
  static from(parts, tok = parts[0]) {
    tok = super.from(tok);
    tok.parts = parts;
    return tok;
  }

  /** @return {TokenValue} */
  static empty(tok) {
    tok = super.from(tok);
    tok.parts = [];
    tok.id = WS;
    tok.offset2 = tok.offset;
    delete tok.text;
    return tok;
  }

  get text() { // FIXME: account for escapes
    return this._input.slice(this.offset, (this.parts[this.parts.length - 1] || this).offset2);
  }

  set text(val) {
    PDESC.value = val;
    define(this, 'text', PDESC);
  }
}

const Units = {__proto__: null};
const UnitTypeIds = {__proto__: null};

for (const [id, units] of [
  [ANGLE, 'deg,grad,rad,turn'],
  [FLEX, 'fr'],
  [FREQUENCY, 'hz,khz'],
  [LENGTH, 'cap,ch,em,ex,ic,lh,' +
    'rcap,rch,rem,rex,ric,rlh,' +
    'cm,mm,in,pc,pt,px,q,' +
    'cqw,cqh,cqi,cqb,cqmin,cqmax,' + // containers
    'vb,vi,vh,vw,vmin,vmax' +
    'dvb,dvi,dvh,dvw,dvmin,dvmax' +
    'lvb,lvi,lvh,lvw,lvmin,lvmax' +
    'svb,svi,svh,svw,svmin,svmax'],
  [RESOLUTION, 'dpcm,dpi,dppx,x'],
  [TIME, 'ms,s'],
]) {
  const type = Tokens[id].name.toLowerCase();
  for (const u of units.split(',')) Units[u] = type;
  UnitTypeIds[type] = id;
}

/* eslint-disable class-methods-use-this */

const TT = {
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
  stringUri: [STRING, URI],
};
const OrDie = {must: true};
const OrDieReusing = {must: true, reuse: true};
/** For these tokens stream.match() will return a UVAR unless the next token is a direct match */
const UVAR_PROXY = [PCT, ...TT.mediaValue, ...TT.identString]
  .reduce((res, id) => (res[id] = true) && res, []);
// Sticky `y` flag must be used in expressions for StringSource's readMatch
// Groups must be non-capturing (?:foo) unless explicitly necessary
const rxCommentUso = /(\*)\[\[[-\w]+]]\*\/|\*(?:[^*]+|\*(?!\/))*(?:\*\/|$)/y;
const rxDigits = /\d+/y;
const rxMaybeQuote = /\s*['"]?/y;
const rxName = /(?:[-_\da-zA-Z\u00A0-\uFFFF]+|\\(?:[0-9a-fA-F]{1,6}\s?|.|$))+/y;
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
const rxUnquotedUrl = /(?:[-!#$%&*-[\]-~\u00A0-\uFFFF]+|\\(?:[0-9a-fA-F]{1,6}\s|.|$))+/y;
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
const isIdentChar = c => /* a-z A-Z */ c >= 97 && c <= 122 || c >= 65 && c <= 90 ||
  /* - \ _ unicode 0-9 */ c === 45 || c === 92 || c === 95 || c >= 160 || c >= 48 && c <= 57;
const isIdentStart = (a, b) => a >= 97 && a <= 122 || a >= 65 && a <= 90 /* a-z A-Z */ ||
  a === 95 || a >= 160 /* _ unicode */ ||
  (a === 45/*-*/ ? b !== 45 && isIdentStart(b)
    : a === 92/* \ */ && b != null && b !== 10);
const isSpace = c => c === 9 && c === 10 || c === 32;
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
class TokenStream {

  constructor(input) {
    this.source = new StringSource(input ? `${input}` : '');
    /** Number of consumed "&" tokens */
    this._amp = 0;
    /** Lookahead buffer size */
    this._max = 4;
    /** Closing token of the currently processed block */
    this._pair = 0;
    this._resetBuf();
    define(this, 'grab', {writable: true, value: this.get.bind(this, 0, 0)});
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
   * @return {Token}
   */
  get(uvar, ws = true) {
    let {_buf: buf, _cur: i, _max: MAX} = this;
    let tok, ti, slot;
    do {
      slot = (i + this._cycle) % MAX;
      if (i >= buf.length) {
        if (buf.length < MAX) i++;
        else this._cycle = (this._cycle + 1) % MAX;
        ti = (tok = buf[slot] = this._getToken(uvar, ws)).id;
        break;
      }
      ++i;
      ti = (tok = buf[slot]).id;
    } while (ti === COMMENT || !ws && ti === WS || !uvar && ti === UVAR);
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
    uvp = uvp && tok.isVar;
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
    goal = goal ? `Expected ${goal} but found` : 'Unexpected';
    goal = new ParseError(`${goal} "${clipString(tok)}".`, tok);
    if (throwIt) throw goal;
    return goal;
  }

  /**
   * @return {Token|void}
   */
  _getToken(uvar, ws) {
    const src = this.source;
    let a, b, c, v, text, col, line, offset;
    while (true) {
      ({col, line, offset} = src);
      a = src.readCode(); if (a == null) break;
      b = src.string.charCodeAt(src.offset);
      if (a === 9/*\t*/ || a === 10/*\n*/ || a === 32/* " " */) {
        if (isSpace(b)) src.readMatch(rxSpace);
        if (ws) { v = WS; break; }
      } else if (a === 47/* / */) {
        if (b !== 42/* * */) { v = DIV; break; }
        a = src.readMatch(rxCommentUso, true);
        if (uvar && a[1]) { v = UVAR; break; }
      } else break;
    }
    const tok = new Token(v || CHAR, col, line, offset, src.string, a);
    if (v) {
      if (v === UVAR) tok.isVar = true;
    // [0-9]
    } else if (a >= 48 && a <= 57) {
      v = b >= 48 && b <= 57 || b === 46/*.*/ ||
        (b === 69 || b === 101)/*Ee*/ && (c = src.string.charCodeAt(src.offset + 1)) === 43/*+*/ ||
        c === 45/*-*/ || c >= 48 && c <= 57/*0-9*/;
      text = this._number(src, tok, a, b, v, rxNumberDigit);
    // [-+.]
    } else if ((a === 45 || (a === 43 ? tok.id = PLUS : a === 46 && (tok.id = DOT))) && (
    /* [-+.][0-9] */ b >= 48 && b <= 57 ||
    /* [-+].[0-9] */ b === 46/*.*/ && a !== 46 &&
      (c ??= src.string.charCodeAt(src.offset + 1)) >= 48 && c <= 57
    )) {
      text = this._number(src, tok, a, b, 1, a === 46 ? rxNumberDot : rxNumberSign);
    // \ checking before _ident() to exclude non-ident escape
    } else if (a === 92 && (
      b == null
        ? text = '\uFFFD'
        : b === 10 && (tok.id = WS, text = src.readMatch(rxSpace))
    )) ; else if (a === 45) {
      if (b === 45/* -- */) {
        if (isIdentChar(c ??= src.string.charCodeAt(src.offset + 1))) {
          text = this._ident(src, tok, a, b, 1, c, 1);
        } else if (c === 62/* --> */) {
          src.col += 2; src.offset += 2;
          tok.id = CDCO;
        } else {
          tok.id = MINUS;
        }
      } else if (isIdentStart(b, b === 92/*\*/ && (c ??= src.string.charCodeAt(src.offset + 1)))) {
        text = this._ident(src, tok, a, b, 1, c);
      } else {
        tok.id = MINUS;
      }
    // U+ u+
    } else if ((a === 85 || a === 117) && b === 43) {
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
    } else if ((v = b === 61 // =
    /* $= *= ^= |= ~= */
      ? (a === 36 || a === 42 || a === 94 || a === 124 || a === 126) &&
        ATTR_EQ
    /* <= >= */
      || (a === 60 || a === 62) && EQ_CMP
    /* || */
      : a === 124 && b === 124 &&
        COMBINATOR
    )) {
      tok.id = v;
      src.col++; src.offset++;
    // #
    } else if (a === 35) {
      if (isIdentChar(b)) {
        text = this._ident(src, tok, a, b, 1);
        tok.id = HASH;
      }
    // *
    } else if (a === 42) {
      tok.id = STAR;
      if (isIdentStart(b)) tok.hack = '*';
    // [.,:;>+~=|*{}[]()]
    } else if ((v = TokenIdByCode[a])) {
      tok.id = v;
    // ["']
    } else if (a === 34 || a === 39) {
      src.readMatch(a === 34 ? rxStringDoubleQ : rxStringSingleQ);
      if (src.readMatchCode(a)) {
        tok.id = STRING;
        tok.type = 'string';
      } else {
        tok.id = INVALID;
      }
    // @
    } else if (a === 64) {
      if (isIdentStart(b, c ??= b === 45/*-*/ || b === 92/*\*/ ? src.peek(2) : c)) {
        src.col++; src.offset++;
        v = this._ident(src, null, b, c ?? src.string.charCodeAt(src.offset));
        a = v.name;
        text = v.esc && `@${a}`;
        a = a.charCodeAt(0) === 45/*-*/ && (v = a.indexOf('-', 1)) > 1 ? a.slice(v + 1) : a;
        tok.atName = a.toLowerCase();
        tok.id = AT;
      }
    // >
    } else if (a === 62) {
      tok.id = GT;
    // <
    } else if (a === 60) {
      tok.id = b === 33/*!*/ && src.readMatchStr('!--') ? CDCO : LT;
    // a-z A-Z \ _ unicode ("-" was handled above)
    } else if (isIdentStart(a, b)) {
      text = this._ident(src, tok, a, b);
    } else if (a == null) {
      tok.id = EOF;
    }
    if ((v = src.offset) !== offset + 1) tok.offset2 = v;
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
    bYes = a === 92 ? b != null && b !== 10 : isIdentChar(b),
    c = bYes && src.string.charCodeAt(src.offset + 1),
    cYes = c && (b === 92 ? a !== 92 && c !== 10 : isIdentChar(c))
  ) {
    const first = a === 92/* \ */ && bYes ? (src.col--, src.offset--, '') : String.fromCharCode(a);
    const str = cYes || !first ? src.readMatch(rxName)
      : bYes ? (src.col++, src.offset++, String.fromCharCode(b))
        : '';
    const esc = a === 92 || b === 92 || c === 92 || str.length > 3 && str.includes('\\');
    const name = esc ? (first + str).replace(rxUnescapeNoLF, unescapeNoLF) : first + str;
    if (!tok)
      return {esc, name};
    let dashed, lc, ovrValue;
    if (esc) {
      cYes = ovrValue = name;
      if (a === 92 || b === 92) b = name.charCodeAt(1);
      if (a === 92) a = tok.code = toLowAscii(name.charCodeAt(0));
    }
    const vpLen = a === 45/*-*/ && (b === 45 ? (dashed = true, 0) : name.indexOf('-', 2) + 1);
    const next = cYes || !first ? src.string.charCodeAt(src.offset) : bYes ? c : b;
    if (dashed) tok.type = '--';
    if (next === 40/*(*/) {
      src.col++; src.offset++;
      lc = name.toLowerCase();
      if ((lc === 'url' || lc === 'url-prefix' || lc === 'domain')
      && (b = this._uriValue(src)) != null) {
        tok.id = URI;
        tok.type = 'uri';
        tok.uri = b;
      } else {
        tok.id = dashed ? DASHED_FUNCTION : FUNCTION;
      }
      tok.name = vpLen ? lc.slice(vpLen) : lc;
      tok.prefix = vpLen ? lc.slice(0, vpLen) : '';
    } else if (next === 58/*:*/ && name === 'progid') {
      ovrValue = name + src.readMatch(/.*?\(/y);
      tok.id = FUNCTION;
      tok.name = ovrValue.slice(0, -1).toLowerCase();
      tok.type = 'ie';
    } else {
      tok.id = IDENT;
      if (!dashed) {
        if (a === 45/*-*/ || (b = name.length) < 3 || b > 20) {
          tok.type = 'ident'; // named color min length is 3 (red), max is 20 (lightgoldenrodyellow)
        } else if (a === 110/*n*/ && name.length === 4 && name.toLowerCase() === 'none') {
          tok.type = 'none';
        }
      }
    }
    if (vpLen) {
      tok.vendorCode = lc ? lc.charCodeAt(vpLen) : toLowAscii(name.charCodeAt(vpLen));
      tok.vendorPos = vpLen;
    }
    return ovrValue;
  }

  _number(src, tok, a, b, bYes, rx) {
    const numStr = String.fromCharCode(a) + (bYes ? (b = src.readMatch(rx, true))[0] : '');
    const isFloat = a === 46/*.*/ || bYes && (b[1] || b[2] || b[3]);
    let ovrText, units;
    a = bYes ? src.string.charCodeAt(src.offset) : b;
    if (a === 37) { // %
      tok.id = PCT;
      tok.type = units = '%';
      src.col++; src.offset++;
    } else if (isIdentStart(a,
      b = a === 45/*-*/ || a === 92/*\*/ ? src.string.charCodeAt(src.offset + 1) : null
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
    tok.is0 = b = !units && !a;
    tok.isInt = b || !units && !isFloat;
    return ovrText;
  }

  /** @param {StringSource} src */
  _spaceCmt(src) {
    const c = src.string.charCodeAt(src.offset);
    return (c === 47/*/*/ || isSpace(c)) && src.readMatch(rxSpaceComments) || '';
  }

  /**
   * Consumes the closing ")" on success
   * @param {StringSource} [src]
   * @return {string|void}
   */
  _uriValue(src) {
    let v = src.peek();
    src.mark();
    v = v === 34/*"*/ || v === 39/*'*/ ? src.read()
      : isSpace(v) && src.readMatch(rxMaybeQuote).trim();
    if (v) {
      v += src.readMatch(v === '"' ? rxStringDoubleQ : rxStringSingleQ);
      v = src.readMatchStr(v[0]) && parseString(v + v[0]);
    } else if ((v = src.readMatch(rxUnquotedUrl)) && v.includes('\\')) {
      v = v.replace(rxUnescapeNoLF, unescapeNoLF);
    }
    if (v != null && (src.readMatchCode(41/*)*/) || src.readMatch(rxSpaceRParen))) {
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
    for (let src = this.source, stack = [], end = inBlock ? 125 : -1; (c = src.peek());) {
      if (c === end || end < 0 && (c === 59/*;*/ || c === 125/*}*/)) {
        end = stack.pop();
        if (!end || end < 0 && c === 125/*}*/) {
          if (end || c === 59/*;*/) src.readCode(); // consuming ; or } of own block
          break;
        }
      } else if (c === 125/*}*/ || c === 41/*)*/ || c === 93/*]*/) {
        break;
      } else if ((c = c === 123 ? 125/*{}*/ : c === 40 ? 41/*()*/ : c === 91 && 93/*[]*/)) {
        stack.push(end);
        end = c;
      }
      src.readCode();
      src.readMatch(end > 0 ? rxDeclBlock : rxDeclValue);
    }
    this._resetBuf();
  }
}

/** Functions for @ symbols */
const ATS = {
  __proto__: null,

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  apply(stream, start) {
    const at = start.atName;
    let brace, ret, retType;
    let name = stream.grab();
    if (name.id === DASHED_FUNCTION)
      name = this._function(stream, name, true);
    else if (!(at === 'apply' && name.id === IDENT && name.type === '--'))
      stream._failure('Expecting "--name(" or "--name"', name);
    if (at === 'function' && (ret = stream.matchSmart(IDENT, B.returns))) {
      if ((retType = this._expr(stream, LBRACE, true, true))) {
        name.returns = TokenValue.from(retType, ret);
        stream.unget();
      } else {
        this.alarm(2, 'Expecting <css-type>');
      }
    }
    if ((brace = stream.matchSmart(LBRACE, at !== 'apply' && OrDie))) {
      this._block(stream, start, {
        brace,
        decl: true,
        event: [at, {name}],
        scoped: true,
      });
    }
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  charset(stream, start) {
    const charset = stream.matchSmart(STRING, OrDie);
    stream.matchSmart(SEMICOLON, OrDie);
    this.fire({type: 'charset', charset}, start);
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  container(stream, start) {
    let name, next;
    do {
      // <container-name>? <container-query>?
      name = stream.matchSmart(IDENT);
      if (B.andNoneNotOr.has(name))
        name = stream.unget();
      next = stream.grab(); // TODO: collect conditions array instead
      this._at = start.atName;
      this._condition(stream, next, this._containerCondition);
      this._at = undefined;
      if (next !== stream.token)
        next = null;
      else if (!name)
        throw new ParseError('Expecting name or condition', next);
    } while (next?.id === COMMA || stream.match(COMMA));
    this._block(stream, start, {event: ['container']});
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  document(stream, start) {
    if (this._stack.length) this.alarm(2, 'Nested @document produces broken code', start);
    const functions = [];
    do {
      const tok = stream.matchSmart(TT.docFunc);
      const uri = tok.uri != null;
      const fn = uri ? TokenFunc.from(tok) : tok.name && this._function(stream, tok);
      if (fn && (uri || fn.name === 'regexp')) functions.push(fn);
      else this.alarm(1, 'Unknown document function', fn);
    } while (stream.matchSmart(COMMA));
    const brace = stream.matchSmart(LBRACE, OrDie);
    this.fire({type: 'startdocument', brace, functions, start}, start);
    if (this.options.topDocOnly) {
      stream.skipDeclBlock(true);
      stream.matchSmart(RBRACE, OrDie);
    } else {
      this._block(stream, start, {brace});
    }
    this.fire({type: 'enddocument', start, functions});
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  env(stream, start) {
    if (this._inStyle < 2 && this._stack.some(({start: s}) => s && s.atName !== 'document'))
      this.alarm(1, 'Ignoring @env outside of nested style/group', start);
    const name = stream.matchSmart(IDENT, OrDie);
    const expr = this._expr(stream, COLON);
    const value = this._expr(stream, TT.propCustomEnd);
    if (stream.token.id !== SEMICOLON)
      stream.unget();
    this.fire({type: 'env', start, name, expr, value});
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  'font-face'(stream, start) {
    this._block(stream, start, {
      decl: true,
      event: ['fontface', {}],
      scoped: true,
    });
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  'font-palette-values'(stream, start) {
    this._block(stream, start, {
      decl: true,
      event: ['fontpalettevalues', {id: stream.matchSmart(IDENT, OrDie)}],
      scoped: true,
    });
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  import(stream, start) {
    let layer, name, tok;
    const uri = (tok = stream.matchSmart(TT.stringUri, OrDie)).uri || tok.string;
    if ((name = (tok = stream.grab()).name) === 'layer' || !name && B.layer.has(tok)) {
      layer = name ? this._layerName(stream) : '';
      if (name) stream.matchSmart(RPAREN, OrDie);
      name = (tok = stream.grab()).name;
    }
    if (name === 'supports') {
      this._conditionInParens(stream, {id: LPAREN});
      tok = null;
    }
    const media = this._mediaQueryList(stream, tok);
    stream.matchSmart(SEMICOLON, OrDie);
    this.fire({type: 'import', layer, media, uri}, start);
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  keyframes(stream, start) {
    const prefix = start.vendorPos ? start.text.slice(0, start.vendorPos) : '';
    const name = stream.matchSmart(TT.identString, OrDie);
    stream.matchSmart(LBRACE, OrDie);
    this.fire({type: 'startkeyframes', name, prefix}, start);
    let tok, ti;
    while (true) {
      const keys = [];
      do {
        ti = (tok = stream.grab()).id;
        if (ti === PCT || ti === IDENT && B.fromTo.has(tok)) keys.push(tok);
        else if (!keys[0]) break;
        else stream._failure('percentage%, "from", "to"', tok);
      } while ((ti = (tok = stream.grab()).id) === COMMA);
      if (!keys[0]) break;
      this._block(stream, keys[0], {
        decl: true,
        brace: ti === LBRACE ? tok : stream.unget(),
        event: ['keyframerule', {keys}],
      });
    }
    if (ti !== RBRACE) stream.matchSmart(RBRACE, OrDie);
    this.fire({type: 'endkeyframes', name, prefix});
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  layer(stream, start) {
    const ids = [];
    let tok;
    do {
      if ((tok = stream.grab()).id === IDENT) {
        ids.push(this._layerName(stream, tok));
        tok = stream.grab();
      }
      if (tok.id === LBRACE) {
        if (this.options.globalsOnly) {
          this.stream.token = start;
          throw ATS_GLOBAL;
        }
        if (ids[1]) this.alarm(1, '@layer block cannot have multiple ids', start);
        this._block(stream, start, {brace: tok, event: ['layer', {id: ids[0]}]});
        return;
      }
    } while (tok.id === COMMA);
    stream.matchSmart(SEMICOLON, {must: 1, reuse: tok});
    this.fire({type: 'layer', ids}, start);
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  media(stream, start) {
    const media = this._mediaQueryList(stream);
    this._block(stream, start, {event: ['media', {media}]});
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  namespace(stream, start) {
    const prefix = stream.matchSmart(IDENT).text;
    const tok = stream.matchSmart(TT.stringUri, OrDie);
    const uri = tok.uri || tok.string;
    stream.matchSmart(SEMICOLON, OrDie);
    this.fire({type: 'namespace', prefix, uri}, start);
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  page(stream, start) {
    const tok = stream.matchSmart(IDENT);
    if (B.auto.has(tok)) stream._failure();
    const id = tok.text;
    const pseudo = stream.match(COLON) && stream.matchOrDie(IDENT).text;
    this._block(stream, start, {
      decl: true,
      event: ['page', {id, pseudo}],
      margins: true,
      scoped: true,
    });
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  property(stream, start) {
    const name = stream.matchSmart(IDENT, OrDie);
    this._block(stream, start, {
      decl: true,
      event: ['property', {name}],
      scoped: true,
    });
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  scope(stream, start) {
    const mark = stream.source.mark();
    let a, b;
    let tok = stream.grab();
    try {
      if (tok.id === LPAREN) {
        a = this._selectorsGroup(stream, undefined, false, true);
        stream.matchSmart(RPAREN, OrDieReusing);
        tok = stream.grab();
      }
      if (a && B.to.has(tok)) {
        stream.matchSmart(LPAREN, OrDie);
        b = this._selectorsGroup(stream, undefined, false, true);
        stream.matchSmart(RPAREN, OrDieReusing);
        tok = stream.grab();
      }
      tok = stream.matchSmart(LBRACE, OrDieReusing);
    } catch (err) {
      stream.source.reset(mark);
      stream._resetBuf();
      this._declarationFailed(stream, err);
      return;
    }
    this._inScope++;
    // TODO: reuse csslint::known-pseudos rule to throw on pseudo-element selectors per spec
    this._block(stream, start, {event: ['scope', {start: a, end: b}], brace: tok});
    this._inScope--;
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  supports(stream, start) {
    this._condition(stream, undefined, this._supportsCondition);
    this._block(stream, start, {event: ['supports']});
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  'view-transition'(stream, start) {
    this._block(stream, start, {decl: true, event: ['view-transition'], scoped: true});
  },
};

ATS.function = ATS.mixin = ATS.apply;
ATS['position-try'] = stream => stream.skipDeclBlock();

/** topDocOnly mode */
const ATS_TDO = pick(ATS, ['document']);

/** @-rules at the top level of the stylesheet */
const ATS_GLOBAL = pick(ATS, ['charset', 'import', 'layer', 'namespace']);

const MAX_DURATION = 10 * 60e3;
const TRIM_DELAY = 10e3;
// all blocks since page load; key = text between block start and { inclusive
const data = new Map();
// nested block stack
const stack = [];
// performance.now() of the current parser
let generation = null;
// performance.now() of the first parser after reset or page load,
// used for weighted sorting in getBlock()
let generationBase = null;
let parser = null;
let stream = null;

/**
* Caches the results and reuses them on subsequent parsing of the same code
*/
function init(newParser) {
  parser = newParser;
  if (!parser) {
    data.clear();
    stack.length = 0;
    generationBase = performance.now();
    return;
  }
  stream = parser.stream;
  generation = performance.now();
  trim();
}

function addEvent(event) {
  if (!parser) return;
  for (let i = stack.length; --i >= 0;) {
    const {offset, offset2, events} = stack[i];
    if (event.offset >= offset && (!offset2 || event.offset <= offset2)) {
      events.push(event);
      return;
    }
  }
}

function findBlock(token = getToken()) {
  if (!token || !stream) return;
  const src = stream.source;
  const {string} = src;
  const start = token.offset;
  const key = string.slice(start, string.indexOf('{', start) + 1);
  let block = data.get(key);
  if (!block || !(block = getBlock(block, string, start, key))) return;
  shiftBlock(block, start, token.line, token.col, string);
  src.offset = block.offset2;
  src.line = block.line2;
  src.col = block.col2;
  stream._resetBuf();
  return true;
}

function startBlock(start = getToken()) {
  if (!start || !stream) return;
  stack.push({
    text: '',
    events: [],
    generation: generation,
    line: start.line,
    col: start.col,
    offset: start.offset,
    line2: undefined,
    col2: undefined,
    offset2: undefined,
  });
  return stack.length;
}

function endBlock(end = getToken()) {
  if (!parser || !stream) return;
  const block = stack.pop();
  block.line2 = end.line;
  block.col2 = end.col + end.offset2 - end.offset;
  block.offset2 = end.offset2;
  const {string} = stream.source;
  const start = block.offset;
  const key = string.slice(start, string.indexOf('{', start) + 1);
  block.text = string.slice(start, block.offset2);
  let blocks = data.get(key);
  if (!blocks) data.set(key, (blocks = []));
  blocks.push(block);
}

function cancelBlock(pos) {
  if (pos === stack.length) stack.length--;
}

function feedback({messages}) {
  messages = new Set(messages);
  for (const blocks of data.values()) {
    for (const block of blocks) {
      if (!block.events.length) continue;
      if (block.generation !== generation) continue;
      const {line: L1, col: C1, line2: L2, col2: C2} = block;
      let isClean = true;
      for (const msg of messages) {
        const {line, col} = msg;
        if (L1 === L2 && line === L1 && C1 <= col && col <= C2 ||
          line === L1 && col >= C1 ||
          line === L2 && col <= C2 ||
          line > L1 && line < L2) {
          messages.delete(msg);
          isClean = false;
        }
      }
      if (isClean) block.events.length = 0;
    }
  }
}

/**
 * Removes old entries from the cache.
 * 'Old' means older than MAX_DURATION or half the blocks from the previous generation(s).
 * @param {Boolean} [immediately] - set internally when debounced by TRIM_DELAY
 */
function trim(immediately) {
  if (!immediately) {
    clearTimeout(trim.timer);
    trim.timer = setTimeout(trim, TRIM_DELAY, true);
    return;
  }
  const cutoff = performance.now() - MAX_DURATION;
  for (const [key, blocks] of data.entries()) {
    const halfLen = blocks.length >> 1;
    const newBlocks = blocks
      .sort((a, b) => a.time - b.time)
      .filter((b, i) => (b = b.generation) > cutoff || b !== generation && i < halfLen);
    if (!newBlocks.length) {
      data.delete(key);
    } else if (newBlocks.length !== blocks.length) {
      data.set(key, newBlocks);
    }
  }
}

// gets the matching block
function getBlock(blocks, input, start, key) {
  // extracted to prevent V8 deopt
  const keyLast = Math.max(key.length - 1);
  const check1 = input[start];
  const check2 = input[start + keyLast];
  const generationSpan = performance.now() - generationBase;
  blocks = blocks
    .filter(({text, offset, offset2}) =>
      text[0] === check1 &&
      text[keyLast] === check2 &&
      text[text.length - 1] === input[start + text.length - 1] &&
      text.startsWith(key) &&
      text === input.substr(start, offset2 - offset))
    .sort((a, b) =>
      // newest and closest will be the first element
      (a.generation - b.generation) / generationSpan +
      (Math.abs(a.offset - start) - Math.abs(b.offset - start)) / input.length);
  // identical blocks may produce different reports in CSSLint
  // so we need to either hijack an older generation block or make a clone
  const block = blocks.find(b => b.generation !== generation);
  return block || deepCopy(blocks[0]);
}

// Shifts positions of the block and its events, also fires the events
function shiftBlock(block, cursor, line, col, input) {
  // extracted to prevent V8 deopt
  const deltaLines = line - block.line;
  const deltaCols = block.col === 1 && col === 1 ? 0 : col - block.col;
  const deltaOffs = cursor - block.offset;
  const hasDelta = deltaLines || deltaCols || deltaOffs;
  const shifted = new Set();
  for (const e of block.events) {
    if (hasDelta) {
      applyDelta(e, shifted, block.line, deltaLines, deltaCols, deltaOffs, input);
    }
    parser.fire(e, false);
  }
  block.generation = generation;
  block.col2 += block.line2 === block.line ? deltaCols : 0;
  block.line2 += deltaLines;
  block.offset2 = cursor + block.text.length;
  block.line += deltaLines;
  block.col += deltaCols;
  block.offset = cursor;
}

// Recursively applies the delta to the event and all its nested parts
function applyDelta(obj, seen, line, lines, cols, offs, input) {
  if (seen.has(obj)) return;
  seen.add(obj);
  if (Array.isArray(obj)) {
    for (let i = 0, v; i < obj.length; i++) {
      if ((v = obj[i]) && typeof v === 'object') {
        applyDelta(v, seen, line, lines, cols, offs, input);
      }
    }
    return;
  }
  for (let i = 0, keys = Object.keys(obj), k, v; i < keys.length; i++) {
    k = keys[i];
    if (k === 'col' ? (cols && obj.line === line && (obj.col += cols), 0)
      : k === 'col2' ? (cols && obj.line2 === line && (obj.col2 += cols), 0)
      : k === 'line' ? (lines && (obj.line += lines), 0)
      : k === 'line2' ? (lines && (obj.line2 += lines), 0)
      : k === 'offset' ? (offs && (obj.offset += offs), 0)
      : k === 'offset2' ? (offs && (obj.offset2 += offs), 0)
      : k === '_input' ? (obj._input = input, 0)
      : k !== 'target' && (v = obj[k]) && typeof v === 'object'
    ) {
      applyDelta(v, seen, line, lines, cols, offs, input);
    }
  }
}

// returns next token if it's already seen or the current token
function getToken() {
  return parser && (stream.peekCached() || stream.token);
}

function deepCopy(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepCopy);
  }
  const copy = Object.create(Object.getPrototypeOf(obj));
  for (let arr = Object.keys(obj), k, v, i = 0; i < arr.length; i++) {
    v = obj[k = arr[i]];
    copy[k] = !v || typeof v !== 'object' ? v : deepCopy(v);
  }
  return copy;
}

var parserCache = {
  __proto__: null,
  addEvent: addEvent,
  cancelBlock: cancelBlock,
  endBlock: endBlock,
  feedback: feedback,
  findBlock: findBlock,
  init: init,
  startBlock: startBlock
};

const textToTokenMap = obj => Object.keys(obj).reduce((res, k) =>
  (((res[TokenIdByCode[k.charCodeAt(0)]] = obj[k]), res)), []);

/** Functions for selectors */
const SELECTORS = textToTokenMap({

  '&': (stream, tok) => assign(tok, {type: 'amp', args: []}),
  '#': (stream, tok) => assign(tok, {type: 'id', args: []}),

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} tok
   */
  '.'(stream, tok) {
    const t2 = stream.matchOrDie(IDENT);
    if (isOwn(t2, 'text')) tok.text = '.' + t2.text;
    tok.offset2 = t2.offset2;
    tok.type = 'class';
    return tok;
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  '['(stream, start) {
    const t1 = stream.matchSmart(TT.attrStart, OrDie);
    let t2, ns, name, eq, val, mod, end;
    stream._pair = RBRACKET;
    if (t1.id === PIPE) { // [|
      ns = t1;
    } else if (t1.id === STAR) { // [*
      ns = t1;
      ns.offset2 = stream.matchOrDie(PIPE).offset2;
      if (ns.length > 2) ns.text = '*|'; // comment inside
    } else if ((t2 = stream.get()).id === PIPE) { // [ns|
      ns = t1;
      ns.offset2++;
    } else if (isOwn(TT.attrEq, t2.id)) { // [name=, |=, ~=, ^=, *=, $=
      name = t1;
      eq = t2;
    } else if (isOwn(TT.attrNameEnd, t2.id)) { // [name], [name/*[[var]]*/, [name<WS>
      name = t1;
      end = t2.id === RBRACKET && t2;
    } else { // [name<?>
      stream._failure('"]"', t2);
    }
    name = name || stream.matchOrDie(IDENT);
    if (!eq && !end) {
      if ((t2 = stream.matchSmart(TT.attrEqEnd, OrDie)).id === RBRACKET) end = t2; else eq = t2;
    }
    if (eq) {
      val = stream.matchSmart(TT.identString, OrDie);
      if ((t2 = stream.grab()).id === RBRACKET) end = t2;
      else if (B.attrIS.has(t2)) mod = t2;
      else stream._failure(B.attrIS, t2);
    }
    start.args = [
      /*0*/ ns || '',
      /*1*/ name,
      /*2*/ eq || '',
      /*3*/ val || '',
      /*4*/ mod || '',
    ];
    start.type = 'attribute';
    start.offset2 = (end || stream.matchSmart(RBRACKET, OrDie)).offset2;
    stream._pair = 0;
    return start;
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} tok
   */
  ':'(stream, tok) {
    const colons = stream.match(COLON) ? '::' : ':';
    tok = stream.matchOrDie(TT.pseudo);
    tok.col -= colons.length;
    tok.offset -= colons.length;
    tok.type = 'pseudo';
    let expr, n, x, lax;
    if ((n = tok.name)) {
      stream._pair = RPAREN;
      if (n === 'nth-child' || n === 'nth-last-child') {
        expr = stream.readNthChild();
        const t1 = stream.get();
        const t2 = t1.id === WS ? stream.grab() : t1;
        if (expr && B.of.has(t2)) n = 'not';
        else if (t2.id === RPAREN) x = true;
        else stream._failure('', t1);
      }
      if (n === 'not' || (lax = n === 'is' || n === 'where' || n === 'any') || n === 'has') {
        x = this._selectorsGroup(stream, undefined, n === 'has', lax);
        if (!x) stream._failure('a selector');
        if (expr) expr.push(...x); else expr = x;
        stream.matchSmart(RPAREN, OrDieReusing);
      } else if (!x) {
        expr = this._expr(stream, RPAREN, true);
      }
      tok = TokenFunc.from(tok, expr, stream.token);
      stream._pair = 0;
    }
    tok.args = expr && expr.parts || [];
    return tok;
  },
});

/* eslint-disable class-methods-use-this */

const Parens = []; Parens[LBRACE] = RBRACE; Parens[LBRACKET] = RBRACKET; Parens[LPAREN] = RPAREN;
const isRelativeSelector = sel => isOwn(TT.combinator, sel.parts[0].id);
const toStringPropHack = function () { return this.hack + this.text; };

//#region Parser public API

class Parser extends EventDispatcher {
  static AT = ATS;
  /**
   * @param {Object} [options]
   * @param {TokenStream} [options.stream]
   * @param {boolean} [options.ieFilters] - accepts IE < 8 filters instead of throwing
   * @param {boolean} [options.noValidation] - skip syntax validation
   * @param {boolean} [options.globalsOnly] - stop after all _fnGlobals()
   * @param {boolean} [options.starHack] - allows IE6 star hack
   * @param {boolean} [options.strict] - stop on errors instead of reporting them and continuing
   * @param {boolean} [options.topDocOnly] - quickly extract all top-level @-moz-document,
     their {}-block contents is retrieved as text using _simpleBlock()
   * @param {boolean} [options.underscoreHack] - interprets leading _ as IE6-7 for known props
   */
  constructor(options) {
    super();
    this.options = options || {};
    /** @type {TokenStream} */
    this.stream = null;
    /** @type {number} @scope rule nesting depth: when > 0 relative and &-selectors are allowed */
    this._inScope = 0;
    /** @type {number} style rule nesting depth: when > 0 &-selectors are allowed */
    this._inStyle = 0;
    /** @type {(RuleBlockOpts & {start: Token})[]} ancestor {} blocks */
    this._stack = [];
    this._events = null;
  }

  /** 2 and above = error, 2 = error (recoverable), 1 = warning, anything else = info */
  alarm(level, msg, token) {
    this.fire({
      type: level >= 2 ? 'error' : level === 1 ? 'warning' : 'info',
      message: msg,
      recoverable: level <= 2,
    }, token);
  }
  /**
   * @param {string|Object} e
   * @param {Token} [tok=this.stream.token] - sets the position
   */
  fire(e, tok = e.offset != null ? e : this.stream.token) {
    if (this._events) {
      this._events.push(arguments);
      return;
    }
    if (typeof e === 'string') e = {type: e};
    if (tok && e.offset == null) { e.offset = tok.offset; e.line = tok.line; e.col = tok.col; }
    if (tok !== false) addEvent(e);
    super.fire(e);
  }

  parse(input, {reuseCache} = {}) {
    const stream = this.stream = new TokenStream(input);
    const opts = this.options;
    const atAny = !opts.globalsOnly && this._unknownAtRule;
    const atFuncs = !atAny ? ATS_GLOBAL : opts.topDocOnly ? ATS_TDO : ATS;
    init(reuseCache && this);
    this.fire('startstylesheet');
    for (let ti, fn, tok; (ti = (tok = stream.grab()).id);) {
      try {
        if (ti === AT && (fn = atFuncs[tok.atName] || atAny)) {
          fn.call(this, stream, tok);
        } else if (ti === CDCO) {
          // Skipping cruft
        } else if (!atAny) {
          stream.unget();
          break;
        } else if (!this._styleRule(stream, tok) && stream.grab().id) {
          stream._failure();
        }
      } catch (ex) {
        if (ex === ATS_GLOBAL) {
          break;
        }
        if (ex instanceof ParseError && !opts.strict) {
          this.fire(assign({}, ex, {type: 'error', error: ex}));
        } else {
          ex.message = (ti = ex.stack).includes(fn = ex.message) ? ti : `${fn}\n${ti}`;
          ex.line = tok.line;
          ex.col = tok.col;
          throw ex;
        }
      }
    }
    this.fire('endstylesheet');
  }

  //#endregion
  //#region Parser @-rules utilities

  /**
   * @param {TokenStream} stream
   * @param {Token} [tok]
   * @param {function} [fn]
   */
  _condition(stream, tok = stream.grab(), fn) {
    if (B.not.has(tok)) {
      this._conditionInParens(stream, undefined, fn);
    } else {
      let more;
      do { this._conditionInParens(stream, tok, fn); tok = undefined; }
      while ((more = stream.matchSmart(IDENT, !more ? B.andOr : B.or.has(more) ? B.or : B.and)));
    }
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} [tok]
   * @param {function} [fn]
   */
  _conditionInParens(stream, tok = stream.matchSmart(TT.condition), fn) {
    let x, reuse, paren;
    if (fn && fn.call(this, stream, tok)) ; else if (tok.name) {
      this._function(stream, tok);
      reuse = 0;
    } else if (tok.id === LPAREN && (paren = tok, tok = stream.matchSmart(TT.condition))) {
      if (fn && fn.call(this, stream, tok, paren)) ; else if (tok.id !== IDENT) {
        this._condition(stream, tok);
      } else if (B.not.has(tok)) {
        this._conditionInParens(stream);
      } else if ((x = stream.matchSmart(TT.mediaOp)).id !== LPAREN) { // a definition/comparison
        if (x.id === COLON) {
          this._declaration(stream, tok, {colon: x, inParens: true, scope: this._at});
          reuse = 0;
        } else if (stream.matchSmart(TT.mediaValue).id === NUMBER && stream.matchSmart(DIV)) {
          stream.matchOrDie(NUMBER, '', stream.grab());
        }
      } else if (x) { // (
        this._expr(stream, RPAREN, true);
        reuse = true; // )
      }
    }
    if (reuse !== 0) stream.matchSmart(RPAREN, {must: 1, reuse});
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} tok
   * @param {Token} [paren]
   * @return {boolean|void}
   */
  _containerCondition(stream, tok, paren) {
    if (paren && tok.id === IDENT) {
      stream.unget();
      this._mediaExpression(stream, paren);
    } else if (!paren && B.containerFn.has(tok)) {
      this._condition(stream, {id: LPAREN});
    } else {
      return;
    }
    stream.unget();
    return true;
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} [start]
   * @return {string}
   */
  _layerName(stream, start) {
    let res = '';
    let tok;
    while ((tok = !res && start || (res ? stream.match(IDENT) : stream.matchSmart(IDENT)))) {
      res += tok.text;
      if (stream.match(DOT)) res += '.';
      else break;
    }
    return res;
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} start
   */
  _margin(stream, start) {
    this._block(stream, start, {
      decl: true,
      event: ['pagemargin', {margin: start}],
    });
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} [start]
   * @return {Token}
   */
  _mediaExpression(stream, start = stream.grab()) {
    if (start.id !== LPAREN) stream._failure(LPAREN);
    const feature = stream.matchSmart(TT.mediaValue, OrDie);
    feature.expr = this._expr(stream, RPAREN, true); // TODO: alarm on invalid ops
    feature.offset2 = stream.token.offset2; // including ")"
    stream.matchSmart(RPAREN, OrDieReusing);
    return feature;
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} [tok]
   * @return {TokenValue[]}
   */
  _mediaQueryList(stream, tok) {
    const list = [];
    while ((tok = stream.matchSmart(TT.mediaList, {reuse: tok}))) {
      const expr = [];
      const mod = B.notOnly.has(tok) && tok;
      const next = mod ? stream.matchSmart(TT.mediaList, OrDie) : tok;
      const type = next.id === IDENT && next;
      if (!type) expr.push(this._mediaExpression(stream, next));
      for (let more; stream.matchSmart(IDENT, more || (type ? B.and : B.andOr));) {
        if (!more) more = B.and.has(stream.token) ? B.and : B.or;
        expr.push(this._mediaExpression(stream));
      }
      tok = TokenValue.from(expr, mod || next);
      tok.type = type;
      list.push(tok);
      if (!stream.matchSmart(COMMA)) break;
      tok = null;
    }
    return list;
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} tok
   * @param {Token} [paren]
   * @return {boolean|void}
   */
  _supportsCondition(stream, tok, paren) {
    if (!paren && tok.name === 'selector') {
      tok = this._selector(stream);
      stream.unget();
      this.fire({type: 'supportsSelector', selector: tok}, tok);
      return true;
    }
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} start
   */
  _unknownAtRule(stream, start) {
    if (this.options.strict) throw new ParseError('Unknown rule: ' + start, start);
    stream.skipDeclBlock();
  }

  //#endregion
  //#region Parser selectors

  /**
   * Warning! The next token is consumed
   * @param {TokenStream} stream
   * @param {Token} [tok]
   * @param {boolean} [relative]
   * @param {boolean} [lax]
   * @return {TokenValue<TokenSelector>[]|void}
   */
  _selectorsGroup(stream, tok, relative, lax) {
    const selectors = [];
    let comma;
    while ((tok = this._selector(stream, tok, relative)) || lax) {
      if (tok) selectors.push(tok);
      if ((tok = stream.token).isVar) tok = stream.grab();
      if (!(comma = tok.id === COMMA)) break;
      tok = null;
    }
    if (comma) stream._failure();
    if (selectors[0]) return selectors;
  }

  /**
   * Warning! The next token is consumed
   * @param {TokenStream} stream
   * @param {Token} [tok]
   * @param {boolean} [relative]
   * @return {TokenValue<TokenSelector>|void}
   */
  _selector(stream, tok, relative) {
    const sel = [];
    if (!tok || tok.isVar) {
      tok = stream.grab();
    }
    if (!relative || !isOwn(TT.combinator, tok.id)) {
      tok = this._simpleSelectorSequence(stream, tok);
      if (!tok) return;
      sel.push(tok);
      tok = null;
    }
    for (let combinator, ws; ; tok = null) {
      if (!tok) tok = stream.token;
      if (isOwn(TT.combinator, tok.id)) {
        sel.push(this._combinator(stream, tok));
        sel.push(this._simpleSelectorSequence(stream) || stream._failure());
        continue;
      }
      while (tok.isVar) tok = stream.get();
      ws = tok.id === WS && tok; if (!ws) break;
      tok = stream.grab(); if (tok.id === LBRACE) break;
      combinator = isOwn(TT.combinator, tok.id) && this._combinator(stream, tok);
      tok = this._simpleSelectorSequence(stream, combinator ? undefined : tok);
      if (tok) {
        sel.push(combinator || this._combinator(stream, ws));
        sel.push(tok);
      } else if (combinator) {
        stream._failure();
      }
    }
    return TokenValue.from(sel);
  }

  /**
   * @typedef {Token & {
   * ns: string|Token
   * elementName: string|Token
   * modifiers: Token[]
   * }} TokenSelector
   */
  /**
   * Warning! The next token is consumed
   * @param {TokenStream} stream
   * @param {Token} [start]
   * @return {TokenSelector|void}
   */
  _simpleSelectorSequence(stream, start = stream.grab()) {
    let si = start.id;
    // --var:foo {...} allowed only as a declaration
    if (start.type === '--' || !isOwn(TT.selectorStart, si)) return;
    let ns, tag, t2;
    let tok = start;
    const mods = [];
    while (si === AMP) {
      mods.push(SELECTORS[AMP](stream, tok));
      si = (tok = stream.get()).id;
    }
    if (si === PIPE || (si === STAR || si === IDENT) && (t2 = stream.get()).id === PIPE) {
      ns = t2 ? tok : ''; tok = null;
    } else if (t2) {
      tag = tok; tok = t2;
    }
    if (ns && !(tag = stream.match(TT.identStar))) {
      if (si !== PIPE) stream.unget();
      return;
    }
    while (true) {
      if (!tok) tok = stream.get();
      const fn = SELECTORS[tok.id];
      if (!(tok = fn && fn.call(this, stream, tok))) break;
      mods.push(tok);
      tok = false;
    }
    tok = Token.from(start);
    tok.ns = ns;
    tok.elementName = tag || '';
    tok.modifiers = mods;
    tok.offset2 = (mods[mods.length - 1] || tok).offset2;
    return tok;
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} [tok]
   * @return {Token}
   */
  _combinator(stream, tok = stream.matchSmart(TT.combinator)) {
    if (tok) tok.type = Combinators[tok.code] || 'unknown';
    return tok;
  }

  //#endregion
  //#region Parser declaration

  /**
   * prop: value ["!" "important"]? [";" | ")"]
   * Consumes ")" when inParens is true.
   * When not inParens `tok` must be already vetted.
   * @param {TokenStream} stream
   * @param {Token} tok
   * @param {{}} [_]
   * @param {boolean} [_.colon] - ":" was consumed
   * @param {boolean} [_.inParens] - (declaration) in conditional media
   * @param {string} [_.scope] - name of section with definitions of valid properties
   * @return {boolean|void}
   */
  _declaration(stream, tok, {colon, inParens, scope} = {}) {
    const opts = this.options;
    const isCust = tok.type === '--';
    const hack = tok.hack
      ? (tok = stream.match(IDENT), tok.col--, tok.offset--, '*')
      : tok.code === 95/*_*/ && opts.underscoreHack && tok.id === IDENT && '_';
    const t2mark = !colon && stream.source.mark();
    const t2raw = colon || stream.get();
    const t2WS = t2raw.id === WS;
    const t2 = colon
      || (t2WS || t2raw.isVar) && stream.grab()
      || t2raw;
    let ti3;
    if (hack) {
      tok.hack = hack;
      PDESC.value = tok.text.slice(1); define(tok, 'text', PDESC);
      PDESC.value = toStringPropHack; define(tok, 'toString', PDESC);
    }
    if (t2.id !== COLON || (ti3 = stream.get(UVAR).id) === COLON) {
      while (stream.token !== tok) stream.unget();
      if (!inParens && (ti3 || !isCust || isOwn(TT.nestSelBlock, t2.id))) return;
      if (tok.isVar) return true;
      stream.source.reset(t2mark);
      stream._resetBuf();
      stream._failure('":"', t2raw);
    }
    if (ti3 !== WS) stream.unget();
    // This may be a selector, so we can't report errors upstream yet
    const events = !inParens && !isCust && (ti3 === IDENT || ti3 === FUNCTION)
      && (this._events = []);
    const end = isCust ? TT.propCustomEnd : inParens ? TT.propValEndParen : TT.propValEnd;
    const expr = this._expr(stream, end, isCust);
    const t = stream.token;
    const value = expr || isCust && TokenValue.empty(t);
    const brace = !inParens && t.id === LBRACE;
    if (events) {
      this._events = null;
      if (brace) {
        stream.source.reset(t2mark);
        stream._resetBuf();
        return;
      }
      for (const v of events) this.fire(...v);
    }
    if (brace) {
      stream._pair = RBRACE;
      throw new ParseError(`Unexpected "{" in "${tok}" declaration`, t);
      // TODO: if not as rare as alleged, make a flat array in _expr() and reuse it
    }
    if (!value) {
      if (t.id === RBRACE) stream.unget();
      stream._failure('');
    }
    const invalid = !isCust && !tok.isVar && !opts.noValidation &&
      validateProperty(tok, value, stream, scope);
    const important = t.id === DELIM &&
      stream.matchSmart(IDENT, {must: 1, text: B.important});
    const ti = stream.matchSmart(inParens ? RPAREN : TT.declEnd, {must: 1, reuse: !important}).id;
    this.fire({
      type: 'property',
      property: tok,
      message: invalid && invalid.message,
      important,
      inParens,
      invalid,
      scope,
      value,
    }, tok);
    if (ti === RBRACE) stream.unget();
    return ti;
  }

  /**
   * @param {TokenStream} stream
   * @param {?} err
   * @param {boolean} [inBlock]
   */
  _declarationFailed(stream, err, inBlock) {
    const c = stream._pair;
    if (c) { stream._pair = 0; this._expr(stream, c, true); }
    stream.skipDeclBlock(inBlock);
    this.fire(assign({}, err, {
      type: err.type || 'error',
      recoverable: !stream.source.eof(),
      error: err,
    }));
  }

  /**
   * @param {TokenStream} stream
   * @param {TokenMap|number} end - will be consumed!
   * @param {boolean} [dumb] - <any-value> mode, no additional checks
   * @return {TokenValue|void}
   */
  _expr(stream, end, dumb) {
    const parts = [];
    const isEndMap = typeof end === 'object';
    let /** @type {Token} */ tok, ti, isVar, endParen;
    while ((ti = (tok = stream.get(UVAR, 0)).id) && !(isEndMap ? end[ti] : end === ti)) {
      let dumb2;
      if ((endParen = Parens[ti])) {
        if (!dumb && ti === LBRACE && parts.length) break;
        tok.expr = this._expr(stream, endParen, dumb);
        if (stream.token.id !== endParen) stream._failure(endParen);
        tok.offset2 = stream.token.offset2;
        tok.type = 'block';
      } else if (ti === FUNCTION || (dumb2 = ti === DASHED_FUNCTION)) {
        if (tok.type !== 'ie' || this.options.ieFilters && (dumb2 = true)) {
          tok = this._function(stream, tok, dumb || dumb2);
          isVar = isVar || tok.isVar;
        }
      } else if (ti === UVAR) {
        isVar = true;
      } else if (dumb) ; else if (ti === HASH) {
        this._hexcolor(stream, tok);
      } else if (ti === IDENT && !tok.type && B.colors.has(tok)) {
        tok.type = 'color';
      }
      parts.push(tok);
    }
    if (parts[0]) {
      const res = TokenValue.from(parts);
      if (isVar) res.isVar = true;
      return res;
    }
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} [tok]
   * @param {boolean} [dumb]
   * @return {TokenFunc}
   */
  _function(stream, tok, dumb) {
    return TokenFunc.from(tok, this._expr(stream, RPAREN, dumb), stream.token);
  }

  /**
   * @param {TokenStream} stream
   * @param {Token} tok
   */
  _hexcolor(stream, tok) {
    let text, len, offset, i, c;
    if ((len = tok.length) === 4 || len === 5 || len === 7 || len === 9) {
      if (isOwn(tok, 'text')) text = (offset = 0, tok.text);
      else ({_input: text, offset} = tok);
      for (i = 1; i < len; i++) {
        c = text.charCodeAt(offset + i); // 2-5x faster than slicing+parseInt or regexp
        if ((c < 48 || c > 57) && (c < 65 || c > 70) && (c < 97 || c > 102)) break;
      }
    }
    if (i === len) tok.type = 'color';
    else this.alarm(1, `Expected a hex color but found "${clipString(tok)}".`, tok);
  }

  //#endregion
  //#region Parser rulesets

  /**
   * @prop {Token} [brace]
   * @prop {boolean} [decl] - can contain prop:value declarations
   * @prop {Array|{}} [event] - ['name', {...props}?]
   * @prop {boolean} [margins] - check for the margin @-rules.
   * @prop {boolean} [scoped] - use ScopedProperties for the start token's name
   * @typedef {{}} RuleBlockOpts
   */

  /**
   * A style rule i.e. _selectorsGroup { _block }
   * @param {TokenStream} stream
   * @param {Token} tok
   * @param {RuleBlockOpts} [opts]
   * @return {true|void}
   */
  _styleRule(stream, tok, opts) {
    const canCache = !this._inStyle;
    if (canCache && findBlock(tok)) {
      return true;
    }
    let blk, brace;
    try {
      const amps = tok.id === AMP ? -1 : stream._amp;
      const sels = this._selectorsGroup(stream, tok, true);
      if (!sels) { stream.unget(); return; }
      if (!this._inScope
      && !this._inStyle
      && (stream._amp > amps || sels.some(isRelativeSelector))) {
        this.alarm(2, 'Nested selector must be inside a style rule.', tok);
      }
      brace = stream.matchSmart(LBRACE, OrDieReusing);
      blk = canCache && startBlock(sels[0]);
      const msg = {selectors: sels};
      const opts2 = {brace, decl: true, event: ['rule', msg]};
      this._block(stream, sels[0], opts ? assign({}, opts, opts2) : opts2);
      if (blk && !msg.empty) blk = (endBlock(), 0);
    } catch (ex) {
      if (this.options.strict || !(ex instanceof ParseError)) throw ex;
      this._declarationFailed(stream, ex, !!brace);
      return;
    } finally {
      if (blk) cancelBlock(blk);
    }
    return true;
  }

  /**
   * {}-block that can contain _declaration, @-rule, &-prefixed _styleRule
   * @param {TokenStream} stream
   * @param {Token} start
   * @param {RuleBlockOpts} [opts]
   */
  _block(stream, start, opts = {}) {
    const env = /** @type {RuleBlockOpts} */ {...this._stack[this._stack.length - 1], start};
    const {brace = stream.matchSmart(LBRACE, OrDie), event = []} = opts;
    const decl = env.decl || opts.decl;
    const margins = env.margins || opts.margins;
    const sNew = opts.scoped && ScopedProperties[start.atName];
    const sOld = env.scope;
    const scope = env.scope = sNew ? {...sOld, ...sNew} : sOld;
    const [type, msg = event[1] = {}] = event || [];
    if (type) this.fire(assign({type: 'start' + type, brace}, msg), start);
    const declOpts = {scope};
    const inStyle = (this._inStyle += decl ? 1 : 0);
    const star = inStyle && this.options.starHack && STAR;
    this._stack.push(env);
    let ex, child;
    for (let prevTok, tok, ti, fn; (ti = (tok = stream.get(UVAR, false)).id) !== RBRACE;) {
      if (!ti) stream._failure('}');
      if (ti === SEMICOLON || ti === UVAR && (child = 1)) {
        continue;
      }
      if (tok === prevTok) {
        stream._failure('');
      }
      prevTok = tok;
      try {
        if (ti === AT) {
          fn = tok.atName;
          fn = margins && B.marginSyms.has(fn) && this._margin ||
            ATS[fn] ||
            this._unknownAtRule;
          fn.call(this, stream, tok);
          child = 1;
        } else if (inStyle && (ti === IDENT || ti === star && tok.hack)
            && this._declaration(stream, tok, declOpts)) {
          child = 1;
        } else if (!scope && tok.type !== '--' && (!inStyle || isOwn(TT.nestSel, ti))) {
          child = this._styleRule(stream, tok, opts);
        } else {
          ex = stream._failure('', tok, false);
        }
      } catch (e) {
        ex = e;
      }
      if (ex) {
        if (this.options.strict || !(ex instanceof ParseError)) break;
        this._declarationFailed(stream, ex);
        if (!ti) break;
        ex = null;
      }
    }
    this._stack.pop();
    if (decl) this._inStyle--;
    if (ex) throw ex;
    if (type) { msg.empty = !child; this.fire(assign({type: 'end' + type}, msg)); }
  }
}

//#region Types

var parserlib = {
  css: {
    Combinators,
    GlobalKeywords,
    NamedColors,
    Parser,
    Properties,
    ScopedProperties,
    Tokens,
    TokenStream,
    Units,
  },
  util: {
    Bucket,
    EventDispatcher,
    Matcher,
    StringSource,
    TokenIdByCode,
    VTComplex,
    VTFunctions,
    VTSimple,
    UnitTypeIds,
    cache: parserCache,
    clipString,
    describeProp: vtExplode,
    isOwn,
    pick,
    validateProperty,
  },
};

export { parserlib as default };
//# sourceMappingURL=parserlib.js.map
