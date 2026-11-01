import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {resolveGroupCountProfile} from './group-count-profile.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {divisionRangeRows, hasSharedDivisionRange} from './numeric-domain.ts';

const operandProfiles = [
    [[Scope.FractionDividend, Scope.FractionDivisor, Scope.ProperFractions], 'fraction-by-fraction-proper'],
    [[Scope.FractionDividend, Scope.FractionDivisor, Scope.ImproperFractions], 'fraction-by-fraction-improper'],
    [[Scope.FractionDividend, Scope.IntegerDivisor, Scope.ProperFractions], 'fraction-by-integer-proper'],
    [[Scope.FractionDividend, Scope.IntegerDivisor, Scope.ImproperFractions], 'fraction-by-integer-improper'],
    [[Scope.IntegerDividend, Scope.FractionDivisor, Scope.ProperFractions], 'integer-by-fraction-proper'],
    [[Scope.IntegerDividend, Scope.FractionDivisor, Scope.ImproperFractions], 'integer-by-fraction-improper']
] as const;
const operandLabels = [...new Set(operandProfiles.flatMap(([labels]) => labels))];
const resolveOperand = selectExactLabelSetMap(operandProfiles);
const rangeMappings = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const;
const rangeLabels = rangeMappings.map(([label]) => label), rangeChoices = [[], ...rangeLabels.map(label => [label])];
const selectRange = selectExactLabelMap(rangeMappings.map(([label, upper]) => [label, createCanonicalNumericRange(upper)] as const));
export const originalDivisionRange: CanonicalNumericRange = {min: 0, max: Number.MAX_SAFE_INTEGER, maximumAbove: -1, minimumBelow: 5};
const resolveRangeGroup = withLabelChoices(exactResolver((labels: string[]) => {
    const group = resolveGroupCountProfile(labels), profile = resolveOperand(labels), range = selectRange(labels);
    return group && profile && range && (!hasSharedDivisionRange(profile, group) || !divisionRangeRows(profile, group, range).length)
        ? undefined : group;
}), {...resolveGroupCountProfile.labelChoices!, contextLabels: [...operandLabels, ...rangeLabels]});
const resolveDivisionRange = withLabelChoices(exactResolver((labels: string[]) => {
    const profile = resolveOperand(labels), group = resolveGroupCountProfile(labels), range = selectRange(labels);
    if (!profile || !group) return range ?? originalDivisionRange;
    if (!hasSharedDivisionRange(profile, group)) return range ? undefined : originalDivisionRange;
    return range && divisionRangeRows(profile, group, range).length ? range : undefined;
}), {kind: 'alternatives', alternatives: rangeChoices,
    contextLabels: [...operandLabels, Scope.NumbersWithZero, Scope.NumbersWithoutZero], resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'fraction-division-relations',
    generalLabels: [Area.Division, Scope.NumbersWithoutNegatives],
    compatibility: [generatorLabelRule('fraction-division-complete-group-profile',
        [Scope.FractionDividend, Scope.IntegerDivisor, Scope.ProperFractions, Scope.NumbersWithZero, Scope.NumbersWithoutZero], selected =>
            selected(Scope.NumbersWithZero) !== selected(Scope.NumbersWithoutZero)
            && !(selected(Scope.FractionDividend) && selected(Scope.IntegerDivisor)
                && selected(Scope.ProperFractions) && selected(Scope.NumbersWithoutZero))),
        generatorLabelRule('fraction-division-canonical-range', [...operandLabels, Scope.NumbersWithZero, Scope.NumbersWithoutZero, ...rangeLabels], selected => {
            const labels = operandLabels.filter(selected), profile = resolveOperand(labels);
            const group = selected(Scope.NumbersWithZero) ? 'zero' : 'positive';
            const upper = rangeMappings.find(([label]) => selected(label))?.[1];
            return !!profile && (hasSharedDivisionRange(profile, group)
                ? upper !== undefined && divisionRangeRows(profile, group, createCanonicalNumericRange(upper)).length > 0 : upper === undefined);
        })]
};

export const FractionDivisionRelationsGeneratorSchema = {
    operandProfile: [
        [Scope.FractionDividend, Scope.FractionDivisor, Scope.IntegerDividend, Scope.IntegerDivisor,
            Scope.ProperFractions, Scope.ImproperFractions],
        resolveOperand,
        operandProfiles.map(([labels]) => labels)
    ],
    // The required numerical model assesses the count of complete groups.
    // A latent zero remainder is not an additional assessed zero quantity.
    groupCountProfile: [[Scope.NumbersWithZero, Scope.NumbersWithoutZero], resolveRangeGroup,
        [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]],
    withEquation: [[Area.Equation], hasLabel(Area.Equation)],
    withMultiplication: [[Area.Multiplication], hasLabel(Area.Multiplication)],
    range: [rangeLabels, resolveDivisionRange, rangeChoices]
} as const;

export type FractionDivisionRelationsGeneratorConfig = ConfigFromSchema<typeof FractionDivisionRelationsGeneratorSchema>;
