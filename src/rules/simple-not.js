const isFunc = tok => tok.name;

export default [{
  desc: 'Simple selector must be used inside :not() for backwards compatibility.',
}, (rule, parser, reporter) => {
  parser.addListener('startrule', e => {
    let pp, p, pm, args;
    for (const sel of e.selectors) {
      for (const part of sel.parts) {
        if (!part.modifiers) continue;
        for (const m of part.modifiers) {
          if (m.name === 'not' && (args = m.expr) && (
            args[1] ||
            (pp = args[0].parts)[1] ||
            (pm = (p = pp[0]).modifiers).length + (p.elementName ? 1 : 0) > 1 ||
            pm.some(isFunc)
          )) reporter.report('Complex selector inside :not().', args[0], rule);
        }
      }
    }
  });
}];
