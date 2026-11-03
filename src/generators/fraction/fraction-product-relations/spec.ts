import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {GeneratorCompatibilityRule} from '../../../types/compatibility.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {fractionProductUpperBounds} from '../fraction-product-domain.ts';

const productProfiles = [
    [[Area.Division, Area.FractionNumeratorInterpretation,
        Area.FractionDenominatorInterpretation, Scope.FractionNumbers,
        Scope.EqualShares, Scope.ProperFractions], 'fraction-partition-proper'],
    [[Area.Division, Area.FractionNumeratorInterpretation,
        Area.FractionDenominatorInterpretation, Scope.FractionNumbers,
        Scope.EqualShares, Scope.ImproperFractions], 'fraction-partition-improper'],
    [[Area.Equation, Scope.FractionNumbers,
        Scope.SingleFrameOfReference, Scope.ProperFractions], 'fraction-equation-proper'],
    [[Area.Equation, Scope.FractionNumbers,
        Scope.SingleFrameOfReference, Scope.ImproperFractions], 'fraction-equation-improper'],
    [[Area.Equation, Scope.MixedNumbers, Scope.ImproperFractions,
        Scope.SingleFrameOfReference], 'mixed-equation']
] as const;

const exactProfile = selectExactLabelSetMap(productProfiles);
const profileLabels = [...new Set(productProfiles.flatMap(([labels]) => labels))];
const ranges = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20]] as const;
const rangeLabels = ranges.map(([label]) => label);

// A broad FractionNumbers request must not silently select mixed original
// operands merely because MixedNumbers specializes FractionNumbers.
const resolveProductProfile = withLabelChoices(exactResolver((labels: string[],
    supportedLabels?: readonly string[]) => {
    if (labels.includes(Scope.FractionNumbers) && labels.includes(Scope.MixedNumbers)) return undefined;
    const profile = exactProfile(labels, supportedLabels);
    const upper = ranges.find(([label]) => labels.includes(label))?.[1];
    return profile && (upper === undefined || fractionProductUpperBounds('relation', profile).includes(upper)) ? profile : undefined;
}), {kind: 'alternatives', alternatives: productProfiles.map(([labels]) => [...labels]), contextLabels: rangeLabels});
const exactRange = selectExactLabelMap(ranges.map(([label, upper]) => [label, createCanonicalNumericRange(upper)] as const));
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const profile = exactProfile(labels), range = exactRange(labels);
    if (!profile) return range;
    return range && fractionProductUpperBounds('relation', profile).includes(range.max) ? range : undefined;
}), {...exactRange.labelChoices!, contextLabels: profileLabels, resolvedContext: true});

const originalOperandForm: GeneratorCompatibilityRule = {
    id: 'fraction-product-original-operand-form',
    dependencies: [
        {scope: 'target', label: Scope.FractionNumbers},
        {scope: 'target', label: Scope.MixedNumbers},
        {scope: 'generator', label: Scope.MixedNumbers}
    ],
    predicate: labels => !(
        labels.exact('target', Scope.FractionNumbers)
        && !labels.exact('target', Scope.MixedNumbers)
        && labels.exact('generator', Scope.MixedNumbers)
    )
};

export const spec: GeneratorSpec = {
    generatorId: 'fraction-product-relations',
    generalLabels: [Area.Multiplication, Scope.NumbersWithoutNegatives],
    compatibility: [originalOperandForm, generatorLabelRule('fraction-product-range-profile', [...profileLabels, ...rangeLabels], selected => {
        const profile = productProfiles.find(([labels]) => labels.every(selected))?.[1];
        const upper = ranges.find(([label]) => selected(label))?.[1];
        return !!profile && upper !== undefined && fractionProductUpperBounds('relation', profile).includes(upper);
    })]
};

export const FractionProductRelationsGeneratorSchema = {
    productProfile: [[
        Area.Division,
        Area.FractionNumeratorInterpretation,
        Area.FractionDenominatorInterpretation,
        Area.Equation,
        Scope.FractionNumbers,
        Scope.MixedNumbers,
        Scope.ImproperFractions,
        Scope.ProperFractions,
        Scope.EqualShares,
        Scope.SingleFrameOfReference
    ], resolveProductProfile, productProfiles.map(([labels]) => labels)],
    range: [rangeLabels, resolveRange, rangeLabels.map(label => [label])]
} as const;

export type FractionProductRelationsGeneratorConfig = ConfigFromSchema<
    typeof FractionProductRelationsGeneratorSchema
>;
