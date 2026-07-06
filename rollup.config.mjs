import fse from 'fs-extra';
import pluginJson from '@rollup/plugin-json';

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
    function trimSpacesInGrammar() {
      return {
        name: trimSpacesInGrammar.name,
        transform: (code, id) => !id.endsWith('properties.json') ? null :
          JSON.stringify(JSON.parse(code)).replace(/(?<=[|&[])\s+|\s+(?=[|&\]])/g, ''),
      };
    },
    pluginJson(),
  ],
}];
