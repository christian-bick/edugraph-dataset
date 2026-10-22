import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicScalar, AlgebraicUnit, ElementaryEquationContext,
    ExactEquation, ExactSymbolicExpressionNode as Node, StatementAmbientDomain, StatementCandidate} from '../../types/problems.ts';
import {makeSignedRational} from '../number/signed-rational-helpers.ts';
import {makeSignedRationalAxis} from '../number/signed-rational-axis-helpers.ts';
import {buildStatementAssignmentCheck} from './algebra-statement-core-helpers.ts';
import {buildAlgebraicEquationProblem as equation, buildAlgebraicInequalityProblem as inequality,
    isAlgebraicEquationProblem as validEquation, isAlgebraicInequalityProblem as validInequality,
    type EquationBuildInput, type InequalityBuildInput} from './algebra-statement-helpers.ts';

const q = (numerator: number, denominator = 1): AlgebraicScalar => makeSignedRational(numerator, denominator);
const variable = {symbolId: 'x', symbol: 'x'};
const n = (id: string, numerator: number, denominator = 1): Extract<Node, {kind: 'number'}> => ({id, kind: 'number', value: q(numerator, denominator),
    notation: {kind: 'fraction', numerator, denominator}});
const v = (id = 'x'): Extract<Node, {kind: 'variable'}> => ({id, kind: 'variable', symbolId: 'x'});
const b = (id: string, operation: 'addition' | 'subtraction' | 'multiplication' | 'division', left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const g = (id: string, expression: Node): Node => ({id, kind: 'group', expression});
const all: StatementAmbientDomain = {kind: 'numeric', values: {kind: 'rational', lower: null, upper: null, excludedValues: []}};
const domain = (lower: number | null, upper: number | null, lowerClosed = true, upperClosed = true, excluded: number[] = []): StatementAmbientDomain =>
    ({kind: 'numeric', values: {kind: 'rational', lower: lower === null ? null : {value: q(lower), inclusive: lowerClosed},
        upper: upper === null ? null : {value: q(upper), inclusive: upperClosed}, excludedValues: excluded.map(value => q(value))}});
const finite = (...values: number[]): StatementAmbientDomain => ({kind: 'finite', values: [q(values[0]!), ...values.slice(1).map(value => q(value))]});
const candidates = (values: readonly AlgebraicScalar[]): readonly [StatementCandidate, ...StatementCandidate[]] => {
    const rows = values.map((value, index): StatementCandidate => ({id: `candidate-${index}`, value,
        notation: {kind: 'fraction', numerator: value.numerator * 2, denominator: value.denominator * 2}}));
    return [rows[0]!, ...rows.slice(1)];
};
const numberUnit: AlgebraicUnit = {subject: 'number', name: 'number', dimensions: {length: 0, time: 0, currency: 0, count: 0}};
const money: AlgebraicUnit = {subject: 'money', name: 'dollars', dimensions: {length: 0, time: 0, currency: 1, count: 0}};
function eqInput(operation: 'addition' | 'multiplication' = 'addition', parameter = n('p', 3, 4), total = n('q', 2),
    ambientDomain = all, values: readonly AlgebraicScalar[] = [q(0), q(2)]): EquationBuildInput {
    const candidateUniverse = candidates(values), first = candidateUniverse[0];
    const statement: ExactEquation = {operator: 'equal', left: b('expression', operation, operation === 'addition' ? v() : parameter,
        operation === 'addition' ? parameter : v()), right: total};
    return {variable, ambientDomain, statement, candidateUniverse, assignment: {symbolId: 'x', value: first.value, notation: first.notation},
        context: {kind: 'number-relation', relationship: operation === 'addition' ? 'sum' : 'scaled-value',
            variableQuantity: {quantityId: 'input', meaning: 'input-number', unit: numberUnit},
            constantQuantity: {quantityId: 'constant', meaning: operation === 'addition' ? 'added-number' : 'scale-factor', unit: numberUnit, value: parameter.value, notation: parameter.notation},
            resultQuantity: {quantityId: 'result', meaning: 'resulting-number', unit: numberUnit, value: total.value, notation: total.notation}}};
}
function ineqInput(direction: 'less' | 'greater' = 'less', ambientDomain = all, boundary = n('threshold', 3, 2),
    values: readonly AlgebraicScalar[] = [q(0), q(1), q(3, 2), q(2)]): InequalityBuildInput {
    const candidateUniverse = candidates(values), first = candidateUniverse[0];
    return {variable, ambientDomain, statement: {operator: direction, left: v(), right: boundary}, candidateUniverse,
        assignment: {symbolId: 'x', value: first.value, notation: first.notation}, axis: makeSignedRationalAxis(q(1, 2), -4, 6),
        context: {kind: 'strict-threshold', context: {kind: 'elevation', reference: 'sea-level', unit: 'meters'}, quantityId: 'height',
            threshold: {quantityId: 'threshold', value: boundary.value, notation: boundary.notation},
            relationship: direction === 'less' ? 'strictly-below-threshold' : 'strictly-above-threshold'}};
}
function changed(source: unknown, path: readonly (string | number)[], replacement: unknown): unknown {
    const value = structuredClone(source) as Record<string | number, unknown>;
    let cursor = value;
    for (const key of path.slice(0, -1)) cursor = cursor[key] as typeof value;
    cursor[path.at(-1)!] = replacement;
    return value;
}

describe('complete elementary equations', () => {
    it('keeps restricted candidates separate from an independent exact root verification', () => {
        const data = equation(eqInput());
        expect(validEquation(data)).toBe(true);
        expect(data.candidateChecks.map(row => row.comparison.truth)).toEqual([false, false]);
        expect(data.restrictedSolutions.values).toEqual([]);
        expect(data.ambientSolution).toMatchObject({kind: 'singleton', value: q(5, 4)});
        expect(data.solutionCardinality).toEqual({kind: 'finite', count: 1});
        expect(data.solutionWitness).toMatchObject({kind: 'isolated-variable', algebraicValue: q(5, 4), admissible: true,
            verification: {binding: {value: q(5, 4)}, comparison: {truth: true}}});
        expect(data.candidateChecks[0].right.replacements).toEqual([]);
        expect(data.candidateChecks[0].right.calculation.reductions).toEqual([]);
        expect(data.candidateChecks[0].left.replacements[0]?.notation).toEqual(data.assignment.notation);
    });
    it('uses an exact nonzero inverse and accepts independent verification notation', () => {
        const data = equation(eqInput('multiplication', n('p', 3, 4), n('q', 3, 2)));
        expect(validEquation(data)).toBe(true);
        expect(data.solutionWitness).toMatchObject({kind: 'isolated-variable', transformations: [{kind: 'divide-by-nonzero-coefficient', divisor: q(3, 4), rightQuotient: q(2)}]});
        const verification = buildStatementAssignmentCheck(data.statement, variable, data.ambientDomain,
            {symbolId: 'x', value: q(2), notation: {kind: 'decimal', coefficient: 200, scale: 2, numeral: '2.00'}});
        expect(validEquation(changed(data, ['solutionWitness', 'verification'], verification))).toBe(true);
        const bad = changed(data, ['assignment', 'notation'], {kind: 'integer', numeral: '0'});
        expect(validEquation(bad)).toBe(false);
    });
    it('classifies zero coefficients over infinite, finite and singleton numeric domains without division', () => {
        for (const [ambientDomain, values, cardinality] of [[all, [q(0), q(2)], {kind: 'infinite'}],
            [finite(0, 1, 2), [q(0), q(2)], {kind: 'finite', count: 3}],
            [domain(1, 1), [q(1)], {kind: 'finite', count: 1}]] as const) {
            const data = equation(eqInput('multiplication', n('p', 0), n('q', 0), ambientDomain, values));
            expect(validEquation(data)).toBe(true);
            expect(data.ambientSolution).toEqual({kind: 'all-domain', reason: 'constant-identity'});
            expect(data.solutionCardinality).toEqual(cardinality);
            expect(data.solutionWitness).toMatchObject({kind: 'zero-coefficient', constantTruth: true});
            const none = equation(eqInput('multiplication', n('p', 0), n('q', 1), ambientDomain, values));
            expect(validEquation(none)).toBe(true);
            expect(none.ambientSolution).toEqual({kind: 'empty', reason: 'constant-contradiction'});
            expect(none.solutionCardinality).toEqual({kind: 'finite', count: 0});
        }
    });
    it('proves impossible nonnegative addition without storing a negative root', () => {
        const input = eqInput('addition', n('p', 2), n('q', 1), domain(0, null), [q(0), q(1)]);
        const context: ElementaryEquationContext = {kind: 'combined-amounts', variableQuantity: {quantityId: 'initial', meaning: 'initial-amount', unit: money},
            addedQuantity: {quantityId: 'added', meaning: 'added-amount', unit: money, value: q(2), notation: n('p', 2).notation},
            totalQuantity: {quantityId: 'total', meaning: 'total-amount', unit: money, value: q(1), notation: n('q', 1).notation}};
        const data = equation({...input, context});
        expect(validEquation(data)).toBe(true);
        expect(data.ambientSolution.kind).toBe('empty');
        expect(data.solutionWitness).toEqual({kind: 'nonnegative-addend-exceeds-total', addend: q(2), total: q(1), addendGreaterThanTotal: true});
        function inspect(value: unknown): void {
            if (Array.isArray(value)) value.forEach(inspect);
            else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
                if (key === 'numerator') expect(item).toBeGreaterThanOrEqual(0); else inspect(item);
            }
        }
        inspect(data);
        const signed = equation(eqInput('addition', n('p', 2), n('q', 1)));
        expect(validEquation(signed)).toBe(true);
        expect(signed.ambientSolution).toMatchObject({kind: 'singleton', value: q(-1)});
    });
    it('retains domain exclusions/open bounds and complete finite ambient checks independently of candidates', () => {
        for (const ambientDomain of [domain(0, 2, true, true, [1]), domain(0, 1, true, false), finite(0, 2)]) {
            const data = equation(eqInput('addition', n('p', 1), n('q', 2), ambientDomain, [q(0)]));
            expect(validEquation(data)).toBe(true);
            expect(data.ambientSolution.kind).toBe('empty');
            expect(data.solutionWitness).toMatchObject({kind: 'isolated-variable', algebraicValue: q(1), admissible: false, verification: null});
            expect(data.ambientChecks.length).toBe(ambientDomain.kind === 'finite' ? 2 : 0);
        }
    });
    it('accepts original grouping and a different valid multi-step inverse trace', () => {
        const input = eqInput('addition', n('p', 3), n('q', 5));
        const grouped = {...input, statement: {...input.statement, left: g('outer', input.statement.left), right: g('right-group', input.statement.right)}};
        expect(validEquation(equation(grouped))).toBe(true);
        const data = equation(input);
        const middle: ExactEquation = {operator: 'equal', left: b('middle', 'addition', v('middle-x'), n('two', 2)), right: n('four', 4)};
        const final: ExactEquation = {operator: 'equal', left: v('final-x'), right: {...n('final-two', 2), notation: {kind: 'decimal', coefficient: 200, scale: 2, numeral: '2.00'}}};
        const steps = [{kind: 'subtract-same-addend', before: input.statement, operand: q(1), after: middle, rightDifference: q(4)},
            {kind: 'subtract-same-addend', before: middle, operand: q(2), after: final, rightDifference: q(2)}];
        expect(validEquation(changed(data, ['solutionWitness', 'transformations'], steps))).toBe(true);
        expect(validEquation(changed(data, ['solutionWitness', 'transformations'], [{...steps[0], rightDifference: q(3)}, steps[1]]))).toBe(false);
    });
    it('agrees with independent exact cross products over signed rational equations and finite sets', () => {
        for (const operation of ['addition', 'multiplication'] as const) for (let p = -3; p <= 3; p++) for (let total = -3; total <= 3; total++) {
            const data = equation(eqInput(operation, n('p', p, 2), n('q', total, 3), finite(-1, 0, 1), [q(0)]));
            expect(validEquation(data)).toBe(true);
            const expected = [-1, 0, 1].filter(x => operation === 'addition' ? BigInt(6 * x + 3 * p) === BigInt(2 * total) : BigInt(3 * p * x) === BigInt(2 * total));
            expect(data.ambientChecks.filter(row => row.comparison.truth).map(row => row.binding.value.numerator)).toEqual(expected);
            expect(data.solutionCardinality).toEqual({kind: 'finite', count: expected.length});
        }
    });
});

