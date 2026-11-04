import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import type {CompatibilityQueries, LabelScope} from '../../../types/compatibility.ts';
import {writingScalarCapacityRule} from './writing-capacity.ts';

const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000] as const;
const upper = (value: number) => `http://edugraph.io/edu/NumbersSmaller${value}`;
function queries(generator: readonly string[], target: readonly string[] = [], view: readonly string[] = []): CompatibilityQueries {
    const scopes = {generator, target, view};
    const exact = (scope: LabelScope, label: string) => scopes[scope].includes(label);
    return {exact, has: exact};
}

describe('writing scalar renderer capacities', () => {
    it.each([120, 1000] as const)('admits exactly the positive scalar bands supported through %i', maximum => {
        const rule = writingScalarCapacityRule('capacity', maximum);
        for (const value of thresholds)
            expect(rule.predicate(queries([Scope.NumbersWithoutZero, upper(value)]))).toBe(value <= maximum);
        expect(rule.predicate(queries([Scope.NumbersWithoutZero]))).toBe(false);
        expect(rule.predicate(queries([]))).toBe(false);
    });

    it.each([120, 1000] as const)('preserves explicit scalar zero with broad or missing range at capacity %i', maximum => {
        const rule = writingScalarCapacityRule('capacity', maximum);
        for (const labels of [[], [upper(1000000)], [Scope.NumbersLargerZero, upper(10000)]])
            expect(rule.predicate(queries([Scope.NumbersWithZero, ...labels]))).toBe(true);
    });

    it.each([120, 1000] as const)('does not borrow zero or capacity evidence from another role at capacity %i', maximum => {
        const rule = writingScalarCapacityRule('capacity', maximum);
        expect(rule.predicate(queries([upper(1000000)], [Scope.NumbersWithZero]))).toBe(false);
        expect(rule.predicate(queries([upper(1000000)], [], [Scope.NumbersWithZero]))).toBe(false);
        expect(rule.predicate(queries([Scope.NumbersWithoutZero], [upper(5)], [upper(5)]))).toBe(false);
    });

    it.each([120, 1000] as const)('declares every queried semantic dependency at capacity %i', maximum => {
        const rule = writingScalarCapacityRule('capacity', maximum);
        const queried: {scope: LabelScope; label: string}[] = [];
        rule.predicate({has: () => {throw Error('Capacity is an exact selected-label contract.');},
            exact: (scope, label) => {queried.push({scope, label}); return false;}});
        expect(queried).toEqual(rule.dependencies);
        expect(queried.every(({scope}) => scope === 'generator')).toBe(true);
        expect(queried.map(({label}) => label)).toEqual([
            Scope.NumbersWithZero, ...thresholds.filter(value => value <= maximum).map(upper)
        ]);
        expect(rule.id).toBe('capacity');
    });
});
