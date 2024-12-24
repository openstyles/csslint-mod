import parserlib from './parserlib.js';

let shorthands, shorthandsFor;

/** Gets the lower-cased text without vendor prefix */
function getPropName(prop) {
  const low = prop.lowText ??= prop.text.toLowerCase();
  const vp = prop.vendorPos;
  return vp ? low.slice(vp) : low;
}

function registerRuleEvents(parser, {start, property, end}) {
  for (const e of [
    'container',
    'fontface',
    'keyframerule',
    'media',
    'page',
    'pagemargin',
    'rule',
    'supports',
    'viewport',
  ]) {
    if (start) parser.addListener('start' + e, start);
    if (end) parser.addListener('end' + e, end);
  }
  if (property) parser.addListener('property', property);
}

function registerShorthandEvents(parser, {property, end}) {
  const stack = [];
  let props;
  registerRuleEvents(parser, {
    start() {
      stack.push(props);
      props = null;
    },
    property(event) {
      if (!stack.length || event.inParens) return;
      const name = getPropName(event.property);
      const sh = (shorthandsFor || makeShorthandsFor())[name];
      if (sh) {
        if (!props) props = {};
        (props[sh] || (props[sh] = {}))[name] = event;
      } else if (property && props && name in shorthands) {
        property(event, props, name);
      }
    },
    end(event) {
      if (end && props) {
        if (!shorthands) makeShorthands();
        end(event, props);
      }
      props = stack.pop();
    },
  });
}

function makeShorthands() {
  shorthands = Object.create(null);
  shorthandsFor = Object.create(null);
  const WSC = 'width|style|color';
  const TBLR = 'top|bottom|left|right';
  for (const [sh, pattern, ...args] of [
    ['animation', '%-1',
      'name|duration|timing-function|delay|iteration-count|direction|fill-mode|play-state'],
    ['background', '%-1', 'image|size|position|repeat|origin|clip|attachment|color'],
    ['border', '%-1-2', TBLR, WSC],
    ['border-top', '%-1', WSC],
    ['border-left', '%-1', WSC],
    ['border-right', '%-1', WSC],
    ['border-bottom', '%-1', WSC],
    ['border-block-end', '%-1', WSC],
    ['border-block-start', '%-1', WSC],
    ['border-image', '%-1', 'source|slice|width|outset|repeat'],
    ['border-inline-end', '%-1', WSC],
    ['border-inline-start', '%-1', WSC],
    ['border-radius', 'border-1-2-radius', 'top|bottom', 'left|right'],
    ['border-color', 'border-1-color', TBLR],
    ['border-style', 'border-1-style', TBLR],
    ['border-width', 'border-1-width', TBLR],
    ['column-rule', '%-1', WSC],
    ['columns', 'column-1', 'width|count'],
    ['flex', '%-1', 'grow|shrink|basis'],
    ['flex-flow', 'flex-1', 'direction|wrap'],
    ['font', '%-style|%-variant|%-weight|%-stretch|%-size|%-family|line-height'],
    ['grid', '%-1',
      'template-rows|template-columns|template-areas|' +
      'auto-rows|auto-columns|auto-flow|column-gap|row-gap'],
    ['grid-area', 'grid-1-2', 'row|column', 'start|end'],
    ['grid-column', '%-1', 'start|end'],
    ['grid-gap', 'grid-1-gap', 'row|column'],
    ['grid-row', '%-1', 'start|end'],
    ['grid-template', '%-1', 'columns|rows|areas'],
    ['list-style', 'list-1', 'type|position|image'],
    ['margin', '%-1', TBLR],
    ['mask', '%-1', 'image|mode|position|size|repeat|origin|clip|composite'],
    ['outline', '%-1', WSC],
    ['padding', '%-1', TBLR],
    ['text-decoration', '%-1', 'color|style|line'],
    ['text-emphasis', '%-1', 'style|color'],
    ['transition', '%-1', 'delay|duration|property|timing-function'],
  ]) {
    let res = pattern.replace(/%/g, sh);
    args.forEach((arg, i) => {
      res = arg.replace(/[^|]+/g, res.replace(new RegExp(`${i + 1}`, 'g'), '$$&'));
    });
    (shorthands[sh] = res.split('|')).forEach(r => {
      shorthandsFor[r] = sh;
    });
  }
  return shorthands;
}

function makeShorthandsFor() {
  return makeShorthands() && shorthandsFor;
}

class Reporter {
  /**
   * An instance of Report is used to report results of the
   * verification back to the main API.
   * @class Reporter
   * @constructor
   * @param {String[]} lines - The text lines of the source.
   * @param {Object} ruleset - The set of rules to work with, including if
   *      they are errors or warnings.
   * @param {Object} allow - explicitly allowed lines
   * @param {[][]} ignore - list of line ranges to be ignored
   */
  constructor(lines, ruleset, allow, ignore) {
    this.messages = [];
    this.stats = [];
    this.lines = lines;
    this.ruleset = ruleset;
    this.allow = allow || {};
    this.ignore = ignore || [];
  }

  error(message, {line = 1, col = 1}, rule = {}) {
    this.messages.push({
      type: 'error',
      evidence: this.lines[line - 1],
      line, col,
      message,
      rule,
    });
  }

  report(message, {line = 1, col = 1}, rule) {
    if (line in this.allow && rule.id in this.allow[line] ||
      this.ignore.some(range => range[0] <= line && line <= range[1])) {
      return;
    }
    this.messages.push({
      type: this.ruleset[rule.id] === 2 ? 'error' : 'warning',
      evidence: this.lines[line - 1],
      line, col,
      message,
      rule,
    });
  }

  info(message, {line = 1, col = 1}, rule) {
    this.messages.push({
      type: 'info',
      evidence: this.lines[line - 1],
      line, col,
      message,
      rule,
    });
  }

  rollupError(message, rule) {
    this.messages.push({
      type: 'error',
      rollup: true,
      message,
      rule,
    });
  }

  rollupWarn(message, rule) {
    this.messages.push({
      type: 'warning',
      rollup: true,
      message,
      rule,
    });
  }

  stat(name, value) {
    this.stats[name] = value;
  }
}

