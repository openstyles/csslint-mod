import {getPropName, parserUtil, registerRuleEvents} from './-util';

export default [{
  desc: 'width or height specified with padding or border and no box-sizing.',
  url: 'Beware-of-box-model-size',
}, (rule, parser, reporter) => {
  const rx = /^(?:(border)|padding)(?:-(?:left|right|(top|bottom)|(?:inline|(block)(?:-(?:start|end))?)))?$/;
  const sizeProps = {width: false, height: true};
  const stack = [];
  const {B} = parserUtil;
  let props, inRule;
  registerRuleEvents(parser, {
    start() {
      stack.push(props);
      inRule = true;
      props = null;
    },
    property(event) {
      if (!inRule || event.inParens)
        return;
      const p = event.property;
      const name = getPropName(p);
      const value = /**@type{TokenValue<Token>}*/event.value;
      const m = rx.exec(name);
      let v;
      if (m) {
        if (!((v = value.parts[0]).number === 0 || m[1] && B.none.has(v))) {
          (props ??= new Map()).set(name, {
            line: p.line,
            col: p.col,
            b: !!m[1], // border***
            h: !!(m[2] || m[3]), // height-related
            value,
          });
        }
      } else if (name === 'box-sizing'
        || name in sizeProps && ((v = value.parts[0].type) === 'length' || v === '%')
      ) {
        (props ??= new Map()).set(name, false);
      }
    },
    end() {
      if (props && props.size > 1 && !props.has('box-sizing')) {
        for (const size in sizeProps) {
          if (!props.has(size))
            continue;
          const h = sizeProps[size];
          for (const [k, v] of props) {
            if (!v || v.b || v.h !== h)
              continue;
            const {value: {parts}, line, col} = v;
            if (parts.length !== 2 || parts[0].number) {
              reporter.report(`No box-sizing and ${size} in ${k}`, {line, col}, rule);
            }
          }
        }
      }
      props = stack.pop();
      inRule = false;
    },
  });
}];
