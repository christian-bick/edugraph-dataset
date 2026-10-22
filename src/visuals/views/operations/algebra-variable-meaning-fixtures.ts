import {buildAlgebraVariableMeaningProblem} from '../../../generators/algebra/algebra-variable-meaning-helpers.ts';
import type {AffineNormalizationProof, AlgebraicScalar, AlgebraVariableMeaningProblem as Problem, ExactAffineNormalForm, ExactCoefficientArithmetic, ExactNumericCalculation, ExactSymbolicExpressionNode as Node, VariableMeaningDomain, VariableMeaningQuantity} from '../../../types/problems.ts';

export const variableMeaningValue = (numerator: number, denominator = 1): AlgebraicScalar => ({numerator, denominator});
const q = variableMeaningValue;
export const variableMeaningNumber = (id: string, numerator: number, denominator = 1): Node => ({id, kind: 'number', value: q(numerator, denominator),
    notation: denominator === 1 ? {kind: 'integer', numeral: String(numerator)} : {kind: 'fraction', numerator, denominator}});
export const variableMeaningVariable = (id: string, symbolId = 'x'): Node => ({id, kind: 'variable', symbolId});
export const variableMeaningBinary = (id: string, operation: 'addition' | 'subtraction' | 'multiplication', left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
export const variableMeaningDomain = (name: VariableMeaningDomain['name']): VariableMeaningDomain => ({domainId: `named-${name}`, name,
    set: {kind: name.endsWith('integers') ? 'integer' : 'rational', lower: name.startsWith('nonnegative') ? {value: q(0), inclusive: true} : null, upper: null, excludedValues: []}});
export const variableMeaningQuantity: Record<VariableMeaningQuantity['kind'], VariableMeaningQuantity> = {
    number: {kind: 'number', referent: 'mathematical-number', unit: 'none'},
    count: {kind: 'count', referent: 'tokens-in-a-bag', unit: 'tokens'},
    length: {kind: 'length', referent: 'segment-length', unit: 'meters'}
};

export function variableMeaningFixture(role: Problem['role']['kind'], domainName: VariableMeaningDomain['name'], quantity: VariableMeaningQuantity['kind'], left: Node, right: Node): Problem {
    return buildAlgebraVariableMeaningProblem({domain: variableMeaningDomain(domainName), symbol: {symbolId: 'x', symbol: 'x'}, quantity: variableMeaningQuantity[quantity],
        expressions: [{expressionId: 'left', root: left}, {expressionId: 'right', root: right}], role});
}

const originalSymbol = {symbolId: 'n', symbol: 'n'};
const proofDomain = {domainId: 'oracle-all-rationals', kind: 'independent-rational-variables' as const,
    symbols: [{...originalSymbol, domain: {kind: 'rational' as const, lower: null, upper: null, excludedValues: []}}] as const};
const form = (constant: number, coefficient: number): ExactAffineNormalForm => ({constant: q(constant), coefficients: coefficient === 0 ? [] : [{symbolId: 'n', coefficient: q(coefficient)}]});
const arithmetic = (operation: ExactCoefficientArithmetic['operation'], first: number, second: number, result: number): ExactCoefficientArithmetic => ({kind: 'binary', operation, operands: [q(first), q(second)], result: q(result)});
const variableStep = (nodeId: string) => ({nodeId, kind: 'variable' as const, symbolId: 'n', unitCoefficient: {numerator: 1 as const, denominator: 1 as const}, result: form(0, 1)});

/** Independent complete literal oracle: n+3=10, one fixed nonnegative integer count, root7. */
export const variableMeaningParticularOracle: Problem = (() => {
    const left = variableMeaningBinary('sum', 'addition', variableMeaningVariable('n', 'n'), variableMeaningNumber('three', 3));
    const right = variableMeaningNumber('ten', 10);
    const leftNormalization: AffineNormalizationProof = {expressionId: 'left', rootNormalForm: form(3, 1), steps: [variableStep('n'),
        {nodeId: 'three', kind: 'literal', value: q(3), result: form(3, 0)},
        {nodeId: 'sum', kind: 'add', leftNodeId: 'n', rightNodeId: 'three', result: form(3, 1), components: [
            {symbolId: null, arithmetic: arithmetic('addition', 0, 3, 3)}, {symbolId: 'n', arithmetic: arithmetic('addition', 1, 0, 1)}]}]};
    const rightNormalization: AffineNormalizationProof = {expressionId: 'right', rootNormalForm: form(10, 0), steps: [{nodeId: 'ten', kind: 'literal', value: q(10), result: form(10, 0)}]};
    const leftCalculation: ExactNumericCalculation = {
        expression: {id: 'sum', kind: 'binary', operation: 'addition', left: {id: 'n', kind: 'number', value: q(7), notation: {kind: 'integer', numeral: '7'}}, right: {id: 'three', kind: 'number', value: q(3), notation: {kind: 'integer', numeral: '3'}}},
        nodeValues: [{nodeId: 'sum', value: q(10)}, {nodeId: 'n', value: q(7)}, {nodeId: 'three', value: q(3)}], powerFacts: [],
        reductions: [{targetNodeId: 'sum', path: [], evidence: arithmetic('addition', 7, 3, 10), after: {id: 'sum', kind: 'number', value: q(10), notation: {kind: 'integer', numeral: '10'}}}],
        finalValue: q(10), precedenceWitness: null
    };
    return {kind: 'algebra-variable-models', domain: variableMeaningDomain('nonnegative-integers'), symbol: originalSymbol, quantity: variableMeaningQuantity.count,
        proofDomain, expressions: [{expressionId: 'left', domainId: proofDomain.domainId, root: left}, {expressionId: 'right', domainId: proofDomain.domainId, root: right}],
        relation: {leftExpressionId: 'left', rightExpressionId: 'right'}, role: {kind: 'particular-unknown', situation: 'one-fixed-situation', uniqueValueWitness: {
            leftNormalization, rightNormalization, coefficientDifference: arithmetic('subtraction', 1, 0, 1), constantDifference: arithmetic('subtraction', 3, 10, -7), inverseArithmetic: arithmetic('division', 7, 1, 7), uniqueValue: q(7),
            verification: {binding: {symbolId: 'n', value: q(7), notation: {kind: 'integer', numeral: '7'}}, left: {replacements: [{occurrenceNodeId: 'n', symbolId: 'n', value: q(7), notation: {kind: 'integer', numeral: '7'}}], calculation: leftCalculation},
                right: {replacements: [], calculation: {expression: {id: 'ten', kind: 'number', value: q(10), notation: {kind: 'integer', numeral: '10'}}, nodeValues: [{nodeId: 'ten', value: q(10)}], powerFacts: [], reductions: [], finalValue: q(10), precedenceWitness: null}},
                comparison: {operator: 'equal', leftValue: q(10), rightValue: q(10), truth: true}}
        }}
    };
})();

/** Independent complete universal oracle: n+n=2*n for every nonnegative integer. */
export const variableMeaningUniversalOracle: Problem = (() => {
    const left = variableMeaningBinary('sum', 'addition', variableMeaningVariable('first-n', 'n'), variableMeaningVariable('second-n', 'n'));
    const right = variableMeaningBinary('product', 'multiplication', variableMeaningNumber('two', 2), variableMeaningVariable('third-n', 'n'));
    const commonNormalForm = form(0, 2);
    const leftNormalization: AffineNormalizationProof = {expressionId: 'left', rootNormalForm: commonNormalForm, steps: [variableStep('first-n'), variableStep('second-n'),
        {nodeId: 'sum', kind: 'add', leftNodeId: 'first-n', rightNodeId: 'second-n', result: commonNormalForm, components: [
            {symbolId: null, arithmetic: arithmetic('addition', 0, 0, 0)}, {symbolId: 'n', arithmetic: arithmetic('addition', 1, 1, 2)}]}]};
    const rightNormalization: AffineNormalizationProof = {expressionId: 'right', rootNormalForm: commonNormalForm, steps: [
        {nodeId: 'two', kind: 'literal', value: q(2), result: form(2, 0)}, variableStep('third-n'),
        {nodeId: 'product', kind: 'multiply', constantNodeId: 'two', affineNodeId: 'third-n', constantFactor: q(2), result: commonNormalForm, components: [
            {symbolId: null, arithmetic: arithmetic('multiplication', 2, 0, 0)}, {symbolId: 'n', arithmetic: arithmetic('multiplication', 2, 1, 2)}]}]};
    return {kind: 'algebra-variable-models', domain: variableMeaningDomain('nonnegative-integers'), symbol: originalSymbol, quantity: variableMeaningQuantity.count,
        proofDomain, expressions: [{expressionId: 'left', domainId: proofDomain.domainId, root: left}, {expressionId: 'right', domainId: proofDomain.domainId, root: right}],
        relation: {leftExpressionId: 'left', rightExpressionId: 'right'}, role: {kind: 'arbitrary-generalized-number', quantifier: 'for-every-domain-member', domainInclusion: 'named-domain-subset-of-rationals',
            universalProof: {domainId: proofDomain.domainId, leftExpressionId: 'left', rightExpressionId: 'right', leftNormalization, rightNormalization, commonNormalForm}}};
})();
