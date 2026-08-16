import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {FractionComparisonGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('FractionComparisonGenerator spec integration', () => {
    const generator = new FractionComparisonGenerator();

    it('declares invariant mathematical capabilities without the visual representation', () => {
        expect(spec).toEqual({
            generatorId: 'fraction-comparison',
            generalLabels: [
                Area.NumericComparison,
                Area.FractionNotation,
                Scope.ProperFractions,
                Scope.SingleFrameOfReference,
                Ability.ConceptDerivation
            ]
        });
        expect(spec.generalLabels).not.toContain(Scope.VisualNumbers);
    });

    it.each([
        [Scope.CommonDenominator, Area.FractionNumeratorInterpretation, Scope.Greater, 'common-denominator'],
        [Scope.CommonDenominator, Area.FractionNumeratorInterpretation, Scope.Less, 'common-denominator'],
        [Scope.CommonNumerator, Area.FractionDenominatorInterpretation, Scope.Greater, 'common-numerator'],
        [Scope.CommonNumerator, Area.FractionDenominatorInterpretation, Scope.Less, 'common-numerator']
    ] as const)('resolves the exact %s / %s / %s mode', (
        comparisonFamily,
        interpretation,
        relation,
        expectedFamily
    ) => {
        setSeed(`${comparisonFamily}-${relation}`);
        const stub = generateWithLabels(generator, [
            Area.NumericComparison,
            Area.FractionNotation,
            Scope.ProperFractions,
            Scope.SingleFrameOfReference,
            Ability.ConceptDerivation,
            comparisonFamily,
            interpretation,
            relation
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.family).toBe(expectedFamily);
        expect(stub!.tags).toEqual(expect.arrayContaining([
            comparisonFamily,
            interpretation,
            relation
        ]));
    });
});