var ruleBoxModel = [{
  desc: 'width or height specified with padding or border and no box-sizing.',
  url: 'Beware-of-box-model-size',
}, (rule, parser, reporter) => {
  const sizeProps = {
    width: ['border', 'border-left', 'border-right', 'padding', 'padding-left', 'padding-right'],
    height: ['border', 'border-bottom', 'border-top', 'padding', 'padding-bottom', 'padding-top'],
  };
  const stack = [];
  let props;
  registerRuleEvents(parser, {
    start() {
      stack.push(props);
      props = {};
    },
    property(event) {
      if (!props || event.inParens) return;
      const name = getPropName(event.property);
      if (sizeProps.width.includes(name) || sizeProps.height.includes(name)) {
        if (!/^0+\D*$/.test(event.value) &&
          (name !== 'border' || !/^none$/i.test(event.value))) {
          props[name] = {
            line: event.property.line,
            col: event.property.col,
            value: event.value,
          };
        }
      } else if (name === 'box-sizing' ||
        /^(width|height)/i.test(name) &&
        /^(length|%)/.test(event.value.parts[0].type)) {
        props[name] = 1;
      }
    },
    end() {
      if (!props['box-sizing']) {
        for (const size in sizeProps) {
          if (!props[size]) continue;
          for (const prop of sizeProps[size]) {
            if (prop !== 'padding' || !props[prop]) continue;
            const {value: {parts}, line, col} = props[prop];
            if (parts.length !== 2 || parts[0].number) {
              reporter.report(
                `No box-sizing and ${size} in ${prop}`,
                {line, col}, rule);
            }
          }
        }
      }
      props = stack.pop();
    },
  });
}];

var ruleCompatibleVendorPrefixes = [{
  desc: 'Require all compatible vendor prefixes.',
  url: 'Require-compatible-vendor-prefixes',
}, (rule, parser, reporter) => {
  // See http://peter.sh/experiments/vendor-prefixed-css-property-overview/ for details
  const compatiblePrefixes = {
    'animation': 'webkit',
    'animation-delay': 'webkit',
    'animation-direction': 'webkit',
    'animation-duration': 'webkit',
    'animation-fill-mode': 'webkit',
    'animation-iteration-count': 'webkit',
    'animation-name': 'webkit',
    'animation-play-state': 'webkit',
    'animation-timing-function': 'webkit',
    'appearance': 'webkit moz',
    'border-end': 'webkit moz',
    'border-end-color': 'webkit moz',
    'border-end-style': 'webkit moz',
    'border-end-width': 'webkit moz',
    'border-image': 'webkit moz o',
    'border-radius': 'webkit',
    'border-start': 'webkit moz',
    'border-start-color': 'webkit moz',
    'border-start-style': 'webkit moz',
    'border-start-width': 'webkit moz',
    'box-align': 'webkit moz',
    'box-direction': 'webkit moz',
    'box-flex': 'webkit moz',
    'box-lines': 'webkit',
    'box-ordinal-group': 'webkit moz',
    'box-orient': 'webkit moz',
    'box-pack': 'webkit moz',
    'box-sizing': '',
    'box-shadow': '',
    'column-count': 'webkit moz ms',
    'column-gap': 'webkit moz ms',
    'column-rule': 'webkit moz ms',
    'column-rule-color': 'webkit moz ms',
    'column-rule-style': 'webkit moz ms',
    'column-rule-width': 'webkit moz ms',
    'column-width': 'webkit moz ms',
    'flex': 'webkit ms',
    'flex-basis': 'webkit',
    'flex-direction': 'webkit ms',
    'flex-flow': 'webkit',
    'flex-grow': 'webkit',
    'flex-shrink': 'webkit',
    'hyphens': 'epub moz',
    'line-break': 'webkit ms',
    'margin-end': 'webkit moz',
    'margin-start': 'webkit moz',
    'marquee-speed': 'webkit wap',
    'marquee-style': 'webkit wap',
    'padding-end': 'webkit moz',
    'padding-start': 'webkit moz',
    'tab-size': 'moz o',
    'text-size-adjust': 'webkit ms',
    'transform': 'webkit ms',
    'transform-origin': 'webkit ms',
    'transition': '',
    'transition-delay': '',
    'transition-duration': '',
    'transition-property': '',
    'transition-timing-function': '',
    'user-modify': 'webkit moz',
    'user-select': 'webkit moz ms',
    'word-break': 'epub ms',
    'writing-mode': 'epub ms',
  };
  const applyTo = [];
  let properties = [];
  let inKeyFrame = false;
  let started = 0;

  for (const prop in compatiblePrefixes) {
    const variations = compatiblePrefixes[prop].split(' ').map(s => `-${s}-${prop}`);
    compatiblePrefixes[prop] = variations;
    applyTo.push(...variations);
  }

  parser.addListener('startrule', () => {
    started++;
    properties = [];
  });

  parser.addListener('startkeyframes', event => {
    started++;
    inKeyFrame = event.prefix || true;
    if (inKeyFrame && typeof inKeyFrame === 'string') {
      inKeyFrame = '-' + inKeyFrame + '-';
    }
  });

  parser.addListener('endkeyframes', () => {
    started--;
    inKeyFrame = false;
  });

  parser.addListener('property', event => {
    if (!started) return;
    const name = event.property.text;
    if (inKeyFrame &&
        typeof inKeyFrame === 'string' &&
        name.startsWith(inKeyFrame) ||
        !applyTo.includes(name)) {
      return;
    }
    properties.push(event.property);
  });

  parser.addListener('endrule', () => {
    started = false;
    if (!properties.length) return;
    const groups = {};
    for (const name of properties) {
      for (const prop in compatiblePrefixes) {
        const variations = compatiblePrefixes[prop];
        if (!variations.includes(name.text)) {
          continue;
        }
        if (!groups[prop]) {
          groups[prop] = {
            full: variations.slice(0),
            actual: [],
            actualNodes: [],
          };
        }
        if (!groups[prop].actual.includes(name.text)) {
          groups[prop].actual.push(name.text);
          groups[prop].actualNodes.push(name);
        }
      }
    }
    for (const prop in groups) {
      const value = groups[prop];
      const actual = value.actual;
      const len = actual.length;
      if (value.full.length <= len) continue;
      for (const item of value.full) {
        if (!actual.includes(item)) {
          const spec = len === 1 ? actual[0] : len === 2 ? actual.join(' and ') : actual.join(', ');
          reporter.report(
            `"${item}" is compatible with ${spec} and should be included as well.`,
            value.actualNodes[0], rule);
        }
      }
    }
  });
}];

