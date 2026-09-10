import fse from 'fs-extra';
import pluginJson from '@rollup/plugin-json';
import pluginDefine from 'rollup-plugin-define';
import pluginRe from 'rollup-plugin-re';
import {getInlineConsts} from './rollup.util.mjs';

const DST = 'dist/';
const OUTPUT = {
  dir: DST,
  entryFileNames: `[name].js`,
  sourcemap: true,
  externalLiveBindings: false,
  freeze: false,
};
const PLUGINS = [
  pluginDefine({
    replacements: getInlineConsts(String),
  }),
];

fse.emptyDir(DST);

export default [{
  input: 'src/csslint.js',
  output: {...OUTPUT, name: 'CSSLint'},
  external: ['./parserlib.js', '../parserlib.js'],
  plugins: PLUGINS,
}, {
  input: 'src/parserlib.js',
  output: {...OUTPUT, name: 'parserlib'},
  plugins: [
    ...PLUGINS,
    pluginRe({
      patterns: [{
        match: '**/properties.json',
        test: /(?<=[|&[])\s+|\s+(?=[|&\]])/g,
        replace: '',
      }, {
        match: 'src/**/*.js',
        test: /\bCC`(\\(.)|([^`]+))`/g,
        replace: (_, src, esc, b) =>
          (esc === 't' ? 9 : esc === 'n' ? 10 : (esc || b).charCodeAt(0)) + `/*${src}*/`,
      }],
    }),
    pluginJson({
      indent: '  ',
      namedExports: false,
    }),
  ],
}];
