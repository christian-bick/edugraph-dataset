import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {type ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';

import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const rangeChoices = [[Scope.NumbersSmaller5], [Scope.NumbersSmaller10]];
const rangeLabels = rangeChoices.flat();
const resolveComparisonRange = withLabelChoices(exactResolver((labels: string[]) => {
    const selected = rangeLabels.filter(label => labels.includes(label));
    if (selected.length > 1) throw new Error('Select exactly one comparison part-count range.');
    if (!selected.length) return undefined;
    const upper = selected[0] === Scope.NumbersSmaller5 ? 5 : 10;
    return labels.includes(Scope.Equal) && upper === 5 ? undefined : createCanonicalNumericRange(upper);
}), {kind: 'alternatives', alternatives: rangeChoices, contextLabels: [Scope.Equal], resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'fraction-comparison',
    compatibility: [generatorLabelRule('fraction-comparison-part-count-range', [Scope.Equal, ...rangeLabels],
        selected => !selected(Scope.Equal) || selected(Scope.NumbersSmaller10)), generatorLabelRule('fraction-comparison-strategy', [
        Area.NumericEquality, Area.NumericInequality, Area.FractionCommonDenominatorComparison,
        Area.FractionCommonNumeratorComparison, Area.FractionReferenceComparison,
        Scope.CommonDenominator, Scope.CommonNumerator, Scope.Equal, Scope.Greater, Scope.Less
    ], selected => {
        const denominator = selected(Scope.CommonDenominator);
        const numerator = selected(Scope.CommonNumerator);
        const unequal = selected(Scope.Greater) || selected(Scope.Less);
        if (selected(Area.FractionReferenceComparison)) {
            return !denominator && !numerator && (selected(Scope.Equal)
                ? selected(Area.NumericEquality)
                : unequal && selected(Area.NumericInequality));
        }
        return unequal && (selected(Area.FractionCommonDenominatorComparison) && denominator && !numerator
            || selected(Area.FractionCommonNumeratorComparison) && numerator && !denominator);
    })],
    generalLabels: [
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const FractionComparisonGeneratorSchema = {
    comparisonMode: [[
        Area.NumericEquality,
        Area.NumericInequality,
        Area.FractionCommonDenominatorComparison,
        Area.FractionCommonNumeratorComparison
    ], selectExactMatch],
    usesReferenceComparison: [[
        Area.FractionReferenceComparison
    ], hasLabel(Area.FractionReferenceComparison)],
    usesCommonDenominator: [[Scope.CommonDenominator], hasLabel(Scope.CommonDenominator)],
    usesCommonNumerator: [[Scope.CommonNumerator], hasLabel(Scope.CommonNumerator)],
    relation: [[Scope.Greater, Scope.Equal, Scope.Less], selectExactMatch],
    range: [rangeLabels, resolveComparisonRange, rangeChoices]
} as const;

export type FractionComparisonGeneratorConfig = ConfigFromSchema<
    typeof FractionComparisonGeneratorSchema
>;
