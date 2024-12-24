A fork of the original CSSLint Build v0.10.0 15-August-2013 01:07:22, heavily modified since then as a part of [Stylus extension](https://github.com/openstyles/stylus), now extracted to a separate repo.

* Supports modern CSS syntax including nesting, grids, complex selectors in pseudo selectors like `:has()`.
* Verifies function arguments including the modern `color-mix()`, `hwb()`, etc.
* Partly rewritten and mostly refactored to use modern JS.
* Small minified size: ~80kB parser with all the CSS specs and grammar, ~26kB rule checker.
* Somewhat optimized for speed: ~2x faster than stylelint with a dozen of simple rules and up to 10x in the subsequent runs while editing the CSS in the browser thanks to a primitive cache that reuses results from the previous run.
* New rules:
  * [known-pseudos](src/rules/known-pseudos.js): require known `:pseudo` or `::pseudo` selector
  * [shorthand-overrides](src/rules/shorthand-overrides.js): require a shorthand to precede an individual property
  * [simple-not](src/rules/simple-not.js): require a simple selector in `:not()`
  * [selector-newline](src/rules/selector-newline.js): warn if descendant selector is on a new line
  * [style-rule-nesting](src/rules/style-rule-nesting.js): warn if CSS nesting is used
* No support for CLI or extra formatters.

WIP:
- [ ] Get CSS specs from MDN or csstree or W3C. Doesn't seem entirely straightforward so far: there are mistakes/omissions in some definitions.

TODO:

- [ ] Make the embedded `/* csslint */` comments work with caching.
- [ ] Update the old CSSLint rules and remove the obsolete ones.
- [ ] Adopt the most popular/useful rules from other linters.
- [ ] Check validity of `calc()` and other math functions.
- [ ] Restore the JSDoc comments from the original CSSLint?
