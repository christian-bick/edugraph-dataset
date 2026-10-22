import type {AlgebraicExpressionContext, AlgebraicExpressionProblem, AlgebraicNotation, AlgebraicScalar, AlgebraicSymbolDeclaration, AlgebraicUnit, ArithmeticOperation, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {buildAlgebraicExpressionProblem} from '../../../generators/algebra/algebra-expression-helpers.ts';

// Syntax constructors assemble literal inputs only; the first two full payloads have hand-authored work.
export const algebraRational = (numerator: number, denominator = 1): AlgebraicScalar => ({numerator, denominator});
export const algebraNumber = (id: string, numerator: number, denominator = 1, notation?: AlgebraicNotation): Node => ({id, kind: 'number', value: algebraRational(numerator, denominator), notation: notation ?? (denominator === 1 ? {kind: 'integer', numeral: String(numerator)} : {kind: 'fraction', numerator, denominator})});
export const algebraVariable = (id: string, symbolId = 'x'): Node => ({id, kind: 'variable', symbolId});
export const algebraGroup = (id: string, expression: Node): Node => ({id, kind: 'group', expression});
export const algebraBinary = (id: string, operation: ArithmeticOperation, left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
export const algebraDeclaration = (symbolId = 'x', nonnegative = false): AlgebraicSymbolDeclaration => ({symbolId, symbol: symbolId, domain: {kind: 'rational', lower: nonnegative ? {value: algebraRational(0), inclusive: true} : null, upper: null, excludedValues: []}});
const parameterContext = (symbolId = 'x'): AlgebraicExpressionContext => ({kind: 'parameter-description', parameters: [{symbolId, meaning: 'number'}], resultMeaning: 'number'});
const row = (nodeId: string, numerator: number, denominator = 1) => ({nodeId, value: algebraRational(numerator, denominator)});

const five = algebraNumber('five', 5), y = algebraVariable('input', 'y'), gy = algebraGroup('group', y);
const minus = (right: Node) => algebraBinary('root', 'subtraction', five, right);
const numericY = algebraNumber('input', 3, 2), numericGroupY = algebraGroup('group', numericY);

/** Independent 5-(y), y=3/2: explicit group then subtraction, exact7/2. */
export const algebraPlainOracle: AlgebraicExpressionProblem = {
    kind: 'algebra-expressions', expression: minus(gy), symbols: [algebraDeclaration('y')], restrictions: [],
    substitution: {bindings: [{symbolId: 'y', value: algebraRational(3, 2), notation: {kind: 'fraction', numerator: 3, denominator: 2}, occurrenceNodeIds: ['input']}],
        substitutedExpression: minus(numericGroupY) as AlgebraicExpressionProblem['substitution']['substitutedExpression'],
        nodeValues: [row('five', 5), row('input', 3, 2), row('group', 3, 2), row('root', 7, 2)], powerFacts: [],
        reductions: [{targetNodeId: 'group', path: ['right'], evidence: {kind: 'group', enclosedValue: algebraRational(3, 2), result: algebraRational(3, 2)}, after: minus(algebraNumber('group', 3, 2)) as AlgebraicExpressionProblem['substitution']['substitutedExpression']},
            {targetNodeId: 'root', path: [], evidence: {kind: 'binary', operation: 'subtraction', operands: [algebraRational(5), algebraRational(3, 2)], result: algebraRational(7, 2)}, after: algebraNumber('root', 7, 2) as AlgebraicExpressionProblem['substitution']['substitutedExpression']}],
        finalValue: algebraRational(7, 2), finalNotation: {kind: 'fraction', numerator: 7, denominator: 2}, precedenceWitness: null},
    structuralExpression: {kind: 'symbolic', expression: minus(gy)},
    structuralRelations: [{kind: 'additive-components', levelNodeId: 'root', terms: [{sourceNodeId: 'five', polarity: 1, signedExpression: five}, {sourceNodeId: 'group', polarity: -1, signedExpression: {id: 'signed-y', kind: 'negation', operand: gy}}]}],
    groupedOperands: [{groupNodeId: 'group', innerNodeId: 'input', parentNodeId: 'root', enclosingOperation: 'subtraction', position: 'right'}], context: parameterContext('y')
};

const two = algebraNumber('two', 2), seven = algebraNumber('seven', 7), vx = algebraVariable('input');
const inner = (input: Node) => algebraBinary('inner', 'addition', input, seven);
const multiply = (right: Node) => algebraBinary('root', 'multiplication', two, right);
const grouped = (input: Node) => algebraGroup('group', inner(input));
const eight = algebraNumber('input', 8);

/** Independent numeric structural frame2(8+7), linked to2(x+7) atx8, exact30. */
export const algebraNumericFactorOracle: AlgebraicExpressionProblem = {
    kind: 'algebra-expressions', expression: multiply(grouped(vx)), symbols: [algebraDeclaration()], restrictions: [],
    substitution: {bindings: [{symbolId: 'x', value: algebraRational(8), notation: {kind: 'integer', numeral: '8'}, occurrenceNodeIds: ['input']}],
        substitutedExpression: multiply(grouped(eight)) as AlgebraicExpressionProblem['substitution']['substitutedExpression'],
        nodeValues: [row('two', 2), row('input', 8), row('seven', 7), row('inner', 15), row('group', 15), row('root', 30)], powerFacts: [],
        reductions: [{targetNodeId: 'inner', path: ['right', 'expression'], evidence: {kind: 'binary', operation: 'addition', operands: [algebraRational(8), algebraRational(7)], result: algebraRational(15)}, after: multiply(algebraGroup('group', algebraNumber('inner', 15))) as AlgebraicExpressionProblem['substitution']['substitutedExpression']},
            {targetNodeId: 'group', path: ['right'], evidence: {kind: 'group', enclosedValue: algebraRational(15), result: algebraRational(15)}, after: multiply(algebraNumber('group', 15)) as AlgebraicExpressionProblem['substitution']['substitutedExpression']},
            {targetNodeId: 'root', path: [], evidence: {kind: 'binary', operation: 'multiplication', operands: [algebraRational(2), algebraRational(15)], result: algebraRational(30)}, after: algebraNumber('root', 30) as AlgebraicExpressionProblem['substitution']['substitutedExpression']}],
        finalValue: algebraRational(30), finalNotation: {kind: 'integer', numeral: '30'}, precedenceWitness: {higherPriorityNodeId: 'inner', lowerPriorityNodeId: 'root', higherPriorityStep: 0, lowerPriorityStep: 2, reason: 'inner-group-before-outer-operation'}},
    structuralExpression: {kind: 'numeric', expression: multiply(grouped(eight)) as AlgebraicExpressionProblem['substitution']['substitutedExpression']},
    structuralRelations: [{kind: 'multiplicative-components', productNodeId: 'root', factors: [{nodeId: 'two'}, {nodeId: 'group'}]}],
    groupedOperands: [{groupNodeId: 'group', innerNodeId: 'inner', parentNodeId: 'root', enclosingOperation: 'multiplication', position: 'right'}], context: parameterContext()
};

/** Producer-interface fixtures use literal inputs; tests assert independent expected math and modes. */
export function algebraCoefficientOracle(coefficient: number | 'implicit-negative' | 'implicit-positive'): AlgebraicExpressionProblem {
    const variable = algebraVariable('input');
    const term: Node = coefficient === 'implicit-negative' ? {id: 'negative-input', kind: 'negation', operand: variable}
        : coefficient === 'implicit-positive' ? variable : algebraBinary('term', 'multiplication', algebraNumber('coefficient', coefficient), variable);
    return buildAlgebraicExpressionProblem({expression: algebraBinary('root', 'subtraction', term, algebraGroup('constant-group', algebraNumber('constant', 2))), symbols: [algebraDeclaration()],
        bindings: [{symbolId: 'x', value: algebraRational(3, 2), notation: {kind: 'fraction', numerator: 3, denominator: 2}}], structuralKind: 'symbolic', relation: 'coefficient', context: parameterContext()});
}

export function algebraRepeatedOracle(exponent?: 0 | 2): AlgebraicExpressionProblem {
    const base = algebraGroup('base', algebraBinary('inner', 'addition', algebraVariable('first'), algebraNumber('offset', 2)));
    const factor: Node = exponent === undefined ? base : {id: 'power', kind: 'power', base, exponent};
    return buildAlgebraicExpressionProblem({expression: algebraBinary('root', 'addition', algebraBinary('product', 'multiplication', algebraNumber('coefficient', 3), factor), algebraVariable('second')),
        symbols: [algebraDeclaration()], bindings: [{symbolId: 'x', value: algebraRational(1, 2), notation: {kind: 'decimal', coefficient: 500, scale: 3, numeral: '0.500'}}], structuralKind: 'symbolic', relation: 'sum', context: parameterContext()});
}

export function algebraOperationOracle(operation: ArithmeticOperation, structuralKind: 'symbolic' | 'numeric'): AlgebraicExpressionProblem {
    return buildAlgebraicExpressionProblem({expression: algebraBinary('root', operation, algebraNumber('constant', 5), algebraGroup('group', algebraVariable('input'))), symbols: [algebraDeclaration()],
        bindings: [{symbolId: 'x', value: algebraRational(3, 2), notation: {kind: 'fraction', numerator: 6, denominator: 4}}], structuralKind,
        relation: operation === 'addition' ? 'sum' : operation === 'multiplication' ? 'product' : operation === 'division' ? 'quotient' : 'additive-components', context: parameterContext()});
}

const unit = (subject: AlgebraicUnit['subject'], name: string, currency: number, time: number): AlgebraicUnit => ({subject, name, dimensions: {currency, time, count: 0, length: 0}});
export function algebraPurchaseOracle(): AlgebraicExpressionProblem {
    const fixed = algebraNumber('fixed', 3), rate = algebraNumber('rate', 2), duration = algebraGroup('duration-group', algebraVariable('duration', 't'));
    const expression = algebraBinary('total', 'addition', fixed, algebraBinary('charge', 'multiplication', rate, duration));
    const dollars = unit('money', 'dollars', 1, 0);
    const context: AlgebraicExpressionContext = {kind: 'quantitative-system', setting: 'purchase', quantities: [
        {quantityId: 'fixed', meaning: 'fixed-charge', unit: dollars, expression: fixed},
        {quantityId: 'rate', meaning: 'rate', unit: unit('money', 'dollars per hour', 1, -1), expression: rate},
        {quantityId: 'duration', meaning: 'duration', unit: unit('time', 'hours', 0, 1), expression: duration},
        {quantityId: 'total', meaning: 'total-amount', unit: dollars, expression}
    ], relations: [{kind: 'fixed-and-proportional', resultId: 'total', fixedId: 'fixed', rateId: 'rate', inputId: 'duration'}], outputQuantityId: 'total', variableQuantities: [{symbolId: 't', quantityId: 'duration'}]};
    return buildAlgebraicExpressionProblem({expression, symbols: [algebraDeclaration('t', true)], bindings: [{symbolId: 't', value: algebraRational(3, 2), notation: {kind: 'fraction', numerator: 3, denominator: 2}}], structuralKind: 'symbolic', relation: 'sum', context});
}

/** A connected graph with repeated input/output roles must still have unambiguous prose. */
export function algebraRepeatedRoleOracle(): AlgebraicExpressionProblem {
    const input = algebraGroup('input-group', algebraVariable('input')), first = algebraNumber('first', 3), second = algebraNumber('second', 2);
    const intermediate = algebraBinary('intermediate', 'addition', input, first), expression = algebraBinary('output', 'addition', intermediate, second);
    const dollars = unit('money', 'dollars', 1, 0);
    const context: AlgebraicExpressionContext = {kind: 'quantitative-system', setting: 'purchase', quantities: [
        {quantityId: 'input', meaning: 'initial-amount', unit: dollars, expression: input},
        {quantityId: 'first', meaning: 'initial-amount', unit: dollars, expression: first},
        {quantityId: 'second', meaning: 'initial-amount', unit: dollars, expression: second},
        {quantityId: 'intermediate', meaning: 'total-amount', unit: dollars, expression: intermediate},
        {quantityId: 'output', meaning: 'total-amount', unit: dollars, expression}
    ], relations: [{kind: 'combined-amounts', resultId: 'intermediate', firstId: 'input', secondId: 'first'},
        {kind: 'combined-amounts', resultId: 'output', firstId: 'intermediate', secondId: 'second'}],
    outputQuantityId: 'output', variableQuantities: [{symbolId: 'x', quantityId: 'input'}]};
    return buildAlgebraicExpressionProblem({expression, symbols: [algebraDeclaration('x', true)], bindings: [{symbolId: 'x', value: algebraRational(3, 2), notation: {kind: 'fraction', numerator: 3, denominator: 2}}], structuralKind: 'symbolic', relation: 'sum', context});
}
