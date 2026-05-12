import R from './selector-newline.js';

export default [{
  desc: R[0].desc + ' unless the subsequent lines are indented.',
  error: R[0].error + ' or indent',
  allowIndent: true,
}, R[1]];
