/* eslint-disable max-len */
export const _borderShorthand = '<border-shorthand>';
const _positionArea = (
  // TODO: fix Matcher::many() so we don't have to reorder || groups to the end of | chain
  '[%]{1,2}' +
  ' | [%self-]{1,2}' +
  ' | [left|right|span-left|span-right|x-start|x-end|span-x-start|span-x-end|%self-x-]' +
  ' || [top|bottom|span-top|span-bottom|y-start|y-end|span-y-start|span-y-end|%self-y-]' +
  ' | [%block-] || [%inline-]' +
  ' | [%self-block-] || [%self-inline-]'
).replace(/%([-\w]*)/g, '$1start|center|$1end|span-$1start|span-$1end|span-all');
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
  '<axis>': 'block | inline | x | y',
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
  /** @param {typeof Matcher} M */
  '<border-image-slice>': M => M.term('<num-pct0+>').braces(1, 4, '', '', M.term('fill')),
  '<border-radius-round>': 'round <border-radius>',
  '<border-shorthand>': '<line-width> || <line-style> || <color>',
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
  '<grid-line>': 'auto | [ <int> && <ident-for-grid>? ] | <ident-for-grid> | ' +
    '[ span && [ <int> || <ident-for-grid> ] ]',
  '<hue-interpolation-method>': '[shorter|longer|increasing|decreasing] hue',
  '<image>': '<image-no-set> | image-set( <image-set># )',
  '<image-no-set>': '<url> | <fn:gradients> | image( <color> ) | -webkit-cross-fade()',
  '<image-set>': '[ <image-no-set> | <string> ] [ <resolution> || type( <string> ) ]',
  '<inflexible-breadth>': '<len-pct> | min-content | max-content | auto',
  '<inset-value>': '<len-pct> | overlap-join',
  '<line-height>': '<num> | <len-pct> | normal',
  '<line-names>': '"[" <ident-for-grid> "]"',
  '<line-style>': 'none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset',
  '<line-width>': '<len0+> | thin | medium | thick',
  '<linear-color-stop>': '<color> <len-pct>{0,2}',
  '<masking-mode>': 'alpha | luminance | match-source',
  '<overflow-position>': 'unsafe | safe',
  '<overflow>': '<vis-hid> | clip | scroll | auto | overlay', // TODO: warning about `overlay`
  '<overscroll>': 'contain | none | auto | chain',
  '<paint>': 'none | <color> | <url> [ none | <color> ]? | context-fill | context-stroke',
  '<polar-color-space>': 'hsl | hwb | lch | oklch',
  // Because our `alt` combinator is ordered, we need to test these
  // in order from longest possible match to shortest.
  '<position>':
    '[ [ left | right ] <len-pct> ] && [ [ top | bottom ] <len-pct> ] | ' +
    '[ left | center | right | <len-pct> ] ' +
    '[ top | center | bottom | <len-pct> ]? | ' +
    '[ left | center | right ] || [ top | center | bottom ]',
  '<position-area>': _positionArea,
  '<position-area-query>': _positionArea.replace(/]/g, '|any]'),
  '<predefined-rgb>': 'srgb|srgb-linear|display-p3|display-p3-linear|a98-rgb|prophoto-rgb|rec2020',
  '<ratio>': '<num0+> [ / <num0+> ]?',
  '<radial-extent>': 'closest-corner | closest-side | farthest-corner | farthest-side',
  '<relative-size>': 'smaller | larger',
  '<repeat-style>': 'repeat-x | repeat-y | [ repeat | space | round | no-repeat ]{1,2}',
  '<rectangular-color-space>': '<predefined-rgb>|lab|oklab|<xyz-space>',
  '<rule-color>': M => _makeGapRule(M, '<color>'),
  '<rule-style>': M => _makeGapRule(M, '<line-style>'),
  '<rule-width>': M => _makeGapRule(M, '<line-width>'),
  '<rule>': M => _makeGapRule(M, _borderShorthand),
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
  '<try-tactic>': 'flip-block || flip-inline || flip-start || flip-x || flip-y',
  '<txbhv>': 'normal | allow-discrete',
  '<url>': '<uri> | url( <string> <fn:urlModifier>* ) | src( <string> <fn:urlModifier>* )',
  '<vis-hid>': 'visible | hidden',
  '<width-base>': '<len-pct> | min-content | max-content | fit-content | stretch | contain | ' +
    '-moz-available | -webkit-fill-available | anchor-size() | calc-size()',
  '<xyz-space>': 'xyz | xyz-d50 | xyz-d65',
};
/** @param {typeof Matcher} M */
const _makeGapRule = (M, type) =>
  M.parse(`${type} | repeat( <int1+> , ${type}# )`)
    .braces(0, Infinity, '#', ',', M.parse(`repeat( auto , ${type}# )`));

export default VTComplex;
