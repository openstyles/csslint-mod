export default [{
  desc: 'Same background-image must be extracted to a common class.',
  url: 'Disallow-duplicate-background-images',
}, (rule, parser, reporter) => {
  const stack = {};
  parser.addListener('property', event => {
    if (!/^(-(webkit|moz|ms|o)-)?background(-image)$/i.test(event.property.text)) {
      return;
    }
    for (const part of event.value.parts) {
      if (part.name !== 'url')
        continue;
      const url = part.uri ?? part.expr.parts[0].string;
      const e = stack[url];
      if (!e) {
        stack[url] = event;
      } else {
        reporter.report(rule.desc + `. First declared at ${e.line}:${e.col}.`, event, rule);
      }
    }
  });
}];
