import Bucket, {B} from './bucket';
import {TokenFunc, TokenValue} from './token';
import {IsDashed, OrDie, OrDieReusing, TT} from './token-stream';
import {documentFuncs, pick} from './util';
import ScopedProperties from './scoped-properties.js';

let fontFeatureSyms, marginSyms;

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
    let brace;
    try {
      this._at = start.atName;
      do {
        // <container-name>? <container-query>?
        const tok = stream.matchSmart(IDENT) || undefined;
        const name = tok && !B.not.has(tok) && tok;
        if (name && (brace = stream.matchSmart(LBRACE)))
          break;
        const cond = this._condition(stream, name ? undefined : tok, this._containerCondition);
        if (!name && !cond)
          stream._failure('name and/or condition', tok);
      } while (stream.match(COMMA));
    } finally {
      this._at = undefined;
    }
    this._block(stream, start, {
      brace: brace || undefined,
      event: ['container'],
    });
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
      if (fn && (uri || documentFuncs[fn.name])) functions.push(fn);
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
  'font-face': declBlock,

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  'font-feature-values'(stream, start) {
    let name = [];
    let tok;
    while ((tok = stream.grab()).id === IDENT)
      name.push(tok);
    if (tok.id === STRING && !name.length)
      name.push(tok);
    else
      stream.unget();
    if (!name.length)
      stream._failure([IDENT, STRING], tok);
    name = TokenValue.from(name);
    this._block(stream, start, {
      decl: true,
      ats: fontFeatureSyms ||=
        new Bucket('annotation character-variant ornaments styleset stylistic swash'),
      event: ['fontfeaturevalues', {name}],
    });
  },

  'font-palette-values': namedDeclBlock,

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  import(stream, start) {
    let layer, name, tok;
    const url = this._stringOrUrl(stream);
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
    this.fire({type: 'import', layer, media, url}, start);
  },

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  keyframes(stream, start) {
    const prefix = start.vendor ? start.text.slice(0, start.vendor >> 16) : '';
    const name = stream.matchSmart(TT.identString, OrDie);
    stream.matchSmart(LBRACE, OrDie);
    this.fire({type: 'startkeyframes', name, prefix}, start);
    let tok, ti;
    while (true) {
      const keys = [];
      do {
        ti = (tok = stream.grab()).id;
        if (ti === PCT) {
          keys.push(tok);
        } else if (ti === IDENT && (tok.type === '--' || B.keyframe.has(tok))) {
          if (tok.type === '--' || (ti = tok.code) !== 102/*from*/ && ti !== 116/*to*/)
            tok.args = [stream.matchSmart(PCT, OrDie)];
          keys.push(tok);
        } else if (!keys.length) {
          break;
        } else {
          stream._failure(`percentage%, --name, "${B.keyframe.join('", "')}"`, tok);
        }
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
    const url = this._stringOrUrl(stream);
    stream.matchSmart(SEMICOLON, OrDie);
    this.fire({type: 'namespace', prefix, url}, start);
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
      ats: marginSyms ||= new Bucket('bottom-center bottom-left-corner bottom-left bottom-right-corner bottom-right left-bottom left-middle left-top right-bottom right-middle right-top top-center top-left-corner top-left top-right-corner top-right'), // eslint-disable-line max-len
      scoped: true,
    });
  },

  property: namedDeclBlock,

  /**
   * @this {Parser}
   * @param {TokenStream} stream
   * @param {Token} start
   */
  'position-try'(stream, start) {
    declBlock.call(this, stream, start, {
      id: stream.matchSmart(IDENT, {text: IsDashed, ...OrDie}),
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
  'starting-style'(stream, start) {
    this._block(stream, start, {decl: this._inStyle, event: ['startingstyle', {}]});
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

  'view-transition': declBlock,
};

/**
 * @this {Parser}
 * @param {TokenStream} stream
 * @param {Token} start
 * @param {{}} [eventOpts]
 */
function declBlock(stream, start, eventOpts) {
  const atName = start.atName;
  this._block(stream, start, {
    decl: true,
    event: [atName.replace(/-/g, ''), eventOpts],
    scoped: !!ScopedProperties[atName],
  });
}

/**
 * @this {Parser}
 * @param {TokenStream} stream
 * @param {Token} start
 */
function namedDeclBlock(stream, start) {
  declBlock.call(this, stream, start, {id: stream.matchSmart(IDENT, OrDie)});
}

ATS.function = ATS.mixin = ATS.apply;
/** topDocOnly mode */
export const ATS_TDO = pick(ATS, ['document']);
/** @-rules at the top level of the stylesheet */
export const ATS_GLOBAL = pick(ATS, ['charset', 'import', 'layer', 'namespace']);
export default ATS;
