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
const FAILED_FILE = REPORT_FILE + '.tmp';

(async () => {
  let res;
  for (const [fn, msg] of [
    [testParserlib, 'Testing parserlib internals...'],
    [testCsslint, 'Testing csslint...'],
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
  const extra = report.filter(s => !expected.includes(s));
  const missing = expected.filter(s => !report.includes(s));
  const err = [
    extra[0] ? chalk.red(`\nUNEXPECTED ${extra.length} PROBLEMS:\n`) + extra.join('\n') : '',
    missing[0] ? chalk.red(`\nMISSING ${missing.length} PROBLEMS:\n`) + missing.join('\n') : '',
  ].filter(Boolean).join('\n\n');
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
    for (const [name, spec] of Object.entries(obj)) {
      if (typeof spec === 'string' && !Matcher.cache[spec]) {
        try {
          Matcher.parse(spec);
        } catch (e) {
          console.error(chalk.red('\n' + e.message),
            chalk.bold(`\n  ${name}: ${spec}\n`) + e.stack.replace(/^.+\r?\n/, ''));
          process.exit(1);
        }
      }
    }
  }
  return parserlib;
}
