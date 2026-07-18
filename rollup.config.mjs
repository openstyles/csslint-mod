import fse from 'fs-extra';
import pluginJson from '@rollup/plugin-json';
import pluginRe from 'rollup-plugin-re';

const DST = 'dist/';
const OUTPUT = {
  dir: DST,
  entryFileNames: `[name].js`,
  sourcemap: true,
  externalLiveBindings: false,
  freeze: false,
};
fse.emptyDir(DST);

export default [{
  input: 'src/csslint.js',
  output: {...OUTPUT, name: 'CSSLint'},
  external: ['./parserlib.js', '../parserlib.js'],
}, {
  input: 'src/parserlib.js',
  output: {...OUTPUT, name: 'parserlib'},
  plugins: [
    pluginRe({
      patterns: [{
        match: '**/properties.json',
        test: /(?<=[|&[])\s+|\s+(?=[|&\]])/g,
        replace: '',
      }],
    }),
    pluginJson({
      indent: '  ',
      namedExports: false,
    }),
  ],
}];
