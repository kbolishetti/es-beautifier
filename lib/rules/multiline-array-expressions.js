const create = (context) => {
  const option = context.options[0] || {
    allowSingleLine: true,
    maxLenInSingleLine: 80,
  };
  const allowSingleLine = option.allowSingleLine;
  const maxExpressions = option.maxExpressionsInSingleLine;
  const maxLen = option.maxLenInSingleLine;

  const sourceCode = context.getSourceCode();

  const enterArrayExpression = (node) => {
    if (allowSingleLine &&
        node.loc.start.line === node.loc.end.line &&
        (!maxExpressions || node.elements.length <= maxExpressions) &&
        (!maxLen || sourceCode.lines[node.loc.end.line - 1].length < maxLen)) {
      // we accept one line
      return;
    }

    if (['ArrayExpression', 'Property'].indexOf(node.parent.type) >= 0 &&
        node.loc.start.line === node.loc.end.line &&
        node.loc.start.line === node.parent.loc.start.line) {
      // we ignore this time as we are still in the process
      return;
    }

    let prev = null;
    node.elements.forEach((curr) => {
      if (curr.loc.start.line === (prev ? prev.loc.end.line : node.loc.start.line)) {
        if (curr.type === 'ObjectExpression') {
          // special format for Object in Array
          const first = sourceCode.getFirstToken(curr);
          const last = sourceCode.getLastToken(curr);
          if (first.loc.start.line === last.loc.end.line) {
            context.report({
              curr,
              message: 'ObjectExpression in an array should be multi line.',
              loc: curr.loc.start,
              fix: fixer => fixer.insertTextAfter(first, '\n'),
            });
          }
        } else {
          context.report({
            node,
            message: 'Expression in an array should be on a new line.',
            loc: curr.loc.start,
            fix: fixer => fixer.insertTextBefore(curr, '\n'),
          });
        }
      }
      prev = curr;
    });

    const last = prev;
    if (last && node.loc.end.line === last.loc.end.line &&
        last.type !== 'ObjectExpression') {
      context.report({
        node,
        message: 'Expression in an array should be on a new line.',
        loc: last.loc.end,
        fix: fixer => fixer.insertTextAfter(last, '\n'),
      });
    }
  };

  return {
    ArrayExpression: enterArrayExpression,
  };
};

module.exports = {
  meta: {
    docs: {
      description: 'enforce multi-line expressions in an array',
      category: 'Stylistic Issues',
    },
    fixable: 'whitespace',
    schema: [{
      type: 'object',
      properties: {
        allowSingleLine: { type: 'boolean' },
        maxExpressionsInSingleLine: { type: 'integer' },
        maxLenInSingleLine: { type: 'integer' },
      },
      additionalProperties: false,
    }],
  },
  create,
};