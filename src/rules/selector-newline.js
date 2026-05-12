export default [{
  desc: 'A new line between selectors is a forgotten comma and not a descendant combinator.',
  error: 'Line break in selector without ","',
}, (rule, parser, reporter) => {
  const {allowIndent, error} = rule;
  parser.addListener('startrule', event => {
    for (const {parts} of event.selectors) {
      for (let i = 0, /**@type{TokenSelector}*/p, /**@type{TokenSelector}*/pn, indent;
           i < parts.length - 1 && (p = parts[i]);
           i++) {
        if (!indent)
          indent = p.col;
        else if (p.type === 'descendant'
            && (pn = parts[i + 1]).line > p.line
            && (!allowIndent || pn.col <= indent)) {
          reporter.report(error, pn, rule);
        }
      }
    }
  });
}];
