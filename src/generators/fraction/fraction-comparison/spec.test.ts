import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {FractionComparisonGenerator} from './generator.ts';
import {FractionComparisonGeneratorSchema, spec} from './spec.ts';

describe('FractionComparisonGenerator spec integration', () => {
    const generator = new FractionComparisonGenerator();

    const comparisonLabels = (
        strategy: Area.FractionCommonDenominatorComparison | Area.FractionCommonNumeratorComparison,
        family: Scope.CommonDenominator | Scope.CommonNumerator,
        relation: Scope.Greater | Scope.Less
    ) => [
        strategy,
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        family,
        relation,
        Ability.LogicalInference
    ];

    it('declares invariant mathematical capabilities without the visual representation', () => {
        expect({generatorId: spec.generatorId, generalLabels: spec.generalLabels}).toEqual({
            generatorId: 'fraction-comparison',
            generalLabels: [
                Scope.ProperFractions,
                Scope.SingleFrameOfReference,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersWithoutZero
            ]
        });
        expect(spec.generalLabels).not.toContain(Scope.VisualNumbers);
    });

    it('declares both part-count bands before generation and preserves standalone fallback contracts', () => {
        const range = normalizeSchemaChoices(FractionComparisonGeneratorSchema, [], 'generator').find(field => field.field === 'range');
        expect(new Set(range?.alternatives.map(alternative => JSON.stringify(alternative.labels))))
            .toEqual(new Set([[Scope.NumbersSmaller5], [Scope.NumbersSmaller10]].map(labels => JSON.stringify(labels))));
        expect(spec.generalLabels).not.toContain(Scope.NumbersSmaller5);
        expect(spec.generalLabels).not.toContain(Scope.NumbersSmaller10);
        expect(findSchemaFallbackContractIssues(FractionComparisonGeneratorSchema)).toEqual([]);
    });

    it.each([
        [Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Greater],
        [Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Less],
        [Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Greater],
        [Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Less],
        [Area.NumericInequality, Area.FractionReferenceComparison, Scope.Greater],
        [Area.NumericInequality, Area.FractionReferenceComparison, Scope.Less]
    ] as const)('resolves both explicit part-count bands for %s / %s / %s', (strategy, family, relation) => {
        for (const [label, upper] of [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10]] as const) {
            const resolved = extractConfig(FractionComparisonGeneratorSchema, [strategy, family, relation, label]);
            expect(resolved.config.range).toEqual(createCanonicalNumericRange(upper));
            expect(resolved.resolvedLabels).toContain(label);
            expect(generator.generate(resolved.config).data.relation).toBe(relation === Scope.Greater ? 'greater' : 'less');
        }
    });

    it('resolves equality only to upper10 and rejects contradictory range ownership', () => {
        const equality = [Area.NumericEquality, Area.FractionReferenceComparison, Scope.Equal];
        expect(extractConfig(FractionComparisonGeneratorSchema, equality).config.range).toEqual(createCanonicalNumericRange(10));
        expect(extractConfig(FractionComparisonGeneratorSchema, [...equality, Scope.NumbersSmaller10]).config.range)
            .toEqual(createCanonicalNumericRange(10));
        expect(() => extractConfig(FractionComparisonGeneratorSchema, [...equality, Scope.NumbersSmaller5])).toThrow();
        expect(() => extractConfig(FractionComparisonGeneratorSchema, [Scope.NumbersSmaller5, Scope.NumbersSmaller10])).toThrow();
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
        expect(stub!.labels).toEqual(expect.arrayContaining([
            strategy,
            comparisonFamily,
            relation
        ]));
        expect(stub!.labels).not.toContain(Ability.LogicalInference);
    });

    it.each([
        [Area.NumericInequality, Scope.Greater, '928f1181'],
        [Area.NumericEquality, Scope.Equal, 'b66df27a'],
        [Area.NumericInequality, Scope.Less, '007bf5e6']
    ] as const)('resolves the corrected Grade 4 %s / %s target', (
        comparisonKind,
        relation,
        expectedHash
    ) => {
        const labels = [
            comparisonKind,
            Area.FractionReferenceComparison,
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
        expect(stub!.labels).toEqual(expect.arrayContaining([
            comparisonKind,
            relation
        ]));
        expect(stub!.labels).not.toContain(Ability.ProcedureUnderstanding);
        expect(stub!.labels).not.toContain(Scope.VisualNumbers);
        expect(stub!.labels).not.toContain(Scope.SingleFrameOfReference);
    });
});