var ruleDisplayPropertyGrouping = [{
  desc: 'Must use properties compatible with the value of `display`.',
  url: 'Require-properties-appropriate-for-display',
}, (rule, parser, reporter) => {
  let props;
  const propertiesToCheck = {
    'display': 1,
    'float': 'none',
    'height': 1,
    'width': 1,
    'margin': 1,
    'margin-left': 1,
    'margin-right': 1,
    'margin-bottom': 1,
    'margin-top': 1,
    'padding': 1,
    'padding-left': 1,
    'padding-right': 1,
    'padding-bottom': 1,
    'padding-top': 1,
    'vertical-align': 1,
  };
  const stack = [];
  const reportProperty = (name, display, msg) => {
    const prop = props[name];
    if (prop && propertiesToCheck[name] !== prop.value.toLowerCase()) {
      reporter.report(msg || `"${name}" can't be used with display: ${display}.`, prop, rule);
    }
  };
  const INLINE = ['height', 'width', 'margin', 'margin-top', 'margin-bottom'];
  const TABLE = ['margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'float'];
  registerRuleEvents(parser, {
    start() {
      stack.push(props);
      props = {};
    },
    property(event) {
      if (!props || event.inParens) return;
      const name = getPropName(event.property);
      if (name in propertiesToCheck) {
        props[name] = {
          value: event.value.text,
          line: event.property.line,
          col: event.property.col,
        };
      }
    },
    end() {
      let v;
      if (props && (v = props.display)) {
        v = v.value.toLowerCase();
        if (v === 'inline') {
          for (const p of INLINE) reportProperty(p, v);
          reportProperty('float', v,
            '"display:inline" has no effect on floated elements ' +
            '(but may be used to fix the IE6 double-margin bug).');
        } else if (v === 'block') {
          reportProperty('vertical-align', v);
        } else if (v === 'inline-block') {
          reportProperty('float', v);
        } else if (v && /^table-/i.test(v)) {
          for (const p of TABLE) reportProperty(p, v);
        }
      }
      props = stack.pop();
    },
  });
}];

var ruleDuplicateBackgroundImages = [{
  desc: 'Same background-image must be extracted to a common class.',
  url: 'Disallow-duplicate-background-images',
}, (rule, parser, reporter) => {
  const stack = {};
  parser.addListener('property', event => {
    if (!/^-(webkit|moz|ms|o)-background(-image)$/i.test(event.property.text)) {
      return;
    }
    for (const part of event.value.parts) {
      if (part.type !== 'uri') continue;
      const uri = stack[part.uri];
      if (!uri) {
        stack[part.uri] = event;
      } else {
        reporter.report(rule.desc + `. First declared at ${uri.line}:${uri.col}.`, event, rule);
      }
    }
  });
}];

var ruleDuplicateProperties = [{
  desc: 'Duplicate properties must be next to each other; exact duplicates are forbidden.',
  url: 'Disallow-duplicate-properties',
}, (rule, parser, reporter) => {
  const stack = [];
  let props, lastName;
  registerRuleEvents(parser, {
    start() {
      stack.push(props);
      props = {};
    },
    property(event) {
      if (!props || event.inParens) return;
      const property = event.property;
      const name = property.text.toLowerCase();
      const last = props[name];
      const dupValue = last === event.value.text;
      if (last && (lastName !== name || dupValue)) {
        reporter.report(`${dupValue ? 'Duplicate' : 'Ungrouped duplicate'} "${property}".`,
          event, rule);
      }
      props[name] = event.value.text;
      lastName = name;
    },
    end() {
      props = stack.pop();
    },
  });
}];

var ruleEmptyRules = [{
  desc: 'Rule without declarations must be removed.',
  url: 'Disallow-empty-rules',
}, (rule, parser, reporter) => {
  parser.addListener('endrule', event => {
    if (event.empty) reporter.report('Empty rule.', event.selectors[0], rule);
  });
}];

var ruleErrors = [{
  name: 'Parsing Errors',
  desc: 'Recoverable syntax errors.',
}, (rule, parser, reporter) => {
  parser.addListener('error', e => reporter.error(e.message, e, rule));
}];

var ruleFloats = [{
  desc: 'More than 9 `float` declarations. Consider using a grid system instead.',
  url: 'Disallow-too-many-floats',
}, (rule, parser, reporter) => {
  let count = 0;
  parser.addListener('property', ({property, value}) => {
    count +=
      getPropName(property) === 'float' &&
      value.text.toLowerCase() !== 'none';
  });
  parser.addListener('endstylesheet', () => {
    reporter.stat('floats', count);
    if (count >= 10) reporter.rollupWarn(count + ': ' + rule.desc, rule);
  });
}];

var ruleFontFaces = [{
  desc: 'More than 5 web fonts.',
  url: 'Don%27t-use-too-many-web-fonts',
}, (rule, parser, reporter) => {
  let count = 0;
  parser.addListener('startfontface', () => count++);
  parser.addListener('endstylesheet', () => {
    if (count > 5) reporter.rollupWarn(count + ': ' + rule.desc, rule);
  });
}];

var ruleFontSizes = [{
  desc: 'More than 9 `font-size` declarations.',
  url: 'Don%27t-use-too-many-font-size-declarations',
}, (rule, parser, reporter) => {
  let count = 0;
  parser.addListener('property', event => {
    count += getPropName(event.property) === 'font-size';
  });
  parser.addListener('endstylesheet', () => {
    reporter.stat('font-sizes', count);
    if (count >= 10) reporter.rollupWarn(count + ': ' + rule.desc, rule);
  });
}];

var ruleGlobalsInDocument = [{
  desc: 'Nested @import, @charset, @namespace inside @-moz-document.',
}, (rule, parser, reporter) => {
  let level = 0;
  let index = 0;
  parser.addListener('startdocument', () => level++);
  parser.addListener('enddocument', () => level-- * index++);
  const check = event => {
    if (level && index) {
      reporter.report(`A nested @${event.type} is valid only if this @-moz-document section ` +
        'is the first one matched for any given URL.', event, rule);
    }
  };
  parser.addListener('import', check);
  parser.addListener('charset', check);
  parser.addListener('namespace', check);
}];

var ruleGradients = [{
  desc: 'Require all vendor prefixes when using a vendor-prefixed gradient.',
  url: 'Require-all-gradient-definitions',
}, (rule, parser, reporter) => {
  const stack = [];
  let miss;
  registerRuleEvents(parser, {
    start() {
      stack.push(miss);
      miss = null;
    },
    property({inParens, value: {parts: [p]}}) {
      if (inParens) return;
      if (p && p.prefix && /(-|^)gradient$/.test(p.name)) {
        if (!miss) miss = {'-moz-': p, '-webkit-': p};
        delete miss[p.prefix];
      }
    },
    end() {
      let k;
      if (miss && (k = Object.keys(miss))[0]) {
        reporter.report(`Missing ${k.join(',')} prefix${k[1] ? 'es' : ''} for gradient.`,
          miss[k[0]], rule);
      }
      miss = stack.pop();
    },
  });
}];

var ruleIds = [{
  desc: '#id selectors are forbidden.',
  url: 'Disallow-IDs-in-selectors',
}, (rule, parser, reporter) => {
  parser.addListener('startrule', event => {
    for (const sel of event.selectors) {
      const cnt =
        sel.parts.reduce((sum = 0, {modifiers}) =>
          modifiers
            ? modifiers.reduce((sum2, mod) => sum2 + (mod.type === 'id'), 0)
            : sum, 0);
      if (cnt) {
        reporter.report(`Id in selector${cnt > 1 ? '!'.repeat(cnt) : '.'}`, sel, rule);
      }
    }
  });
}];

var ruleImport = [{
  desc: '@import prevents parallel downloads and may be blocked by CSP.',
  url: 'Disallow-%40import',
}, (rule, parser, reporter) => {
  parser.addListener('import', e => {
    reporter.report(rule.desc, e, rule);
  });
}];

var ruleImportant = [{
  desc: 'More than 9 !important declarations.',
  url: 'Disallow-%21important',
}, (rule, parser, reporter) => {
  let count = 0;
  parser.addListener('property', event => {
    if (event.important) {
      count++;
      reporter.report('!important.', event, rule);
    }
  });
  parser.addListener('endstylesheet', () => {
    reporter.stat('important', count);
    if (count >= 10) reporter.rollupWarn(count + ': ' + rule.desc, rule);
  });
}];

var ruleKnownProperties = [{
  desc: 'Unknown property per CSS spec without a vendor prefix.',
  url: 'Require-use-of-known-properties',
}, (rule, parser, reporter) => {
  parser.addListener('property', event => {
    const inv = event.invalid;
    if (inv) reporter.report(inv.message, inv, rule);
  });
}];

var ruleKnownPseudos = [{
  name: 'Require use of known pseudo selectors',
  // eslint-disable-next-line max-len
  url: 'https://developer.mozilla.org/docs/Learn/CSS/Building_blocks/Selectors/Pseudo-classes_and_pseudo-elements',
}, (rule, parser, reporter) => {
  // 1 = requires ":"
  // 2 = requires "::"
  const Func = 4; // must be :function()
  const FuncToo = 8; // both :function() and :non-function
  const WK = 0x10;
  const Moz = 0x20;
  const DEAD = 0xDEAD0000; // deprecated
  const definitions = {
    // elements
    'after': 1 + 2, // also allows ":"
    'backdrop': 2,
    'before': 1 + 2, // also allows ":"
    'cue': 2,
    'cue-region': 2,
    'file-selector-button': 2,
    'first-letter': 1 + 2, // also allows ":"
    'first-line': 1 + 2, // also allows ":"
    'grammar-error': 2,
    'highlight': 2 + Func,
    'marker': 2,
    'part': 2 + Func,
    'placeholder': 2 + Moz,
    'selection': 2 + Moz,
    'slotted': 2 + Func,
    'spelling-error': 2,
    'target-text': 2,
    // classes
    'active': 1,
    'any-link': 1 + Moz + WK,
    'autofill': 1 + WK,
    'blank': 1,
    'checked': 1,
    'current': 1 + FuncToo,
    'default': 1,
    'defined': 1,
    'dir': 1 + Func,
    'disabled': 1,
    'drop': 1,
    'empty': 1,
    'enabled': 1,
    'first': 1,
    'first-child': 1,
    'first-of-type': 1,
    'focus': 1,
    'focus-visible': 1,
    'focus-within': 1,
    'fullscreen': 1,
    'future': 1,
    'has': 1 + Func,
    'host': 1 + FuncToo,
    'host-context': 1 + Func,
    'hover': 1,
    'in-range': 1,
    'indeterminate': 1,
    'invalid': 1,
    'is': 1 + Func,
    'lang': 1 + Func,
    'last-child': 1,
    'last-of-type': 1,
    'left': 1,
    'link': 1,
    'local-link': 1,
    'not': 1 + Func,
    'nth-child': 1 + Func,
    'nth-col': 1 + Func,
    'nth-last-child': 1 + Func,
    'nth-last-col': 1 + Func,
    'nth-last-of-type': 1 + Func,
    'nth-of-type': 1 + Func,
    'only-child': 1,
    'only-of-type': 1,
    'optional': 1,
    'out-of-range': 1,
    'past': 1,
    'paused': 1,
    'picture-in-picture': 1,
    'placeholder-shown': 1,
    'playing': 1,
    'read-only': 1,
    'read-write': 1,
    'required': 1,
    'right': 1,
    'root': 1,
    'scope': 1,
    'state': 1 + Func,
    'target': 1,
    'target-within': 1,
    'user-invalid': 1,
    'valid': 1,
    'visited': 1,
    'where': 1 + Func,
    'xr-overlay': 1,
    // ::-webkit-scrollbar specific classes
    'corner-present': 1,
    'decrement': 1,
    'double-button': 1,
    'end': 1,
    'horizontal': 1,
    'increment': 1,
    'no-button': 1,
    'single-button': 1,
    'start': 1,
    'vertical': 1,
    'window-inactive': 1 + Moz,
  };
  const definitionsPrefixed = {
    'any': 1 + Func + Moz + WK,
    'calendar-picker-indicator': 2 + WK,
    'clear-button': 2 + WK,
    'color-swatch': 2 + WK,
    'color-swatch-wrapper': 2 + WK,
    'date-and-time-value': 2 + WK,
    'datetime-edit': 2 + WK,
    'datetime-edit-ampm-field': 2 + WK,
    'datetime-edit-day-field': 2 + WK,
    'datetime-edit-fields-wrapper': 2 + WK,
    'datetime-edit-hour-field': 2 + WK,
    'datetime-edit-millisecond-field': 2 + WK,
    'datetime-edit-minute-field': 2 + WK,
    'datetime-edit-month-field': 2 + WK,
    'datetime-edit-second-field': 2 + WK,
    'datetime-edit-text': 2 + WK,
    'datetime-edit-week-field': 2 + WK,
    'datetime-edit-year-field': 2 + WK,
    'details-marker': 2 + WK + DEAD,
    'drag': 1 + WK,
    'drag-over': 1 + Moz,
    'file-upload-button': 2 + WK,
    'focus-inner': 2 + Moz,
    'focusring': 1 + Moz,
    'full-page-media': 1 + WK,
    'full-screen': 1 + Moz + WK,
    'full-screen-ancestor': 1 + Moz + WK,
    'inner-spin-button': 2 + WK,
    'input-placeholder': 1 + 2 + WK + Moz,
    'loading': 1 + Moz,
    'media-controls': 2 + WK,
    'media-controls-current-time-display': 2 + WK,
    'media-controls-enclosure': 2 + WK,
    'media-controls-fullscreen-button': 2 + WK,
    'media-controls-mute-button': 2 + WK,
    'media-controls-overlay-enclosure': 2 + WK,
    'media-controls-overlay-play-button': 2 + WK,
    'media-controls-panel': 2 + WK,
    'media-controls-play-button': 2 + WK,
    'media-controls-time-remaining-display': 2 + WK,
    'media-controls-timeline': 2 + WK,
    'media-controls-timeline-container': 2 + WK,
    'media-controls-toggle-closed-captions-button': 2 + WK,
    'media-controls-volume-slider': 2 + WK,
    'media-slider-container': 2 + WK,
    'media-slider-thumb': 2 + WK,
    'media-text-track-container': 2 + WK,
    'media-text-track-display': 2 + WK,
    'media-text-track-region': 2 + WK,
    'media-text-track-region-container': 2 + WK,
    'meter-bar': 2 + WK,
    'meter-even-less-good-value': 2 + WK,
    'meter-inner-element': 2 + WK,
    'meter-optimum-value': 2 + WK,
    'meter-suboptimum-value': 2 + WK,
    'outer-spin-button': 2 + WK,
    'progress-bar': 2 + WK,
    'progress-inner-element': 2 + WK,
    'progress-value': 2 + WK,
    'resizer': 2 + WK,
    'scrollbar': 2 + WK,
    'scrollbar-button': 2 + WK,
    'scrollbar-corner': 2 + WK,
    'scrollbar-thumb': 2 + WK,
    'scrollbar-track': 2 + WK,
    'scrollbar-track-piece': 2 + WK,
    'search-cancel-button': 2 + WK,
    'search-decoration': 2 + WK,
    'slider-container': 2 + WK,
    'slider-runnable-track': 2 + WK,
    'slider-thumb': 2 + WK,
    'textfield-decoration-container': 2 + WK,
  };
  const rx = /^(:+)(?:-(\w+)-)?([^(]+)(\()?/i;
  const allowsFunc = Func + FuncToo;
  const allowsPrefix = WK + Moz;
  const checkSelector = ({parts}) => {
    for (const {modifiers} of parts || []) {
      if (!modifiers) continue;
      for (const mod of modifiers) {
        if (mod.type === 'pseudo') {
          const {text} = mod;
          const [all, colons, prefix, name, paren] = rx.exec(text.toLowerCase()) || 0;
          const defPrefixed = definitionsPrefixed[name];
          const def = definitions[name] || defPrefixed;
          for (const err of !def ? ['Unknown pseudo'] : [
            colons.length > 1
              ? !(def & 2) && 'Must use : in'
              : !(def & 1) && all !== ':-moz-placeholder' && 'Must use :: in',
            paren
              ? !(def & allowsFunc) && 'Unexpected ( in'
              : (def & Func) && 'Must use ( after',
            prefix ?
              (
                !(def & allowsPrefix) ||
                prefix === 'webkit' && !(def & WK) ||
                prefix === 'moz' && !(def & Moz)
              ) && 'Unexpected prefix in'
              : defPrefixed && `Must use ${
                (def & WK) && (def & Moz) && '-webkit- or -moz-' ||
                (def & WK) && '-webkit-' || '-moz-'} prefix in`,
            (def & DEAD) && 'Deprecated',
          ]) {
            if (err) reporter.report(`${err} ${text.slice(0, all.length)}`, mod, rule);
          }
        } else if (mod.args) {
          mod.args.forEach(checkSelector);
        }
      }
    }
  };
  parser.addListener('startrule', e => e.selectors.forEach(checkSelector));
  parser.addListener('supportsSelector', e => checkSelector(e.selector));
}];

var ruleOrderAlphabetical = [{
  desc: 'Properties must be ordered alphabetically.',
}, (rule, parser, reporter) => {
  const stack = [];
  let last, failed;
  registerRuleEvents(parser, {
    start() {
      stack.push({last, failed});
      last = '';
      failed = false;
    },
    property(event) {
      if (event.inParens) return;
      if (!failed) {
        const name = getPropName(event.property);
        if (name < last) {
          reporter.report(`Non-alphabetical order: "${name}".`, event, rule);
          failed = true;
        }
        last = name;
      }
    },
    end() {
      ({last, failed} = stack.pop());
    },
  });
}];

var ruleOutlineNone = [{
  desc: 'none or 0 for `outline` outside of :focus rule.',
  url: 'Disallow-outline%3Anone',
}, (rule, parser, reporter) => {
  let lastRule;
  registerRuleEvents(parser, {
    start(event) {
      lastRule = !event.selectors ? null : {
        line: event.line,
        col: event.col,
        selectors: event.selectors,
        propCount: 0,
        outline: false,
      };
    },
    property(event) {
      if (!lastRule || event.inParens) return;
      lastRule.propCount++;
      if (getPropName(event.property) === 'outline' && /^(none|0)$/i.test(event.value)) {
        lastRule.outline = true;
      }
    },
    end() {
      const {outline, selectors, propCount} = lastRule || {};
      lastRule = null;
      if (!outline) return;
      if (!/:focus/i.test(selectors)) {
        reporter.report('Outlines should only be modified using :focus.', lastRule, rule);
      } else if (propCount === 1) {
        reporter.report("Outlines shouldn't be hidden unless other visual changes are made.",
          lastRule, rule);
      }
    },
  });
}];

var ruleOverqualifiedElements = [{
  desc: '.class or #id after an element tag is forbidden.',
  url: 'Disallow-overqualified-elements',
}, (rule, parser, reporter) => {
  const classes = {};
  const report = (part, mod) => {
    reporter.report(`"${part}" is overqualified, just use "${mod}" without element name.`,
      part, rule);
  };
  parser.addListener('startrule', event => {
    for (const selector of event.selectors) {
      for (const part of selector.parts) {
        if (!part.modifiers) continue;
        for (const mod of part.modifiers) {
          if (part.elementName && mod.type === 'id') {
            report(part, mod);
          } else if (mod.type === 'class') {
            (classes[mod] || (classes[mod] = []))
              .push({modifier: mod, part});
          }
        }
      }
    }
  });
  // one use means that this is overqualified
  parser.addListener('endstylesheet', () => {
    for (const prop of Object.values(classes)) {
      const {part, modifier} = prop[0];
      if (part.elementName && prop.length === 1) {
        report(part, modifier);
      }
    }
  });
}];

var ruleQualifiedHeadings = [{
  desc: 'Qualified headings like `div h1`.',
  url: 'Disallow-qualified-headings',
}, (rule, parser, reporter) => {
  parser.addListener('startrule', event => {
    for (const selector of event.selectors) {
      let first = true;
      for (const part of selector.parts) {
        const name = part.elementName;
        if (!first && name && /h[1-6]/.test(name)) {
          reporter.report(`Heading "${name}" should not be qualified.`, part, rule);
        }
        first = false;
      }
    }
  });
}];

var ruleRegexSelectors = [{
  desc: 'Slow attribute selectors with substring matching (^= $= *=. |= ~=).',
  url: 'Disallow-selectors-that-look-like-regular-expressions',
}, (rule, parser, reporter) => {
  parser.addListener('startrule', event => {
    for (const {parts} of event.selectors) {
      for (const {modifiers} of parts) {
        if (modifiers) {
          for (const mod of modifiers) {
            const eq = mod.type === 'attribute' && mod.args[2];
            if (eq && eq.length === 2) {
              reporter.report(`Slow attribute selector ${eq}.`, eq, rule);
            }
          }
        }
      }
    }
  });
}];

var ruleSelectorNewline = [{
  desc: 'A new line between selectors is a forgotten comma and not a descendant combinator.',
}, (rule, parser, reporter) => {
  parser.addListener('startrule', event => {
    for (const {parts} of event.selectors) {
      for (let i = 0, p, pn; i < parts.length - 1 && (p = parts[i]); i++) {
        if (p.type === 'descendant' && (pn = parts[i + 1]).line > p.line) {
          reporter.report('Line break in selector (forgot a comma?)', pn, rule);
        }
      }
    }
  });
}];

var ruleShorthand = [{
  desc: 'Use shorthand declaration instead of several individual properties.',
  url: 'Require-shorthand-properties',
}, (rule, parser, reporter) => {
  registerShorthandEvents(parser, {
    end(event, props) {
      for (const [sh, events] of Object.entries(props)) {
        const names = Object.keys(events);
        if (names.length === shorthands[sh].length) {
          const msg = `"${sh}" shorthand can replace "${names.join('" + "')}"`;
          names.forEach(n => reporter.report(msg, events[n], rule));
        }
      }
    },
  });
}];

var ruleShorthandOverrides = [{
  desc: 'Use shorthand declarations before individual properties.',
}, (rule, parser, reporter) => {
  registerShorthandEvents(parser, {
    property(event, props, name) {
      const ovr = props[name];
      if (ovr) {
        delete props[name];
        reporter.report(`"${event.property}" overrides "${Object.keys(ovr).join('" + "')}" above.`,
          event, rule);
      }
    },
  });
}];

var ruleSimpleNot = [{
  desc: 'Simple selector must be used inside :not() for backwards compatibility.',
}, (rule, parser, reporter) => {
  parser.addListener('startrule', e => {
    let pp, p;
    for (const sel of e.selectors) {
      for (const part of sel.parts) {
        if (!part.modifiers) continue;
        for (const {name, args} of part.modifiers) {
          if (name === 'not' && args[0] && (
            args[1] ||
            (pp = args[0].parts)[1] ||
            (p = pp[0]).modifiers.length + (p.elementName ? 1 : 0) > 1
          )) reporter.report('Complex selector inside :not().', args[0], rule);
        }
      }
    }
  });
}];

var ruleStarPropertyHack = [{
  desc: 'Forbid star prefixed *property (IE6 hack).',
  url: 'Disallow-star-hack',
}, (rule, parser, reporter) => {
  parser.addListener('property', ({property}) => {
    if (property.hack === '*') {
      reporter.report('IE star prefix.', property, rule);
    }
  });
}];

var ruleStyleRuleNesting = [{
  desc: 'Nesting inside style rules is not backwards-compatible.',
}, (rule, parser, reporter) => {
  registerRuleEvents(parser, {
    start(evt) {
      if (parser._inStyle) reporter.report(rule.desc, evt, rule);
    },
  });
}];

var ruleTextIndent = [{
  desc: 'Large negative text-indent without `direction:ltr` causes problems in RTL languages.',
  url: 'Disallow-negative-text-indent',
}, (rule, parser, reporter) => {
  let textIndent, isLtr;
  registerRuleEvents(parser, {
    start() {
      textIndent = false;
      isLtr = false;
    },
    property(event) {
      if (event.inParens) return;
      const name = getPropName(event.property);
      const value = event.value;
      if (name === 'text-indent' && value.parts[0].number < -99) {
        textIndent = event.property;
      } else if (name === 'direction' && /^ltr$/i.test(value)) {
        isLtr = true;
      }
    },
    end() {
      if (textIndent && !isLtr) reporter.report(rule.desc, textIndent, rule);
    },
  });
}];

var ruleUnderscorePropertyHack = [{
  url: 'Disallow-underscore-hack',
  desc: 'Forbid underscore prefixed _property (IE6 hack).',
}, (rule, parser, reporter) => {
  parser.addListener('property', ({property}) => {
    if (property.hack === '_') {
      reporter.report('IE underscore prefix.', property, rule);
    }
  });
}];

var ruleUniqueHeadings = [{
  desc: 'Forbid redefinition of headings.',
  url: 'Headings-should-only-be-defined-once',
}, (rule, parser, reporter) => {
  const headings = new Array(6).fill(0);
  parser.addListener('startrule', event => {
    for (const {parts} of event.selectors) {
      const p = parts[parts.length - 1];
      if (/h([1-6])/i.test(p.elementName) &&
          !p.modifiers.some(mod => mod.type === 'pseudo') &&
          ++headings[RegExp.$1 - 1] > 1) {
        reporter.report(`Heading ${p.elementName} has already been defined.`, p, rule);
      }
    }
  });
  parser.addListener('endstylesheet', () => {
    const stats = headings
      .filter(h => h > 1)
      .map((h, i) => `${h} H${i + 1}s`);
    if (stats.length) {
      reporter.rollupWarn(stats.join(', '), rule);
    }
  });
}];

var ruleUniversalSelector = [{
  desc: 'Universal selector (*) is slow.',
  url: 'Disallow-universal-selector',
}, (rule, parser, reporter) => {
  parser.addListener('startrule', event => {
    for (const {parts} of event.selectors) {
      const part = parts[parts.length - 1];
      if (part.elementName === '*') {
        reporter.report(rule.desc, part, rule);
      }
    }
  });
}];

var ruleUnqualifiedAttributes = [{
  desc: 'Unqualified attribute selector is slow.',
  name: 'Disallow-unqualified-attribute-selectors',
}, (rule, parser, reporter) => {
  parser.addListener('startrule', event => {
    event.selectors.forEach(({parts}) => {
      const part = parts[parts.length - 1];
      const mods = part.modifiers;
      if (mods && (part.elementName || '*') === '*') {
        let attr;
        for (const m of mods) {
          if (m.type === 'class' || m.type === 'id') return;
          if (m.type === 'attribute') attr = m;
        }
        if (attr) reporter.report(rule.desc, attr, rule);
      }
    });
  });
}];

var ruleVendorPrefix = [{
  desc: 'Require an additional non-prefixed declaration when using vendor prefixes.',
  url: 'Require-standard-property-with-vendor-prefix',
}, (rule, parser, reporter) => {
  const propertiesToCheck = {
    '-webkit-border-radius': 'border-radius',
    '-webkit-border-top-left-radius': 'border-top-left-radius',
    '-webkit-border-top-right-radius': 'border-top-right-radius',
    '-webkit-border-bottom-left-radius': 'border-bottom-left-radius',
    '-webkit-border-bottom-right-radius': 'border-bottom-right-radius',
    '-o-border-radius': 'border-radius',
    '-o-border-top-left-radius': 'border-top-left-radius',
    '-o-border-top-right-radius': 'border-top-right-radius',
    '-o-border-bottom-left-radius': 'border-bottom-left-radius',
    '-o-border-bottom-right-radius': 'border-bottom-right-radius',
    '-moz-border-radius': 'border-radius',
    '-moz-border-radius-topleft': 'border-top-left-radius',
    '-moz-border-radius-topright': 'border-top-right-radius',
    '-moz-border-radius-bottomleft': 'border-bottom-left-radius',
    '-moz-border-radius-bottomright': 'border-bottom-right-radius',
    '-moz-column-count': 'column-count',
    '-webkit-column-count': 'column-count',
    '-moz-column-gap': 'column-gap',
    '-webkit-column-gap': 'column-gap',
    '-moz-column-rule': 'column-rule',
    '-webkit-column-rule': 'column-rule',
    '-moz-column-rule-style': 'column-rule-style',
    '-webkit-column-rule-style': 'column-rule-style',
    '-moz-column-rule-color': 'column-rule-color',
    '-webkit-column-rule-color': 'column-rule-color',
    '-moz-column-rule-width': 'column-rule-width',
    '-webkit-column-rule-width': 'column-rule-width',
    '-moz-column-width': 'column-width',
    '-webkit-column-width': 'column-width',
    '-webkit-column-span': 'column-span',
    '-webkit-columns': 'columns',
    '-moz-box-shadow': 'box-shadow',
    '-webkit-box-shadow': 'box-shadow',
    '-moz-transform': 'transform',
    '-webkit-transform': 'transform',
    '-o-transform': 'transform',
    '-ms-transform': 'transform',
    '-moz-transform-origin': 'transform-origin',
    '-webkit-transform-origin': 'transform-origin',
    '-o-transform-origin': 'transform-origin',
    '-ms-transform-origin': 'transform-origin',
    '-moz-box-sizing': 'box-sizing',
    '-webkit-box-sizing': 'box-sizing',
  };
  const stack = [];
  let props, num;
  registerRuleEvents(parser, {
    start() {
      stack.push({num, props});
      props = {};
      num = 1;
    },
    property(event) {
      if (!props || event.inParens) return;
      const name = getPropName(event.property);
      let prop = props[name];
      if (!prop) prop = props[name] = [];
      prop.push({
        name: event.property,
        value: event.value,
        pos: num++,
      });
    },
    end() {
      const needsStandard = [];
      for (const prop in props) {
        if (prop in propertiesToCheck) {
          needsStandard.push({
            actual: prop,
            needed: propertiesToCheck[prop],
          });
        }
      }
      for (const {needed, actual} of needsStandard) {
        const unit = props[actual][0].name;
        if (!props[needed]) {
          reporter.report(`Missing standard property "${needed}" to go along with "${actual}".`,
            unit, rule);
        } else if (props[needed][0].pos < props[actual][0].pos) {
          reporter.report(
            `Standard property "${needed}" should come after vendor-prefixed property "${actual}".`,
            unit, rule);
        }
      }
      ({num, props} = stack.pop());
    },
  });
}];

var ruleWarnings = [{
  desc: 'Parser warnings.',
}, (rule, parser, reporter) => {
  parser.addListener('warning', e => reporter.report(e.message, e, rule));
}];

var ruleZeroUnits = [{
  desc: 'Unit suffix for "0" is redundant.',
  url: 'Disallow-units-for-zero-values',
}, (rule, parser, reporter) => {
  parser.addListener('property', event => {
    for (const p of event.value.parts) {
      if (p.is0 && p.units && p.type !== 'time') {
        reporter.report('"0" value with redundant units.', p, rule);
      }
    }
  });
}];

// previous CSSLint overrides are used to decide whether the parserlib's cache should be reset
let prevOverrides;

const rxEmbedded = /\/\*\s*csslint\s+((?:[^*]+|\*(?!\/))+?)\*\//ig;
const rxGrammarAbbr = /([-<])(int|len|num|pct|rel-(\w{3}))(?=\W)/g;
const ABBR_MAP = {
  int: 'integer',
  len: 'length',
  num: 'number',
  pct: 'percentage',
  'rel-hsl': 'h-s-l-alpha-none',
  'rel-hwb': 'h-w-b-alpha-none',
  'rel-lab': 'l-a-b-alpha-none',
  'rel-lch': 'l-c-h-alpha-none',
  'rel-rgb': 'r-g-b-alpha-none',
};
const unabbreviate = (_, c, str) => c + (ABBR_MAP[str]) || str;
const EBMEDDED_RULE_VALUE_MAP = {
  // error
  'true': 2,
  '2': 2,
  // warning
  '': 1,
  '1': 1,
  // ignore
  'false': 0,
  '0': 0,
};
const rules = {
  __proto__: null,
  'box-model': ruleBoxModel,
  'compatible-vendor-prefixes': ruleCompatibleVendorPrefixes,
  'display-property-grouping': ruleDisplayPropertyGrouping,
  'duplicate-background-images': ruleDuplicateBackgroundImages,
  'duplicate-properties': ruleDuplicateProperties,
  'empty-rules': ruleEmptyRules,
  'errors': ruleErrors,
  'floats': ruleFloats,
  'font-faces': ruleFontFaces,
  'font-sizes': ruleFontSizes,
  'globals-in-document': ruleGlobalsInDocument,
  'gradients': ruleGradients,
  'ids': ruleIds,
  'import': ruleImport,
  'important': ruleImportant,
  'known-properties': ruleKnownProperties,
  'known-pseudos': ruleKnownPseudos,
  'order-alphabetical': ruleOrderAlphabetical,
  'outline-none': ruleOutlineNone,
  'overqualified-elements': ruleOverqualifiedElements,
  'qualified-headings': ruleQualifiedHeadings,
  'regex-selectors': ruleRegexSelectors,
  'selector-newline': ruleSelectorNewline,
  'shorthand': ruleShorthand,
  'shorthand-overrides': ruleShorthandOverrides,
  'simple-not': ruleSimpleNot,
  'star-property-hack': ruleStarPropertyHack,
  'style-rule-nesting': ruleStyleRuleNesting,
  'text-indent': ruleTextIndent,
  'underscore-property-hack': ruleUnderscorePropertyHack,
  'unique-headings': ruleUniqueHeadings,
  'universal-selector': ruleUniversalSelector,
  'unqualified-attributes': ruleUnqualifiedAttributes,
  'vendor-prefix': ruleVendorPrefix,
  'warnings': ruleWarnings,
  'zero-units': ruleZeroUnits,
};

const CSSLint = Object.assign(new parserlib.util.EventDispatcher(), {

  rules,

  getRuleList() {
    return Object.values(rules)
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id);
  },

  getRuleSet() {
    const ruleset = {};
    // by default, everything is a warning
    for (const id in rules) ruleset[id] = 1;
    return ruleset;
  },

  /**
   * Starts the verification process for the given CSS text.
   * @param {String} text The CSS text to verify.
   * @param {Object} [ruleset] List of rules to apply. If null, then
   *      all rules are used. If a rule has a value of 1 then it's a warning,
   *      a value of 2 means it's an error.
   * @return {Object} Results of the verification.
   */
  verify(text, ruleset = this.getRuleSet()) {
    const allow = {};
    const ignore = [];
    const emi = rxEmbedded.lastIndex =
      text.lastIndexOf('/*',
        text.indexOf('csslint',
          text.indexOf('/*') + 1 || text.length) + 1);
    if (emi >= 0) {
      ruleset = Object.assign({}, ruleset);
      applyEmbeddedOverrides(text, ruleset, allow, ignore);
    }
    const parser = new parserlib.css.Parser({
      starHack: true,
      ieFilters: true,
      underscoreHack: true,
      strict: false,
    });
    const reporter = new Reporter([], ruleset, allow, ignore);
    const {messages} = reporter;
    const report = {messages};
    // TODO: when ruleset is unchanged we can try to invalidate only line ranges in 'allow' and 'ignore'
    const newOvr = [ruleset, allow, ignore];
    const reuseCache = !prevOverrides || JSON.stringify(prevOverrides) === JSON.stringify(newOvr);
    prevOverrides = newOvr;
    // always report parsing errors as errors
    ruleset.errors = 2;
    for (const [id, mode] of Object.entries(ruleset)) {
      const rule = mode && rules[id];
      if (rule) rule.init(rule, parser, reporter);
    }
    try {
      if (ruleset.doc) parser._stack.push(true);
      parser.parse(text, {reuseCache});
    } catch (ex) {
      reporter.error('Fatal error, cannot continue!\n' + ex.stack, ex, {});
    }
    // sort by line numbers, rollups at the bottom
    messages.sort((a, b) => !!a.rollup - !!b.rollup || a.line - b.line || a.col - b.col);
    for (const msg of messages) {
      if ((rxGrammarAbbr.lastIndex = msg.message.indexOf('<')) >= 0) {
        msg.message = msg.message.replace(rxGrammarAbbr, unabbreviate);
      }
    }
    parserlib.util.cache.feedback(report);
    return report;
  },
});

// Example 1:

    /* csslint ignore:start */
    /*
    the chunk of code where errors won't be reported
    the chunk's start is hardwired to the line of the opening comment
    the chunk's end is hardwired to the line of the closing comment
    */
    /* csslint ignore:end */

// Example 2:
// allow rule violations on the current line:

    // foo: bar; /* csslint allow:rulename1,rulename2,... */
    /* csslint allow:rulename1,rulename2,... */ // foo: bar;

// Example 3:

    /* csslint rulename1 */
    /* csslint rulename2:N */
    /* csslint rulename3:N, rulename4:N */

/* entire code is affected;
 * comments futher down the code extend/override previous comments of this kind
 * values for N (without the backquotes):
   `2` or `true` means "error"
   `1` or omitted means "warning" (when omitting, the colon can be omitted too)
   `0` or `false` means "ignore"
*/

function applyEmbeddedOverrides(text, ruleset, allow, ignore) {
  let ignoreStart = null;
  let ignoreEnd = null;
  let lineno = 0;
  let eol = -1;
  let m;

  while ((m = rxEmbedded.exec(text))) {
    // account for the lines between the previous and current match
    while (eol <= m.index) {
      eol = text.indexOf('\n', eol + 1);
      if (eol < 0) eol = text.length;
      lineno++;
    }

    const ovr = m[1].toLowerCase();
    const cmd = ovr.split(':', 1)[0];
    const i = cmd.length + 1;

    switch (cmd.trim()) {

      case 'allow': {
        const allowRuleset = {};
        let num = 0;
        ovr.slice(i).split(',').forEach(allowRule => {
          allowRuleset[allowRule.trim()] = true;
          num++;
        });
        if (num) allow[lineno] = allowRuleset;
        break;
      }

      case 'ignore':
        if (ovr.includes('start')) {
          ignoreStart = ignoreStart || lineno;
          break;
        }
        if (ovr.includes('end')) {
          ignoreEnd = lineno;
          if (ignoreStart && ignoreEnd) {
            ignore.push([ignoreStart, ignoreEnd]);
            ignoreStart = ignoreEnd = null;
          }
        }
        break;

      default:
        ovr.slice(i).split(',').forEach(rule => {
          const pair = rule.split(':');
          const property = pair[0] || '';
          const value = pair[1] || '';
          const mapped = EBMEDDED_RULE_VALUE_MAP[value.trim()];
          ruleset[property.trim()] = mapped === undefined ? 1 : mapped;
        });
    }
  }

  // Close remaining ignore block, if any
  if (ignoreStart) {
    ignore.push([ignoreStart, lineno]);
  }
}

for (const id in rules) {
  const [rule, init] = rules[id];
  rules[id] = rule;
  rule.id = id;
  rule.init = init;
  if (rule.url && !rule.url.includes(':')) {
    rule.url = 'https://github.com/CSSLint/csslint/wiki/' + rule.url;
  }
}

export { CSSLint as default };
//# sourceMappingURL=csslint.js.map
