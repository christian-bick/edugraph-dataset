import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {resolveGroupCountProfile} from './group-count-profile.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {divisionRangeRows} from './numeric-domain.ts';
import {divisionOperandDistribution} from './operand-profiles.ts';

const operandProfiles = [
    [[Scope.FractionDividend, Scope.FractionDivisor, Scope.ProperFractions], 'fraction-by-fraction-proper'],
    [[Scope.FractionDividend, Scope.FractionDivisor, Scope.ImproperFractions], 'fraction-by-fraction-improper'],
    [[Scope.FractionDividend, Scope.IntegerDivisor, Scope.ProperFractions], 'fraction-by-integer-proper'],
    [[Scope.FractionDividend, Scope.IntegerDivisor, Scope.ImproperFractions], 'fraction-by-integer-improper'],
    [[Scope.IntegerDividend, Scope.FractionDivisor, Scope.ProperFractions], 'integer-by-fraction-proper'],
    [[Scope.IntegerDividend, Scope.FractionDivisor, Scope.ImproperFractions], 'integer-by-fraction-improper']
] as const;
const operandLabels = [...new Set(operandProfiles.flatMap(([labels]) => labels))];
const operandChoice = selectExactLabelSetMap(operandProfiles);
const rangeMappings = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const;
const rangeLabels = rangeMappings.map(([label]) => label), rangeChoices = rangeLabels.map(label => [label]);
const selectRange = selectExactLabelMap(rangeMappings.map(([label, upper]) => [label, createCanonicalNumericRange(upper)] as const));
const zeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero];
const resolveOperand = withLabelChoices(exactResolver((labels: string[]) => {
    const profile = operandChoice(labels), range = selectRange(labels);
    if (!profile || zeroLabels.every(label => labels.includes(label))) return undefined;
    const groups = labels.includes(Scope.NumbersWithZero) ? ['zero'] as const
        : labels.includes(Scope.NumbersWithoutZero) ? ['positive'] as const : ['zero', 'positive'] as const;
    return groups.some(group => range ? divisionRangeRows(profile, group, range).length > 0
        : divisionOperandDistribution(profile, group).length > 0) ? profile : undefined;
}), {...operandChoice.labelChoices!, contextLabels: [...rangeLabels, ...zeroLabels]});
const resolveRangeGroup = withLabelChoices(exactResolver((labels: string[]) => {
    const group = resolveGroupCountProfile(labels), profile = operandChoice(labels), range = selectRange(labels);
    return group && profile && range && !divisionRangeRows(profile, group, range).length
        ? undefined : group;
}), {...resolveGroupCountProfile.labelChoices!, contextLabels: [...operandLabels, ...rangeLabels]});
const resolveDivisionRange = withLabelChoices(exactResolver((labels: string[]) => {
    const profile = operandChoice(labels), group = resolveGroupCountProfile(labels), range = selectRange(labels);
    if (!profile || !group) return range;
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
            const labels = operandLabels.filter(selected), profile = operandChoice(labels);
            const group = selected(Scope.NumbersWithZero) ? 'zero' : 'positive';
            const upper = rangeMappings.find(([label]) => selected(label))?.[1];
            return !!profile && upper !== undefined && divisionRangeRows(profile, group, createCanonicalNumericRange(upper)).length > 0;
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
