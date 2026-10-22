import type {ArithmeticOperation, ExactNumericalExpressionNode as Node, ExactNumericNotation, ExactNumericValue, NumericalPowerExpressionProblem} from '../../../types/problems.ts';

// Fixture constructors only assemble literal syntax. All arithmetic results and traces below are independent oracles.
const r = (numerator: number, denominator = 1): ExactNumericValue => ({numerator, denominator});
const n = (id: string, numerator: number, denominator = 1, notation?: ExactNumericNotation): Node => ({id, kind: 'number', value: r(numerator, denominator),
    notation: notation ?? (denominator === 1 ? {kind: 'integer', numeral: String(numerator)} : {kind: 'fraction', numerator, denominator})});
const b = (id: string, operation: ArithmeticOperation, left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const p = (id: string, base: Node, exponent: number): Node => ({id, kind: 'power', base, exponent});
const row = (nodeId: string, numerator: number, denominator = 1) => ({nodeId, value: r(numerator, denominator)});

const a = n('a', 1), c = n('c', 3), d = n('d', 2), left = b('left', 'addition', a, n('b', 2));
const product = (power: Node) => b('product', 'multiplication', c, power);
const sum = (first: Node, second: Node) => b('root', 'addition', first, second);

/** 1+2+3*2^2: power, product, left addition, final addition; never generic postorder. */
export const powerProductFirstOracle: NumericalPowerExpressionProblem = {
    kind: 'numerical-power-expression', expression: sum(left, product(p('power', d, 2))),
    nodeValues: [row('a', 1), row('b', 2), row('left', 3), row('c', 3), row('d', 2), row('power', 4), row('product', 12), row('root', 15)],
    powerFacts: [{nodeId: 'power', kind: 'positive-exponent', baseValue: r(2), exponent: 2, result: r(4), factors: [r(2), r(2)], cumulativeProducts: [r(4)]}],
    reductions: [
        {targetNodeId: 'power', path: ['right', 'right'], evidence: {kind: 'power', baseValue: r(2), exponent: 2, result: r(4)}, after: sum(left, product(n('power', 4)))},
        {targetNodeId: 'product', path: ['right'], evidence: {kind: 'binary', operation: 'multiplication', operands: [r(3), r(4)], result: r(12)}, after: sum(left, n('product', 12))},
        {targetNodeId: 'left', path: ['left'], evidence: {kind: 'binary', operation: 'addition', operands: [r(1), r(2)], result: r(3)}, after: sum(n('left', 3), n('product', 12))},
        {targetNodeId: 'root', path: [], evidence: {kind: 'binary', operation: 'addition', operands: [r(3), r(12)], result: r(15)}, after: n('root', 15)}
    ], finalValue: r(15), precedenceWitness: {higherPriorityNodeId: 'power', lowerPriorityNodeId: 'product', higherPriorityStep: 0, lowerPriorityStep: 1, reason: 'power-before-product-or-sum'}
};

export const powerZeroOracle: NumericalPowerExpressionProblem = {
    kind: 'numerical-power-expression', expression: p('power', n('base', -3), 0),
    nodeValues: [row('base', -3), row('power', 1)],
    powerFacts: [{nodeId: 'power', kind: 'zero-exponent', nonzeroBase: true, baseValue: r(-3), exponent: 0, result: r(1)}],
    reductions: [{targetNodeId: 'power', path: [], evidence: {kind: 'power', baseValue: r(-3), exponent: 0, result: r(1)}, after: n('power', 1)}],
    finalValue: r(1), precedenceWitness: null
};

export const powerOneDecimalOracle: NumericalPowerExpressionProblem = {
    kind: 'numerical-power-expression', expression: p('power', n('base', 1, 2, {kind: 'decimal', coefficient: 500, scale: 3, numeral: '0.500'}), 1),
    nodeValues: [row('base', 1, 2), row('power', 1, 2)],
    powerFacts: [{nodeId: 'power', kind: 'positive-exponent', baseValue: r(1, 2), exponent: 1, result: r(1, 2), factors: [r(1, 2)], cumulativeProducts: []}],
    reductions: [{targetNodeId: 'power', path: [], evidence: {kind: 'power', baseValue: r(1, 2), exponent: 1, result: r(1, 2)}, after: n('power', 1, 2, {kind: 'fraction', numerator: 2, denominator: 4})}],
    finalValue: r(1, 2), precedenceWitness: null
};

export const powerFractionOracle: NumericalPowerExpressionProblem = {
    kind: 'numerical-power-expression', expression: p('power', n('base', -1, 2, {kind: 'fraction', numerator: -2, denominator: 4}), 3),
    nodeValues: [row('base', -1, 2), row('power', -1, 8)],
    powerFacts: [{nodeId: 'power', kind: 'positive-exponent', baseValue: r(-1, 2), exponent: 3, result: r(-1, 8), factors: [r(-1, 2), r(-1, 2), r(-1, 2)], cumulativeProducts: [r(1, 4), r(-1, 8)]}],
    reductions: [{targetNodeId: 'power', path: [], evidence: {kind: 'power', baseValue: r(-1, 2), exponent: 3, result: r(-1, 8)}, after: n('power', -1, 8)}],
    finalValue: r(-1, 8), precedenceWitness: null
};

const negation = (operand: Node): Node => ({id: 'negative', kind: 'negation', operand});
export const powerNegatedOracle: NumericalPowerExpressionProblem = {
    kind: 'numerical-power-expression', expression: negation(p('power', n('base', 3), 2)),
    nodeValues: [row('base', 3), row('power', 9), row('negative', -9)],
    powerFacts: [{nodeId: 'power', kind: 'positive-exponent', baseValue: r(3), exponent: 2, result: r(9), factors: [r(3), r(3)], cumulativeProducts: [r(9)]}],
    reductions: [
        {targetNodeId: 'power', path: ['operand'], evidence: {kind: 'power', baseValue: r(3), exponent: 2, result: r(9)}, after: negation(n('power', 9))},
        {targetNodeId: 'negative', path: [], evidence: {kind: 'negation', operand: r(9), result: r(-9)}, after: n('negative', -9)}
    ], finalValue: r(-9), precedenceWitness: null
};

const inner = b('sum', 'addition', n('a', 1), n('b', 2));
const group = (expression: Node): Node => ({id: 'group', kind: 'group', expression});
export const powerGroupedOracle: NumericalPowerExpressionProblem = {
    kind: 'numerical-power-expression', expression: p('power', group(inner), 2),
    nodeValues: [row('a', 1), row('b', 2), row('sum', 3), row('group', 3), row('power', 9)],
    powerFacts: [{nodeId: 'power', kind: 'positive-exponent', baseValue: r(3), exponent: 2, result: r(9), factors: [r(3), r(3)], cumulativeProducts: [r(9)]}],
    reductions: [
        {targetNodeId: 'sum', path: ['base', 'expression'], evidence: {kind: 'binary', operation: 'addition', operands: [r(1), r(2)], result: r(3)}, after: p('power', group(n('sum', 3)), 2)},
        {targetNodeId: 'group', path: ['base'], evidence: {kind: 'group', enclosedValue: r(3), result: r(3)}, after: p('power', n('group', 3), 2)},
        {targetNodeId: 'power', path: [], evidence: {kind: 'power', baseValue: r(3), exponent: 2, result: r(9)}, after: n('power', 9)}
    ], finalValue: r(9), precedenceWitness: {higherPriorityNodeId: 'sum', lowerPriorityNodeId: 'power', higherPriorityStep: 0, lowerPriorityStep: 2, reason: 'inner-group-before-outer-operation'}
};

export const numericalPowerOracles = [powerProductFirstOracle, powerZeroOracle, powerOneDecimalOracle, powerFractionOracle, powerNegatedOracle, powerGroupedOracle] as const;
