import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import type {NumericalDataProblem, NumericalDataScalar} from '../../../types/problems.ts';
import {isNumericalDataProblem} from '../numerical-data-helpers.ts';
import {numericalRelationSets} from '../numerical-data-inputs.ts';
import {NumericalDataGenerator} from './generator.ts';
import type {NumericalDataGeneratorConfig} from './spec.ts';

type Fraction = readonly [bigint, bigint];
function reduce(n: bigint, d: bigint): Fraction {
    let a = n < 0n ? -n : n, b = d;
    while (b) [a, b] = [b, a % b];
    return [n / a, d / a];
}
const fraction = (q: NumericalDataScalar): Fraction => [BigInt(q.numerator), BigInt(q.denominator)];
const add = (a: Fraction, b: Fraction) => reduce(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const subtract = (a: Fraction, b: Fraction) => add(a, [-b[0], b[1]]);
const divided = (q: Fraction, n: number) => reduce(q[0], q[1] * BigInt(n));
const key = (q: Fraction) => `${q[0]}/${q[1]}`;
const middle = (values: readonly Fraction[]) => values.length % 2 ? values[Math.floor(values.length / 2)]
    : divided(add(values[values.length / 2 - 1], values[values.length / 2]), 2);

function independentSummary(data: NumericalDataProblem) {
    const values = data.records.map(row => fraction(row.value)), count = values.length;
    const ordered = data.records.map((row, i) => ({row, i, q: fraction(row.value)})).sort((a, b) => {
        const difference = a.q[0] * b.q[1] - b.q[0] * a.q[1]; return difference < 0n ? -1 : difference > 0n ? 1 : a.i - b.i;
    });
    const sorted = ordered.map(row => row.q), sum = values.reduce(add, [0n, 1n]), mean = divided(sum, count);
    const deviations = values.map(q => subtract(q, mean)), absolute = deviations.map(q => [q[0] < 0n ? -q[0] : q[0], q[1]] as const);
    const q1 = middle(sorted.slice(0, Math.floor(count / 2))), q3 = middle(sorted.slice(Math.ceil(count / 2)));
    const expected = {sum, mean, median: middle(sorted), q1, q3, iqr: subtract(q3, q1), mad: divided(absolute.reduce(add, [0n, 1n]), count)};
    expect(data.summary.count).toBe(count);
    expect(data.summary.orderedRecordIds).toEqual(ordered.map(row => row.row.id));
    for (const name of ['sum', 'mean', 'iqr', 'mad'] as const) expect(key(fraction(data.summary[name]))).toBe(key(expected[name]));
    expect(key(fraction(data.summary.median.value))).toBe(key(expected.median));
    expect(key(fraction(data.summary.quartiles.q1))).toBe(key(q1)); expect(key(fraction(data.summary.quartiles.q3))).toBe(key(q3));
    expect(key(deviations.reduce(add, [0n, 1n]))).toBe('0/1');
    expect(data.summary.deviations.map(row => row.recordId)).toEqual(data.records.map(row => row.id));
    expect(new Set(data.frequencies.flatMap(row => row.recordIds))).toEqual(new Set(data.records.map(row => row.id)));
    expect(data.frequencies.reduce((total, row) => total + row.count, 0)).toBe(count);
    expect(data.plots.dots).toHaveLength(count);
    expect(data.plots.histogram.bins.reduce((total, row) => total + row.count, 0)).toBe(count);
}

describe('NumericalDataGenerator', () => {
    const generator = new NumericalDataGenerator();
    it('materializes every selected theorem set with independently exact summaries and multiplicities', () => {
        const attributes = new Set(), designs = new Set(), goals = new Set();
        for (const relations of Object.values(numericalRelationSets)) for (let seed = 0; seed < 96; seed++) {
            setSeed(seed);
            const problem = generator.generate({relations});
            expect(isNumericalDataProblem(problem.data)).toBe(true);
            independentSummary(problem.data);
            expect(Object.keys(problem)).toEqual(['data']);
            expect(Object.keys(problem.data).sort()).toEqual(['departureFacts', 'frequencies', 'kind', 'plots', 'records', 'relations', 'shapeFacts', 'study', 'summary']);
            expect(new Set(problem.data.relations.map(row => row.kind))).toEqual(new Set(relations));
            expect(problem.data.relations).toHaveLength(relations.length);
            attributes.add(problem.data.study.attribute.kind); designs.add(problem.data.study.selection); goals.add(problem.data.study.goal.kind);
        }
        expect(attributes).toEqual(new Set(['length', 'duration', 'count', 'temperature']));
        expect(designs).toEqual(new Set(['distinct-units', 'repeated-occasions']));
        expect(goals).toEqual(new Set(['equally-allocated-total', 'describe-recorded-collection', 'routine-member']));
    });

    it('uses exactly one source-instance draw and replays full payload and continuation for every binding', () => {
        for (const relations of Object.values(numericalRelationSets)) {
            setSeed(941); random(); const expectedState = getRandomState(), next = random();
            setSeed(941); const first = generator.generate({relations});
            expect(getRandomState()).toBe(expectedState); expect(random()).toBe(next);
            setSeed(941); expect(generator.generate({relations})).toEqual(first); expect(random()).toBe(next);
        }
    });

    it('rejects empty, missing and unsupported relation configurations before entropy is consumed', () => {
        for (const invalid of [{}, {relations: undefined}, {relations: []}, {relations: ['arithmetic-mean', 'quartiles']}, {relations: ['unknown']}, {relations: ['median', 'median']}]) {
            setSeed(42); const state = getRandomState();
            expect(() => generator.generate(invalid as NumericalDataGeneratorConfig)).toThrow(GeneratorValidationError);
            expect(getRandomState()).toBe(state);
        }
    });
});
