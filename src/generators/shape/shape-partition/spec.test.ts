import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {ShapePartitionGenerator} from './generator.ts';
import {ShapePartitionGeneratorSchema, spec} from './spec.ts';

const generator = new ShapePartitionGenerator();

const generate = (labels: string[], seed: number) => {
    setSeed(seed);
    return generateWithLabels(generator, labels)!;
};

const abilities = [
    Ability.VisualArticulation,
    Ability.ActiveVocabulary,
    Ability.ConceptComposition,
    Ability.ConceptDerivation,
    Ability.Formalization,
    Ability.Interpretation
];

describe('ShapePartitionGenerator spec integration', () => {
    it('contains no Ability capability or parameter', () => {
        const labels = extractSchemaLabels(ShapePartitionGeneratorSchema);

        expect(spec.generalLabels).toEqual([Scope.EqualShares]);
        for (const ability of abilities) expect(labels).not.toContain(ability);
    });

    it('uses Area and Scope to select complete mathematical models', () => {
        expect(extractSchemaLabels(ShapePartitionGeneratorSchema)).toEqual(
            expect.arrayContaining([
                Area.ProportionSense,
                Area.ShapeDecomposition,
                Area.FractionInterpretation,
                Area.FractionCommonNumeratorComparison,
                Area.FractionNotation,
                Scope.UnitFractions,
                Scope.NonUnitFractions,
                Scope.Less
            ])
        );
    });

    it.each([
        [Ability.ActiveVocabulary, Ability.ConceptComposition],
        [Ability.VisualArticulation, Ability.Formalization]
    ] as const)('generates one equal-share model for %s and %s', (firstAbility, secondAbility) => {
        const mathematicalLabels = [
            Area.FractionInterpretation,
            Scope.EqualShares,
            Scope.UnitFractions,
            Area.Circle
        ];
        const first = generate([...mathematicalLabels, firstAbility], 31);
        const second = generate([...mathematicalLabels, secondAbility], 31);

        expect(first.data).toEqual(second.data);
        expect(first.data.model).toBe('equal-share-partition');
        expect(first.tags).not.toContain(firstAbility);
        expect(second.tags).not.toContain(secondAbility);
    });

    it('ignores the combined articulation/formalization projection during generation', () => {
        const mathematicalLabels = [
            Area.ProportionSense,
            Scope.EqualShares,
            Scope.UnitFractions,
            Area.Rectangle
        ];
        const combined = generate([
            ...mathematicalLabels,
            Ability.VisualArticulation,
            Ability.Formalization
        ], 19);
        const withoutAbilities = generate(mathematicalLabels, 19);

        expect(combined.data).toEqual(withoutAbilities.data);
        expect(combined.data.model).toBe('equal-share-partition');
        expect(combined.tags).not.toContain(Ability.VisualArticulation);
        expect(combined.tags).not.toContain(Ability.Formalization);
    });

    it('resolves comparison and fraction-region models from non-Ability labels', () => {
        const comparison = generate([
            Area.FractionCommonNumeratorComparison,
            Scope.EqualShares,
            Scope.UnitFractions,
            Scope.Less,
            Ability.ConceptDerivation,
            Area.Circle
        ], 7);
        const interpretation = generate([
            Area.FractionNotation,
            Area.ProportionSense,
            Scope.EqualShares,
            Scope.NonUnitFractions,
            Ability.Interpretation,
            Area.Rectangle
        ], 7);

        expect(comparison.data.model).toBe('unit-share-comparison');
        expect(interpretation.data.model).toBe('fraction-region');
        expect(comparison.tags).not.toContain(Ability.ConceptDerivation);
        expect(interpretation.tags).not.toContain(Ability.Interpretation);
    });
});
