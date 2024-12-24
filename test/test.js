import fs from 'fs';
import chalk from 'chalk';

/**
 * Usage notes:
 * When testCsslint() fails, it creates a temporary report file.
 * Inspect it and either fix the source code or rename it to overwrite test.css.txt.
*/

const DIR = import.meta.dirname;
const TEST_FILE = DIR + '/test.css';
const REPORT_FILE = TEST_FILE + '.txt';
const FAILED_FILE = TEST_FILE + '.error.tmp';

(async () => {
  let res;
  for (const [fn, msg] of [
    [testCsslint, 'Testing csslint...'],
    [testParserlib, 'Testing parserlib internals...'],
  ]) {
    if (msg) process.stdout.write(msg);
    res = fn(res);
    if (res instanceof Promise) res = await res;
    if (msg) console.log(' OK');
  }
  console.log(chalk.green('CSS tests OK'));
  process.exit(0);
})();

function fail(what, str) {
  console.log('\r' + chalk.bgRed(what + ' FAILED\n') + str);
  process.exit(1);
}

async function testCsslint() {
  const {default: csslint} = await import('../src/csslint');
  const rules = {...csslint.getRuleSet(), 'style-rule-nesting': 0};
  const report = csslint
    .verify(fs.readFileSync(TEST_FILE, 'utf8'), rules)
    .messages.map(m => `${m.type}\t${m.line}\t${m.col}\t${m.message}`);
  const expected = fs.readFileSync(REPORT_FILE, 'utf8').trim().split(/\r?\n/);
  let a, b, i, err;
  for (i = 0; (a = report[i]) && (b = expected[i]); i++) {
    if (a !== b) {
      err = chalk.red(`\n* RECEIVED: ${a}\n`) + `  EXPECTED: ${b}\n`;
      break;
    }
  }
  i = report.length - expected.length;
  if (i) {
    a = Math.abs(i);
    err = (err || '') + '\n' +
      (i > 0 ? `Found ${a} extra un` : `Did not find ${a} `) +
      `expected problem${a === 1 ? '' : 's'}:\n  * ` +
      (i > 0 ? report : expected).slice(-a).join('\n  * ');
  }
  if (err) {
    fs.writeFileSync(FAILED_FILE, report.join('\n'), 'utf8');
    fail('csslint', err);
  }
}

async function testParserlib() {
  const {default: parserlib} = await import('../src/parserlib');
  const {Matcher} = parserlib.util;
  for (const obj of [
    parserlib.css.Properties,
    parserlib.util.VTComplex,
    ...Object.values(parserlib.util.VTFunctions),
  ]) {
    for (const spec of Object.values(obj)) {
      if (typeof spec === 'string' && !Matcher.cache[spec]) {
        Matcher.parse(spec);
      }
    }
  }
  return parserlib;
}
