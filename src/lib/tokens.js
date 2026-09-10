/** @type {Array<{name: string, text: string|string[]}>} */
const Tokens = [
  {name: 'EOF'}, // EOF must be the first token
  {name: 'AMP', text: '&'},
  {name: 'AT'},
  {name: 'ATTR_EQ', text: ['|=', '~=', '^=', '*=', '$=']},
  {name: 'CDCO'},
  {name: 'CHAR'},
  {name: 'LT', text: '<'},
  {name: 'COLON', text: ':'},
  {name: 'COMBINATOR', text: ['~', '||']}, // Not using "+" and ">" which can be math ops
  {name: 'COMMA', text: ','},
  {name: 'COMMENT'},
  {name: 'DASHED_FUNCTION'},
  {name: 'DELIM', text: '!'},
  {name: 'DIV', text: '/'},
  {name: 'DOT', text: '.'},
  {name: 'EQUALS', text: '='},
  {name: 'EQ_CMP', text: ['>=', '<=']},
  {name: 'FUNCTION'},
  {name: 'GT', text: '>'},
  {name: 'HASH', text: '#'},
  {name: 'IDENT'},
  {name: 'INVALID'},
  {name: 'LBRACE', text: '{'},
  {name: 'LBRACKET', text: '['},
  {name: 'LPAREN', text: '('},
  {name: 'MINUS', text: '-'},
  {name: 'PIPE', text: '|'},
  {name: 'PLUS', text: '+'},
  {name: 'RBRACE', text: '}'},
  {name: 'RBRACKET', text: ']'},
  {name: 'RPAREN', text: ')'},
  {name: 'SEMICOLON', text: ';'},
  {name: 'STAR', text: '*'},
  {name: 'STRING'},
  {name: 'URANGE'},
  {name: 'URI'},
  {name: 'UVAR'},
  {name: 'WS'},
  // numbers
  {name: 'ANGLE'},
  {name: 'DIMENSION'},
  {name: 'FLEX'},
  {name: 'FREQUENCY'},
  {name: 'LENGTH'},
  {name: 'NUMBER'},
  {name: 'PCT'},
  {name: 'RESOLUTION'},
  {name: 'TIME'},
];

export const TokenIdByCode = [];

for (let text, i = 0; i < Tokens.length; i++)
  if ((text = Tokens[i].text))
    for (const str of typeof text === 'string' ? [text] : text)
      if (str.length === 1) TokenIdByCode[str.charCodeAt(0)] = i;

export default Tokens;
