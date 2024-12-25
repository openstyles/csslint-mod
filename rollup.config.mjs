import fse from 'fs-extra';

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
  external: './parserlib.js',
}, {
  input: 'src/parserlib.js',
  output: {...OUTPUT, name: 'parserlib'},
}];
