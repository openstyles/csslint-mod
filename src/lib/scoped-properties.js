import Properties from './properties';
import {pick} from './util';

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

export default ScopedProperties;