describe('complete strict rational intersections', () => {
    it.each(['less', 'greater'] as const)('supplies the full open %s ray and finite candidate truth separately', direction => {
        const data = inequality(ineqInput(direction));
        expect(validInequality(data)).toBe(true);
        expect(data.ambientSolution).toMatchObject({kind: 'ray', boundary: q(3, 2), boundaryIncluded: false, direction,
            infiniteFamily: {direction: direction === 'less' ? 'subtract' : 'add', step: q(1)}});
        expect(data.candidateChecks.map(row => row.comparison.truth)).toEqual(direction === 'less' ? [true, true, false, false] : [false, false, false, true]);
        expect(data.solutionCardinality).toEqual({kind: 'infinite'});
        expect(data.solutionLine.boundary).toMatchObject({value: q(3, 2), tickIndex: 7});
        const alternate = changed(data, ['ambientSolution', 'infiniteFamily', 'step'], q(1, 3));
        expect(validInequality(alternate)).toBe(true);
    });
    it.each(['less', 'greater'] as const)('constructs bounded and nonnegative %s intersections as intervals, not rays', direction => {
        for (const ambientDomain of [domain(-1, 3), domain(0, null)]) {
            const data = inequality(ineqInput(direction, ambientDomain));
            expect(validInequality(data)).toBe(true);
            expect(data.ambientSolution.kind).toBe('interval');
            expect(data.solutionCardinality.kind).toBe('infinite');
            if (data.ambientSolution.kind !== 'interval') throw Error('fixture');
            expect(direction === 'less' ? data.ambientSolution.upper : data.ambientSolution.lower).toEqual({value: q(3, 2), inclusive: false});
        }
    });
    it('preserves interior holes, absorbs excluded endpoints, and does not require irrelevant exclusions on the frame', () => {
        const input = ineqInput('less', domain(0, 2, true, true, [-4, 0, 1]), n('threshold', 3, 2), [q(1, 2)]);
        const data = inequality(input);
        expect(validInequality(data)).toBe(true);
        expect(data.ambientSolution).toMatchObject({kind: 'interval', lower: {value: q(0), inclusive: false}, excludedValues: [q(1)]});
        expect(data.solutionLine.auxiliaryLocations.map(row => row.value)).toEqual([q(0), q(2), q(1)]);
        expect(validInequality(changed(data, ['ambientSolution', 'excludedValues'], []))).toBe(false);
        expect(validInequality(changed(data, ['ambientSolution', 'infiniteSubinterval'], {lower: q(0), upper: q(3, 2), interior: q(1, 2)}))).toBe(false);
        const alternate = changed(data, ['ambientSolution', 'infiniteSubinterval'], {lower: q(1), upper: q(3, 2), interior: q(5, 4)});
        expect(validInequality(alternate)).toBe(true);
    });
    it('keeps finite full-domain tables independent of a smaller candidate universe for every result tag', () => {
        for (const [boundary, kind, count] of [[0, 'empty', 0], [1 / 2, 'singleton', 1], [3 / 2, 'finite', 2], [3, 'all-domain', 3]] as const) {
            const literal = boundary === 1 / 2 ? n('threshold', 1, 2) : boundary === 3 / 2 ? n('threshold', 3, 2) : n('threshold', boundary);
            const data = inequality(ineqInput('less', finite(0, 1, 2), literal, [q(0), q(2)]));
            expect(validInequality(data)).toBe(true);
            expect(data.ambientSolution.kind).toBe(kind);
            expect(data.solutionCardinality).toEqual({kind: 'finite', count});
            expect(data.ambientChecks).toHaveLength(3);
            expect(data.candidateChecks).toHaveLength(2);
            expect(validInequality(changed(data, ['ambientChecks'], [...data.ambientChecks].reverse()))).toBe(true);
        }
    });
    it('distinguishes all-domain numeric singleton cardinality from infinite all-domain intervals and holes', () => {
        for (const [ambientDomain, values, expected] of [[domain(0, 0), [q(0)], {kind: 'finite', count: 1}],
            [domain(0, 2, true, true, [1]), [q(0), q(2)], {kind: 'infinite'}]] as const) {
            const data = inequality(ineqInput('less', ambientDomain, n('threshold', 3), values));
            expect(validInequality(data)).toBe(true);
            expect(data.ambientSolution.kind).toBe('all-domain');
            expect(data.solutionCardinality).toEqual(expected);
        }
        const empty = inequality(ineqInput('greater', domain(0, 2), n('threshold', 2), [q(0), q(2)]));
        expect(validInequality(empty)).toBe(true);
        expect(empty.ambientSolution.kind).toBe('empty');
    });
    it('accepts a generic two-tick endpoint frame and rejects missing exact geometric facts', () => {
        const data = inequality({...ineqInput('less', all, n('threshold', 1), [q(0), q(1)]), axis: makeSignedRationalAxis(q(1), 0, 1)});
        expect(validInequality(data)).toBe(true);
        const finiteData = inequality(ineqInput('less', finite(0, 1, 2), n('threshold', 3, 2), [q(0), q(1), q(2)]));
        expect(validInequality(changed(finiteData, ['solutionLine', 'auxiliaryLocations'], []))).toBe(false);
        expect(validInequality(changed(finiteData, ['solutionLine', 'boundary', 'tickIndex'], 0))).toBe(false);
        expect(() => inequality({...ineqInput(), axis: makeSignedRationalAxis(q(1), -1, 1)})).toThrow('every boundary');
    });
    it('certifies unbounded-left punctured intersections and accepts an alternative exact interval description', () => {
        const input = ineqInput('less', domain(null, 2, true, true, [0]), n('threshold', 3, 2), [q(1)]);
        const data = inequality(input);
        expect(validInequality(data)).toBe(true);
        expect(data.ambientSolution).toMatchObject({kind: 'interval', lower: null, excludedValues: [q(0)],
            infiniteSubinterval: {lower: q(-1), upper: q(0), interior: q(-1, 2)}});
        const ray = inequality(ineqInput());
        const alternative = {kind: 'interval', lower: null, upper: {value: q(3, 2), inclusive: false}, excludedValues: [],
            infiniteSubinterval: {lower: q(0), upper: q(1), interior: q(1, 2)}};
        expect(validInequality(changed(ray, ['ambientSolution'], alternative))).toBe(true);
    });
    it('fails clearly when an infinite result has no safely representable supporting gap', () => {
        const maximum = Number.MAX_SAFE_INTEGER;
        const input = ineqInput('greater', domain(0, null), n('threshold', maximum), [q(0)]);
        expect(() => inequality({...input, axis: makeSignedRationalAxis(q(maximum), 0, 1)})).toThrow('safely representable gap');
    });
});

