import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {RatioTableComparisonsGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ratio-table-comparisons capabilities', () => {
    it.each([
        [[Area.NumericInequality, Scope.Less], 'less'],
        [[Area.NumericEquality, Scope.Equal], 'equal'],
        [[Area.NumericInequality, Scope.Greater], 'greater']
    ] as const)('resolves the correlated %s capability bundle', (labels, relation) => {
        const problem = generateWithLabels(new RatioTableComparisonsGenerator(), [...labels])!;
        expect(problem.data.relation).toBe(relation);
        expect(new Set(problem.labels)).toEqual(new Set(labels));
    });

    it('rejects competing or incomplete relation bundles', () => {
        for (const labels of [
            [Area.NumericEquality, Scope.Less],
            [Area.NumericInequality, Scope.Equal],
            [Area.NumericInequality, Scope.Less, Scope.Greater]
        ]) {
            expect(() => generateWithLabels(new RatioTableComparisonsGenerator(), labels)).toThrow();
        }
    });

    it('keeps all invariant mathematical claims separate from selected comparison', () => {
        expect(spec.generalLabels).toEqual([
            Area.RatioAntecedentInterpretation, Area.RatioConsequentInterpretation,
            Area.RatioEquivalence, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives
        ]);
    });
});
