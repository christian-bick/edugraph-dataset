import type {AlgebraicInequalityProblem, AlgebraicNotation, AlgebraicScalar, AlgebraicUnit, ElementaryEquationContext, ExactEquation, ExactSymbolicExpressionNode, SignedRationalAxis, StatementAmbientDomain, StatementAssignmentCheck, StatementCandidate} from '../../../types/problems.ts';
import {buildAlgebraicEquationProblem, buildAlgebraicInequalityProblem} from '../../../generators/algebra/algebra-statement-helpers.ts';

export const statementRational = (numerator: number, denominator = 1): AlgebraicScalar => ({numerator, denominator});
export const statementNotation = (value: AlgebraicScalar): AlgebraicNotation => value.denominator === 1 ? {kind: 'integer', numeral: String(value.numerator)} : {kind: 'fraction', ...value};
const q = statementRational;
export const statementNumber = (id: string, value: AlgebraicScalar, notation = statementNotation(value)): Extract<ExactSymbolicExpressionNode, {kind: 'number'}> => ({id, kind: 'number', value, notation});
export const statementVariable = {symbolId: 'x', symbol: 'x'} as const;
export const statementRationals: StatementAmbientDomain = {kind: 'numeric', values: {kind: 'rational', lower: null, upper: null, excludedValues: []}};
export const statementNonnegative: StatementAmbientDomain = {kind: 'numeric', values: {kind: 'rational', lower: {value: q(0), inclusive: true}, upper: null, excludedValues: []}};
export const statementBounded: StatementAmbientDomain = {kind: 'numeric', values: {kind: 'rational', lower: {value: q(0), inclusive: true}, upper: {value: q(2), inclusive: true}, excludedValues: []}};
export const statementUnit: AlgebraicUnit = {subject: 'number', name: 'number', dimensions: {currency: 0, time: 0, count: 0, length: 0}};
export const statementMoney: AlgebraicUnit = {subject: 'money', name: 'dollars', dimensions: {currency: 1, time: 0, count: 0, length: 0}};
export const statementAxis: SignedRationalAxis = {minimum: q(-1), maximum: q(2), step: q(1), ticks: [q(-1), q(0), q(1), q(2)], zeroIndex: 1};
export const statementHalfAxis: SignedRationalAxis = {minimum: q(-1), maximum: q(3), step: q(1, 2), ticks: [q(-1), q(-1, 2), q(0), q(1, 2), q(1), q(3, 2), q(2), q(5, 2), q(3)], zeroIndex: 2};
const candidate = (value: AlgebraicScalar, index: number): StatementCandidate => ({id: `candidate-${index}`, value, notation: statementNotation(value)});

/** Literal-input fixtures; builders supply mathematics only to tests, never to production views. */
export function statementEquationFixture(operation: 'addition' | 'multiplication', parameter: AlgebraicScalar, total: AlgebraicScalar,
    domain: StatementAmbientDomain = statementRationals, inputs: readonly [AlgebraicScalar, ...AlgebraicScalar[]] = [q(0), q(1), q(2)], context?: ElementaryEquationContext, parameterNotation = statementNotation(parameter)) {
    const atom = {id: 'variable-x', kind: 'variable', symbolId: 'x'} as const, constant = statementNumber('parameter', parameter, parameterNotation);
    const statement: ExactEquation = {operator: 'equal', left: {id: 'left', kind: 'binary', operation, left: operation === 'addition' ? atom : constant, right: operation === 'addition' ? constant : atom}, right: statementNumber('total', total)};
    const candidates = inputs.map(candidate), candidateUniverse: [StatementCandidate, ...StatementCandidate[]] = [candidates[0]!, ...candidates.slice(1)];
    return buildAlgebraicEquationProblem({variable: statementVariable, ambientDomain: domain, statement, candidateUniverse,
        assignment: {symbolId: 'x', value: candidateUniverse[0].value, notation: candidateUniverse[0].notation}, context: context ?? {kind: 'number-relation', relationship: operation === 'addition' ? 'sum' : 'scaled-value', variableQuantity: {quantityId: 'input', meaning: 'input-number', unit: statementUnit},
            constantQuantity: {quantityId: 'constant', meaning: operation === 'addition' ? 'added-number' : 'scale-factor', unit: statementUnit, value: parameter, notation: parameterNotation}, resultQuantity: {quantityId: 'result', meaning: 'resulting-number', unit: statementUnit, value: total, notation: statementNotation(total)}}});
}
export function statementInequalityFixture(direction: 'less' | 'greater', boundary = q(3, 2), domain: StatementAmbientDomain = statementRationals,
    inputs: readonly [AlgebraicScalar, ...AlgebraicScalar[]] = [q(0), q(1), q(2)], axis = statementHalfAxis, notation = statementNotation(boundary), contextKind: 'balance' | 'temperature' | 'elevation' = 'balance') {
    const candidates = inputs.map(candidate), candidateUniverse: [StatementCandidate, ...StatementCandidate[]] = [candidates[0]!, ...candidates.slice(1)];
    const metadata = contextKind === 'temperature' ? {kind: 'temperature', reference: 'celsius-zero', unit: 'degrees-celsius'} as const : contextKind === 'elevation' ? {kind: 'elevation', reference: 'sea-level', unit: 'meters'} as const : {kind: 'balance', reference: 'settled-balance', unit: 'dollars'} as const;
    return buildAlgebraicInequalityProblem({variable: statementVariable, ambientDomain: domain,
        statement: {operator: direction, left: {id: 'variable-x', kind: 'variable', symbolId: 'x'}, right: statementNumber('boundary', boundary, notation)},
        candidateUniverse, assignment: {symbolId: 'x', value: candidateUniverse[0].value, notation: candidateUniverse[0].notation}, axis,
        context: {kind: 'strict-threshold', context: metadata, quantityId: 'quantity', threshold: {quantityId: 'threshold', value: boundary, notation}, relationship: direction === 'less' ? 'strictly-below-threshold' : 'strictly-above-threshold'}});
}

