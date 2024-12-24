import terser from '@rollup/plugin-terser';
import fse from 'fs-extra';
import _merge from 'lodash.merge';
import * as path from 'path';

const PKG = fse.readJsonSync('./package.json');
const {DEV} = process.env;
const DST = path.dirname(PKG.files[0]) + path.sep;
const FORMAT = 'iife';
const TERSER_OPTS = {
  compress: {
    ecma: 8,
    passes: 2,
    reduce_funcs: false,
    unsafe_arrows: true,
  },
  mangle: {
    keep_fnames: true,
  },
  output: {
    ascii_only: false,
    comments: false,
    wrap_func_args: false,
  },
};
const PLUGINS = [
  !DEV && terser(TERSER_OPTS),
];
const CFG = {
  output: {
    dir: DST,
    format: FORMAT,
    entryFileNames: `[name].${FORMAT}.js`,
    sourcemap: DEV ? 'inline' : '',
    externalLiveBindings: false,
    freeze: false,
  },
};

fse.emptyDir(DST);

export default [_merge({}, CFG, {

  input: 'src/csslint.js',
  output: {
    name: 'CSSLint',
    globals: {[path.resolve('./src/parserlib')]: 'parserlib'},
  },
  external: './parserlib',
  plugins: PLUGINS,
}), _merge({}, CFG, {

  input: 'src/parserlib.js',
  output: {name: 'parserlib'},
  plugins: PLUGINS,
}), /*_merge({}, CFG, {

  input: 'src/csslint.js',
  output: {
    format: 'es',
    entryFileNames: 'csslint-parserlib.esm.js',
  },
  plugins: [
    !DEV && terser(_merge({}, TERSER_OPTS, {mangle: {keep_fnames: false}})),
  ],
})*/];
