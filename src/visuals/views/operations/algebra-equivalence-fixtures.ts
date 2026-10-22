import type {AffineExpression, AffineNormalizationProof, AlgebraExpressionEquivalenceProblem as Problem, AlgebraicNotation, CommonAffineDomain, ExactCoefficientArithmetic, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {buildAlgebraExpressionEquivalenceProblem, type AffineRewriteDescriptor} from '../../../generators/algebra/algebra-equivalence-helpers.ts';

const r = (numerator: number, denominator = 1) => ({numerator, denominator});
export const equivalenceNumber = (id: string, numerator: number, denominator = 1, notation?: AlgebraicNotation): Extract<Node, {kind: 'number'}> => ({id, kind: 'number', value: r(numerator, denominator), notation: notation ?? (denominator === 1 ? {kind: 'integer', numeral: String(numerator)} : {kind: 'fraction', numerator, denominator})});
export const equivalenceVariable = (id: string, symbolId = 'x'): Node => ({id, kind: 'variable', symbolId});
export const equivalenceBinary = (id: string, operation: 'addition' | 'subtraction' | 'multiplication' | 'division', left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
export const equivalenceGroup = (id: string, expression: Node): Node => ({id, kind: 'group', expression});
const declaration = (symbolId: string): CommonAffineDomain['symbols'][number] => ({symbolId, symbol: symbolId, domain: {kind: 'rational', lower: null, upper: null, excludedValues: []}});
const domain = (names: readonly [string, ...string[]]): CommonAffineDomain => ({domainId: 'common-rationals', kind: 'independent-rational-variables', symbols: [declaration(names[0]), ...names.slice(1).map(declaration)]});
const arithmetic = (operation: ExactCoefficientArithmetic['operation'], left: number, right: number, result: number): ExactCoefficientArithmetic => ({kind: 'binary', operation, operands: [r(left), r(right)], result: r(result)});
const form = (coefficient: number) => ({constant: r(0), coefficients: coefficient === 0 ? [] : [{symbolId: 'x', coefficient: r(coefficient)}]});
const variableRow = (nodeId: string) => ({nodeId, kind: 'variable' as const, symbolId: 'x', unitCoefficient: {numerator: 1, denominator: 1} as const, result: form(1)});

const common = domain(['x']);
const source: AffineExpression = {expressionId: 'source', domainId: common.domainId, root: equivalenceBinary('sum', 'addition', equivalenceVariable('first'), equivalenceVariable('second'))};
const result: AffineExpression = {expressionId: 'result', domainId: common.domainId, root: equivalenceBinary('product', 'multiplication', equivalenceNumber('two', 2), equivalenceVariable('first'))};
const sourceProof: AffineNormalizationProof = {expressionId: 'source', steps: [variableRow('first'), variableRow('second'),
    {nodeId: 'sum', kind: 'add', leftNodeId: 'first', rightNodeId: 'second', components: [{symbolId: null, arithmetic: arithmetic('addition', 0, 0, 0)}, {symbolId: 'x', arithmetic: arithmetic('addition', 1, 1, 2)}], result: form(2)}], rootNormalForm: form(2)};
const resultProof: AffineNormalizationProof = {expressionId: 'result', steps: [
    {nodeId: 'two', kind: 'literal', value: r(2), result: {constant: r(2), coefficients: []}}, variableRow('first'),
    {nodeId: 'product', kind: 'multiply', constantNodeId: 'two', affineNodeId: 'first', constantFactor: r(2), components: [{symbolId: null, arithmetic: arithmetic('multiplication', 2, 0, 0)}, {symbolId: 'x', arithmetic: arithmetic('multiplication', 2, 1, 2)}], result: form(2)}], rootNormalForm: form(2)};
const identity = {domainId: common.domainId, leftExpressionId: 'source', rightExpressionId: 'result', leftNormalization: sourceProof, rightNormalization: resultProof, commonNormalForm: form(2)};

/** Independent full x+x->2x oracle, including local collection and universal coefficient proofs. */
export const equivalenceTrueOracle: Problem = {
    kind: 'algebra-expression-equivalence', domain: common, expressions: [source, result],
    validIdentity: {sourceExpressionId: 'source', equivalentExpressionId: 'result', steps: [{kind: 'collection', beforeExpressionId: 'source', afterExpressionId: 'result', beforeSubtreeId: 'sum', afterSubtreeId: 'product', symbolId: 'x',
        terms: [{termNodeId: 'first', variableOccurrenceId: 'first', signedCoefficient: r(1)}, {termNodeId: 'second', variableOccurrenceId: 'second', signedCoefficient: r(1)}], coefficientSums: [arithmetic('addition', 1, 1, 2)], collectedCoefficient: r(2)}], universalProof: identity},
    comparison: {sourceExpressionId: 'source', candidateExpressionId: 'result', kind: 'equivalent', universalProof: identity}
};

const candidate: AffineExpression = {expressionId: 'candidate', domainId: common.domainId, root: equivalenceVariable('candidate-x')};
const candidateProof: AffineNormalizationProof = {expressionId: 'candidate', steps: [variableRow('candidate-x')], rootNormalForm: form(1)};
/** False candidate x retains the SAME valid x+x->2x rewrite and explicit x1 counterexample. */
export const equivalenceFalseOracle: Problem = {
    ...equivalenceTrueOracle, expressions: [source, result, candidate], comparison: {sourceExpressionId: 'source', candidateExpressionId: 'candidate', kind: 'not-equivalent',
        sourceNormalization: sourceProof, candidateNormalization: candidateProof, differingComponent: {symbolId: 'x', sourceCoefficient: r(2), candidateCoefficient: r(1)},
        counterexample: {domainId: common.domainId, bindings: [{symbolId: 'x', value: r(1), notation: {kind: 'integer', numeral: '1'}}],
            left: {sourceExpressionId: 'source', replacements: [{occurrenceNodeId: 'first', symbolId: 'x', value: r(1), notation: {kind: 'integer', numeral: '1'}}, {occurrenceNodeId: 'second', symbolId: 'x', value: r(1), notation: {kind: 'integer', numeral: '1'}}],
                calculation: {expression: {id: 'sum', kind: 'binary', operation: 'addition', left: equivalenceNumber('first', 1), right: equivalenceNumber('second', 1)}, nodeValues: [{nodeId: 'first', value: r(1)}, {nodeId: 'second', value: r(1)}, {nodeId: 'sum', value: r(2)}], powerFacts: [],
                    reductions: [{targetNodeId: 'sum', path: [], evidence: arithmetic('addition', 1, 1, 2), after: equivalenceNumber('sum', 2)}], finalValue: r(2), precedenceWitness: null}},
            right: {sourceExpressionId: 'candidate', replacements: [{occurrenceNodeId: 'candidate-x', symbolId: 'x', value: r(1), notation: {kind: 'integer', numeral: '1'}}],
                calculation: {expression: equivalenceNumber('candidate-x', 1), nodeValues: [{nodeId: 'candidate-x', value: r(1)}], powerFacts: [], reductions: [], finalValue: r(1), precedenceWitness: null}},
            unequalValues: {left: r(2), right: r(1)}}}
};

/** Literal-input adoption fixtures. The views never call this mathematical builder. */
export function buildEquivalenceViewFixture(sourceRoot: Node, resultRoot: Node, descriptor: {kind: AffineRewriteDescriptor['kind']; direction?: 'factored-to-expanded' | 'expanded-to-factored' | 'left-to-right' | 'right-to-left'}, candidateRoot?: Node, names: readonly [string, ...string[]] = ['x']): Problem {
    const common = domain(names);
    const expressions: [AffineExpression, AffineExpression, ...AffineExpression[]] = [{expressionId: 'source', domainId: common.domainId, root: sourceRoot}, {expressionId: 'result', domainId: common.domainId, root: resultRoot}];
    if (candidateRoot) expressions.push({expressionId: 'candidate', domainId: common.domainId, root: candidateRoot});
    return buildAlgebraExpressionEquivalenceProblem({domain: common, expressions, sourceExpressionId: 'source', equivalentExpressionId: 'result', candidateExpressionId: candidateRoot ? 'candidate' : 'result',
        rewriteSteps: [{...descriptor, beforeExpressionId: 'source', afterExpressionId: 'result', beforeSubtreeId: sourceRoot.id, afterSubtreeId: resultRoot.id} as AffineRewriteDescriptor]});
}

export function equivalenceDistributionOracle(reverse = false): Problem {
    const x = equivalenceVariable('x'), y = equivalenceVariable('y', 'y');
    const factored = equivalenceBinary('factored', 'multiplication', equivalenceNumber('scalar', 3), equivalenceGroup('linear-group', equivalenceBinary('linear-sum', 'addition',
        equivalenceBinary('first-term', 'multiplication', equivalenceNumber('first-coefficient', 2), x), equivalenceBinary('second-term', 'multiplication', equivalenceNumber('second-coefficient', 1), y))));
    const expanded = equivalenceBinary('expanded', 'addition', equivalenceBinary('first-expanded', 'multiplication', equivalenceNumber('six', 6), x), equivalenceBinary('second-expanded', 'multiplication', equivalenceNumber('three', 3), y));
    return buildEquivalenceViewFixture(reverse ? expanded : factored, reverse ? factored : expanded, {kind: 'distribution', direction: reverse ? 'expanded-to-factored' : 'factored-to-expanded'}, undefined, ['x', 'y']);
}

export function equivalenceAssociationOracle(): Problem {
    const x = equivalenceVariable('x'), two = equivalenceNumber('two', 2), y = equivalenceVariable('y', 'y');
    return buildEquivalenceViewFixture(equivalenceBinary('left', 'addition', equivalenceGroup('left-group', equivalenceBinary('left-inner', 'addition', x, two)), y),
        equivalenceBinary('right', 'addition', x, equivalenceGroup('right-group', equivalenceBinary('right-inner', 'addition', two, y))), {kind: 'association', direction: 'left-to-right'}, undefined, ['x', 'y']);
}

export function equivalenceCommutationOracle(): Problem {
    const first = equivalenceBinary('first-term', 'multiplication', equivalenceNumber('two', 2), equivalenceVariable('x'));
    const second = equivalenceBinary('second-term', 'multiplication', equivalenceNumber('three', 3), equivalenceVariable('y', 'y'));
    return buildEquivalenceViewFixture(equivalenceBinary('source-sum', 'addition', first, second), equivalenceBinary('result-sum', 'addition', second, first), {kind: 'commutation'}, undefined, ['x', 'y']);
}

export function equivalenceSignedCancellationOracle(): Problem {
    const first = equivalenceVariable('first'), second = equivalenceVariable('second');
    return buildEquivalenceViewFixture(equivalenceBinary('source-sum', 'addition', {id: 'negative', kind: 'negation', operand: first}, second), equivalenceNumber('zero', 0), {kind: 'collection'});
}

export function equivalenceRetainedNotationOracle(): Problem {
    return buildEquivalenceViewFixture(equivalenceBinary('source-sum', 'addition', equivalenceBinary('source-product', 'multiplication', equivalenceNumber('half', 1, 2, {kind: 'fraction', numerator: 2, denominator: 4}), equivalenceVariable('x')),
        equivalenceNumber('decimal', 1, 2, {kind: 'decimal', coefficient: 500, scale: 3, numeral: '0.500'})),
    equivalenceBinary('result-sum', 'addition', equivalenceBinary('result-product', 'multiplication', equivalenceNumber('result-half', 1, 2), equivalenceVariable('x')), equivalenceNumber('result-constant', 1, 2)), {kind: 'coefficient-normalization'});
}
