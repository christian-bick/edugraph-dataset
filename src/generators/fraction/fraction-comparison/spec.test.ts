import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {FractionComparisonGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('FractionComparisonGenerator spec integration', () => {
    const generator = new FractionComparisonGenerator();

    const comparisonLabels = (
        strategy: Area.FractionCommonDenominatorComparison | Area.FractionCommonNumeratorComparison,
        family: Scope.CommonDenominator | Scope.CommonNumerator,
        relation: Scope.Greater | Scope.Less
    ) => [
        strategy,
        Area.FractionNotation,
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        family,
        relation,
        Ability.LogicalInference
    ];

    it('declares invariant mathematical capabilities without the visual representation', () => {
        expect(spec).toEqual({
            generatorId: 'fraction-comparison',
            generalLabels: [
                Area.FractionNotation,
                Scope.ProperFractions,
                Scope.SingleFrameOfReference
            ]
        });
        expect(spec.generalLabels).not.toContain(Scope.VisualNumbers);
    });

    it.each([
        [Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Greater, 'common-denominator'],
        [Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Less, 'common-denominator'],
        [Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Greater, 'common-numerator'],
        [Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Less, 'common-numerator']
    ] as const)('resolves the exact %s / %s / %s mode', (
        strategy,
        comparisonFamily,
        relation,
        expectedFamily
    ) => {
        const labels = comparisonLabels(strategy, comparisonFamily, relation);
        setSeed(`${comparisonFamily}-${relation}`);
        const stub = generateWithLabels(generator, labels);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('compare-fractions');
        if (stub!.data.task !== 'compare-fractions') throw new Error('Expected common-component comparison.');
        expect(stub!.data.family).toBe(expectedFamily);
        expect(stub!.tags).toEqual(expect.arrayContaining([
            strategy,
            comparisonFamily,
            relation,
            Ability.LogicalInference
        ]));
    });

    it.each([
        [Area.NumericInequality, Scope.Greater, 'f401dab7'],
        [Area.NumericEquality, Scope.Equal, '386d3640'],
        [Area.NumericInequality, Scope.Less, '8481a534']
    ] as const)('resolves the corrected Grade 4 %s / %s target', (
        comparisonKind,
        relation,
        expectedHash
    ) => {
        const labels = [
            comparisonKind,
            Area.FractionReferenceComparison,
            Area.FractionNotation,
            Scope.FractionNumbers,
            Scope.SingleFrameOfReference,
            Scope.VisualNumbers,
            Ability.ProcedureUnderstanding,
            relation
        ];
        expect(labelSetHash(labels)).toBe(expectedHash);
        setSeed(expectedHash);
        const stub = generateWithLabels(generator, labels);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('compare-unlike-fractions');
        expect(stub!.tags).toEqual(expect.arrayContaining([
            comparisonKind,
            Ability.ProcedureUnderstanding,
            relation
        ]));
        expect(stub!.tags).not.toContain(Scope.VisualNumbers);
        expect(stub!.tags).not.toContain(Scope.SingleFrameOfReference);
    });
});
