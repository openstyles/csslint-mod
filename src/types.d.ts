declare const EOF = 0;
declare const AMP = 1;
declare const AT = 2;
declare const ATTR_EQ = 3;
declare const CDCO = 4;
declare const CHAR = 5;
declare const LT = 6;
declare const COLON = 7;
declare const COMBINATOR = 8;
declare const COMMA = 9;
declare const COMMENT = 10;
declare const DASHED_FUNCTION = 11;
declare const DELIM = 12;
declare const DIV = 13;
declare const DOT = 14;
declare const EQUALS = 15;
declare const EQ_CMP = 16;
declare const FUNCTION = 17;
declare const GT = 18;
declare const HASH = 19;
declare const IDENT = 20;
declare const INVALID = 21;
declare const LBRACE = 22;
declare const LBRACKET = 23;
declare const LPAREN = 24;
declare const MINUS = 25;
declare const PIPE = 26;
declare const PLUS = 27;
declare const RBRACE = 28;
declare const RBRACKET = 29;
declare const RPAREN = 30;
declare const SEMICOLON = 31;
declare const STAR = 32;
declare const STRING = 33;
declare const URANGE = 34;
declare const URI = 35;
declare const UVAR = 36; /*[[userstyles-org-variable]]*/
declare const WS = 37;
// numbers
declare const ANGLE = 38;
declare const DIMENSION = 39;
declare const FLEX = 40;
declare const FREQUENCY = 41;
declare const LENGTH = 42;
declare const NUMBER = 43;
declare const PCT = 44;
declare const RESOLUTION = 45;
declare const TIME = 46;

// token.is bit masks
declare const IS_0 = 1;
declare const IS_ATTR = 2;
declare const IS_CALC = 4;
declare const IS_INT = 8;
/** var(), env(), /*[[var]]*_/ */
declare const IS_VAR = 16;

/** Replaced with a literal character code of the string at build time */
declare function CC(str: string): number;
