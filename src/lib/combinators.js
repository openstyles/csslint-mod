const Combinators = [];
Combinators[CC`\t`] =
Combinators[CC`\n`] =
Combinators[CC`\f`] =
Combinators[CC`\r`] =
Combinators[CC` `] = 'descendant';
Combinators[CC`>`] = 'child';
Combinators[CC`+`] = 'adjacent-sibling';
Combinators[CC`~`] = 'sibling';
Combinators[CC`||`] = 'column';

export default Combinators;
