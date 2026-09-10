import fs from 'node:fs';

/** @param [transform] - function or a literal value */
export const getInlineConsts = (transform = Number) => Object.fromEntries(
  fs.readFileSync('src/types.d.ts', 'utf8')
    .matchAll(/(?<=declare const )(\w+) = (\d+)/g)
    .map(m => [m[1], typeof transform === 'function' ? transform(m[2]) : transform]),
);