/** Independent complete x<1 overQ oracle: assignment1 isfalse, finite candidates do not bound the ray. */
const literalCheck = (value: number, truth: boolean): StatementAssignmentCheck => ({binding: {symbolId: 'x', value: q(value), notation: statementNotation(q(value))},
    left: {replacements: [{occurrenceNodeId: 'variable-x', symbolId: 'x', value: q(value), notation: statementNotation(q(value))}], calculation: {expression: statementNumber('variable-x', q(value)), nodeValues: [{nodeId: 'variable-x', value: q(value)}], powerFacts: [], reductions: [], finalValue: q(value), precedenceWitness: null}},
    right: {replacements: [], calculation: {expression: statementNumber('boundary', q(1)), nodeValues: [{nodeId: 'boundary', value: q(1)}], powerFacts: [], reductions: [], finalValue: q(1), precedenceWitness: null}},
    comparison: {operator: 'less', leftValue: q(value), rightValue: q(1), truth}});
export const statementRayOracle: AlgebraicInequalityProblem = {
    kind: 'algebra-inequalities', variable: statementVariable, ambientDomain: statementRationals,
    statement: {operator: 'less', left: {id: 'variable-x', kind: 'variable', symbolId: 'x'}, right: statementNumber('boundary', q(1))},
    bound: {variableNodeId: 'variable-x', value: q(1), notation: statementNotation(q(1)), direction: 'less'},
    candidateUniverse: [{id: 'zero', value: q(0), notation: statementNotation(q(0))}, {id: 'one', value: q(1), notation: statementNotation(q(1))}, {id: 'two', value: q(2), notation: statementNotation(q(2))}],
    assignment: {symbolId: 'x', value: q(1), notation: statementNotation(q(1))},
    candidateChecks: [{...literalCheck(0, true), candidateId: 'zero'}, {...literalCheck(1, false), candidateId: 'one'}, {...literalCheck(2, false), candidateId: 'two'}],
    restrictedSolutions: {candidateIds: ['zero'], values: [q(0)]}, ambientChecks: [], solutionCardinality: {kind: 'infinite'},
    ambientSolution: {kind: 'ray', boundary: q(1), direction: 'less', boundaryIncluded: false, infiniteFamily: {kind: 'boundary-plus-positive-integer-step', base: q(1), direction: 'subtract', step: q(1)}},
    solutionLine: {axis: statementAxis, boundary: {value: q(1), tickIndex: 2, sign: 1, magnitude: q(1)}, auxiliaryLocations: []},
    context: {kind: 'strict-threshold', context: {kind: 'balance', reference: 'settled-balance', unit: 'dollars'}, quantityId: 'balance', threshold: {quantityId: 'threshold', value: q(1), notation: statementNotation(q(1))}, relationship: 'strictly-below-threshold'}
};

export function statementPhysicalAdditionFixture() {
    return statementEquationFixture('addition', q(3, 4), q(2), statementNonnegative, [q(0), q(2)], {kind: 'combined-amounts', variableQuantity: {quantityId: 'initial', meaning: 'initial-amount', unit: statementMoney},
        addedQuantity: {quantityId: 'added', meaning: 'added-amount', unit: statementMoney, value: q(3, 4), notation: statementNotation(q(3, 4))}, totalQuantity: {quantityId: 'total', meaning: 'total-amount', unit: statementMoney, value: q(2), notation: statementNotation(q(2))}});
}
export function statementPhysicalProductFixture() {
    const hours: AlgebraicUnit = {subject: 'time', name: 'hours', dimensions: {currency: 0, time: 1, count: 0, length: 0}}, rate: AlgebraicUnit = {subject: 'money', name: 'dollars per hour', dimensions: {currency: 1, time: -1, count: 0, length: 0}};
    return statementEquationFixture('multiplication', q(3, 4), q(3, 2), statementNonnegative, [q(0), q(1), q(2)], {kind: 'equal-groups', variableQuantity: {quantityId: 'duration', meaning: 'duration', unit: hours}, multiplierQuantity: {quantityId: 'rate', meaning: 'rate', unit: rate, value: q(3, 4), notation: statementNotation(q(3, 4))}, totalQuantity: {quantityId: 'total', meaning: 'total-amount', unit: statementMoney, value: q(3, 2), notation: statementNotation(q(3, 2))}});
}