describe('total complete-family proof guards', () => {
    it('rejects forged candidate/full-domain/cardinality links and malformed payloads', () => {
        const data = inequality(ineqInput('less', finite(0, 1, 2), n('threshold', 3, 2), [q(0), q(1), q(2)]));
        const mutations: [readonly (string | number)[], unknown][] = [
            [['candidateUniverse'], []], [['candidateUniverse'], new Array(2)], [['candidateUniverse', 1, 'id'], 'candidate-0'],
            [['candidateUniverse', 1, 'value'], q(0)], [['candidateUniverse', 1, 'notation'], {kind: 'integer', numeral: '9'}],
            [['candidateChecks'], []], [['candidateChecks', 0, 'candidateId'], 'wrong'], [['candidateChecks', 0, 'comparison', 'truth'], false],
            [['assignment', 'symbolId'], 'y'], [['restrictedSolutions', 'values'], []], [['ambientChecks'], data.ambientChecks.slice(1)],
            [['ambientChecks'], [data.ambientChecks[0], data.ambientChecks[0], data.ambientChecks[2]]],
            [['solutionCardinality', 'count'], -0], [['solutionCardinality', 'count'], 3], [['ambientSolution', 'values'], [q(0)]],
            [['bound', 'direction'], 'greater'], [['context', 'relationship'], 'strictly-above-threshold']];
        for (const [path, replacement] of mutations) expect(validInequality(changed(data, path, replacement)), path.join('.')).toBe(false);
        for (const value of [null, {}, {kind: 'bad'}, {get kind() {throw Error('accessor');}}]) {
            expect(validEquation(value)).toBe(false); expect(validInequality(value)).toBe(false);
        }
        expect(validInequality(changed(inequality(ineqInput()), ['ambientChecks'], [data.ambientChecks[0]]))).toBe(false);
        expect(validEquation(changed(equation(eqInput()), ['candidateChecks', 0, 'binding', 'notation'], {kind: 'integer', numeral: '0'}))).toBe(false);
    });
    it('rejects false inverse/exceptional/solution proof objects and incorrect syntax', () => {
        const data = equation(eqInput());
        for (const [path, replacement] of [[['form', 'addend'], q(1)], [['solutionWitness', 'admissible'], false], [['solutionWitness', 'algebraicValue'], q(1)],
            [['solutionWitness', 'verification'], null], [['solutionWitness', 'transformations'], []], [['solutionWitness', 'transformations', 0, 'operand'], q(1)],
            [['solutionWitness', 'transformations', 0, 'before', 'operator'], 'greater'], [['solutionWitness', 'transformations', 0, 'kind'], 'constant-comparison'],
            [['ambientSolution', 'kind'], 'all-domain'], [['ambientSolution', 'notation'], {kind: 'integer', numeral: '1'}]] as [readonly (string | number)[], unknown][]) {
            expect(validEquation(changed(data, path, replacement)), path.join('.')).toBe(false);
        }
        const zero = equation(eqInput('multiplication', n('p', 0), n('q', 0)));
        expect(validEquation(changed(zero, ['solutionWitness', 'constantTruth'], false))).toBe(false);
        expect(validEquation(changed(zero, ['ambientSolution', 'reason'], 'domain-entirely-satisfies-bound'))).toBe(false);
        const input = eqInput();
        expect(() => equation({...input, statement: {...input.statement, left: b('bad', 'subtraction', v(), n('p', 3, 4))}})).toThrow(GeneratorValidationError);
        expect(() => equation({...input, assignment: {...input.assignment, notation: {kind: 'integer', numeral: '0'}}})).toThrow('exactly match');
        expect(() => equation({...input, candidateUniverse: [input.candidateUniverse[0], input.candidateUniverse[0]]})).toThrow('unique');
        expect(() => inequality({...ineqInput(), statement: {operator: 'less', left: g('bad-group', v()), right: n('threshold', 1)}})).toThrow('exactly x<c');
    });
    it('rejects forged strict-ray infinity, domain and endpoint evidence', () => {
        const data = inequality(ineqInput());
        const mutations: [readonly (string | number)[], unknown][] = [
            [['ambientSolution'], null], [['ambientSolution', 'kind'], 'unknown'], [['ambientSolution', 'boundary'], q(1)],
            [['ambientSolution', 'direction'], 'greater'], [['ambientSolution', 'boundaryIncluded'], true],
            [['ambientSolution', 'infiniteFamily'], null], [['ambientSolution', 'infiniteFamily', 'kind'], 'finite-samples'],
            [['ambientSolution', 'infiniteFamily', 'base'], q(0)], [['ambientSolution', 'infiniteFamily', 'step'], q(0)],
            [['ambientSolution', 'infiniteFamily', 'direction'], 'add'], [['solutionCardinality', 'kind'], 'finite'],
            [['solutionLine', 'axis', 'step'], q(1)], [['solutionLine', 'auxiliaryLocations'], new Array(1)]];
        for (const [path, replacement] of mutations) expect(validInequality(changed(data, path, replacement)), path.join('.')).toBe(false);
        const bounded = inequality(ineqInput('less', domain(0, 2)));
        expect(validInequality(changed(bounded, ['ambientSolution'], data.ambientSolution))).toBe(false);
        for (const [path, replacement] of [[['ambientSolution', 'lower'], {value: q(0), inclusive: 'yes'}],
            [['ambientSolution', 'upper'], {value: q(0), inclusive: true}], [['ambientSolution', 'excludedValues'], [q(1), q(1)]],
            [['ambientSolution', 'infiniteSubinterval', 'interior'], q(2)], [['ambientSolution', 'infiniteSubinterval', 'lower'], q(-1)]] as [readonly (string | number)[], unknown][]) {
            expect(validInequality(changed(bounded, path, replacement)), path.join('.')).toBe(false);
        }
        const finiteData = inequality(ineqInput('less', finite(0, 1, 2), n('threshold', 3, 2), [q(0)]));
        expect(validInequality(changed(finiteData, ['ambientSolution', 'values'], []))).toBe(false);
        expect(validInequality(changed(finiteData, ['ambientSolution', 'values'], [q(0), q(0)]))).toBe(false);
        const empty = inequality(ineqInput('less', finite(0, 1), n('threshold', 0), [q(0)]));
        expect(validInequality(changed(empty, ['ambientSolution', 'reason'], 'constant-contradiction'))).toBe(false);
        expect(validInequality(changed(empty, ['ambientSolution', 'reason'], 'unknown'))).toBe(false);
    });
});
