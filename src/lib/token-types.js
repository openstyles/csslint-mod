const convert = (arr, isUvp, res = []) => {
  for (const id of arr) {
    isUvp ||= UVAR_PROXY[id];
    res[id] = true;
  }
  res.isUvp = isUvp;
  return res;
};
/** For these tokens stream.match() will return a UVAR unless the next token is a direct match */
export const UVAR_PROXY = convert([PCT, IDENT, NUMBER, DIMENSION, LENGTH, STRING], true);
export const attrEq = convert([ATTR_EQ, EQUALS]);
export const attrEqEnd = convert([ATTR_EQ, EQUALS, RBRACKET]);
export const attrStart = convert([PIPE, IDENT, STAR]);
export const attrNameEnd = convert([RBRACKET, UVAR, WS]);
export const combinator = convert([PLUS, GT, COMBINATOR]);
export const condition = convert([FUNCTION, IDENT, LPAREN]);
export const declEnd = convert([SEMICOLON, RBRACE]);
export const docFunc = convert([FUNCTION, IDENT/* while typing a new func */, URI]);
export const identStar = convert([IDENT, STAR]);
export const identString = convert([IDENT, STRING]);
export const mediaList = convert([IDENT, LPAREN]);
export const mediaOp = convert([COLON, EQUALS, EQ_CMP, LT, GT, LPAREN]);
export const mediaValue = convert([IDENT, NUMBER, DIMENSION, LENGTH]);
export const propCustomEnd = convert([DELIM, SEMICOLON, RBRACE, RBRACKET, RPAREN, INVALID]);
export const propValEnd = convert([DELIM, SEMICOLON, RBRACE]);
export const propValEndParen = convert([DELIM, SEMICOLON, RBRACE, RPAREN]);
export const pseudo = convert([FUNCTION, IDENT]);
export const selectorStart = convert([AMP, PIPE, IDENT, STAR, HASH, DOT, LBRACKET, COLON]);
export const nestSel = convert([PLUS, GT, COMBINATOR], true, selectorStart.slice());
export const nestSelBlock = convert([LBRACE], true, nestSel.slice());
