import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorCompatibilityRule} from '../../../types/compatibility.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {numericProfileLabels, numericProfiles, resolveNumericProfile} from './numeric-profiles.ts';
import {quotientRangeChoices, quotientRangeLabels, quotientRangeMappings, quotientRangeRole,
    quotientUpperBounds, resolveQuotientRange} from './range-profile.ts';

const relationProfiles = [
    [[Scope.FractionNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero], 'fraction-as-quotient'],
    [[Area.Equation, Scope.IntegerDividend, Scope.IntegerDivisor,
        Scope.FractionQuotient, Scope.NumbersWithoutNegatives], 'whole-sharing-equation'],
    [[Scope.IntegerDividend, Scope.FractionDivisor,
        Scope.UnitFractions, Scope.NumbersWithoutNegatives], 'unit-divisor-basic'],
    [[Area.Multiplication, Scope.IntegerDividend, Scope.FractionDivisor,
        Scope.UnitFractions, Scope.NumbersWithoutNegatives], 'unit-divisor-inverse'],
    [[Area.Equation, Scope.IntegerDividend, Scope.FractionDivisor,
        Scope.UnitFractions, Scope.NumbersWithoutNegatives], 'unit-divisor-equation']
] as const;

// Canonical choices describe the original operands as well as the relation.
// Integer presence does not classify the necessarily required quotient as integral.
// Keep the original bundles as same-value aliases so unchanged requests remain exact.
const canonicalProfiles = relationProfiles.map(([labels, value]) => [
    value === 'whole-sharing-equation'
            ? [...labels, Scope.IntegerNumbers, Scope.TwoOperands, Scope.SingleDigitLargestOperand] : labels,
    value
] as const);
// The numeric field can request absence independently. Preserve role aliases
// when that shared absence label is explicitly present in the direct request.
const zeroAbsenceAliases = [...new Map([...canonicalProfiles, ...relationProfiles]
    .filter(([, value]) => value === 'whole-sharing-equation' || value.startsWith('unit-divisor-'))
    .map(([labels, value]) => [[...labels, Scope.NumbersWithoutZero], value] as const)
    .map(entry => [JSON.stringify([...entry[0]].sort()), entry])).values()];
const exactProfile = selectExactLabelSetMap([
    ...canonicalProfiles,
    ...relationProfiles.filter(([, value]) => value === 'whole-sharing-equation'),
    ...zeroAbsenceAliases,
    // These broad requests already select fraction-as-quotient; preserve that choice.
    [[Scope.NumbersWithoutZero], 'fraction-as-quotient'],
    [[Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero], 'fraction-as-quotient']
] as const);

// Fallback probes may combine a requested FractionNumbers label with a
// UnitFractions alternative that specializes it. Those two choices describe
// different original operands, so the blended selection is not a profile.
const resolveRelationProfile = withLabelChoices(exactResolver((labels: string[],
    supportedLabels?: readonly string[]) => {
    if (labels.includes(Scope.FractionNumbers) && labels.includes(Scope.UnitFractions)) return undefined;
    return exactProfile(labels, supportedLabels);
}), exactProfile.labelChoices!);

const fractionNotationRole: GeneratorCompatibilityRule = {
    id: 'fraction-notation-original-wholes',
    dependencies: [
        {scope: 'target', label: Scope.FractionNumbers},
        {scope: 'target', label: Scope.UnitFractions},
        {scope: 'generator', label: Scope.UnitFractions}
    ],
    predicate: labels => !(
        labels.exact('target', Scope.FractionNumbers)
        && !labels.exact('target', Scope.UnitFractions)
        && labels.exact('generator', Scope.UnitFractions)
    )
};
const resolveRangeNumericProfile = withLabelChoices(exactResolver((labels: string[]) => {
    const profile = resolveNumericProfile(labels);
    return profile === 'zero' && quotientRangeRole(labels) === 'unit-divisor'
        && quotientRangeMappings.some(([label, upper]) => upper > 5 && labels.includes(label)) ? undefined : profile;
}), {...resolveNumericProfile.labelChoices!, contextLabels: [...resolveNumericProfile.labelChoices!.contextLabels!, ...quotientRangeLabels]});

export const spec: GeneratorSpec = {
    generatorId: 'fraction-quotient-model',
    generalLabels: [Area.Division],
    compatibility: [fractionNotationRole, generatorLabelRule('fraction-quotient-numeric-profile',
        [Scope.FractionNumbers, Scope.FractionDividend, Scope.IntegerDividend, ...numericProfileLabels], selected => {
            const proper = selected(Scope.ProperFractions), improper = selected(Scope.ImproperFractions);
            const withoutZero = selected(Scope.NumbersWithoutZero), withZero = selected(Scope.NumbersWithZero);
            if (withoutZero === withZero) return false;
            if (selected(Scope.FractionNumbers)) return proper !== improper && withoutZero;
            if (proper || improper) return false;
            return !selected(Scope.FractionDividend) || withoutZero;
        }), generatorLabelRule('fraction-quotient-range-profile', [Scope.FractionNumbers, Scope.FractionDividend,
        Scope.IntegerDividend, Scope.IntegerDivisor, Scope.FractionDivisor, ...numericProfileLabels, ...quotientRangeLabels], selected => {
            const role = quotientRangeRole([Scope.FractionNumbers, Scope.FractionDividend, Scope.IntegerDividend,
                Scope.IntegerDivisor, Scope.FractionDivisor].filter(selected));
            const upper = quotientRangeMappings.find(([label]) => selected(label))?.[1];
            return !!role && upper !== undefined && quotientUpperBounds(role, selected(Scope.NumbersWithZero)).includes(upper);
        })]
};

export const FractionQuotientModelGeneratorSchema = {
    relationProfile: [[
        Area.Equation,
        Area.Multiplication,
        Scope.FractionNumbers,
        Scope.IntegerDividend,
        Scope.IntegerDivisor,
        Scope.FractionDivisor,
        Scope.FractionQuotient,
        Scope.IntegerNumbers,
        Scope.TwoOperands,
        Scope.SingleDigitLargestOperand,
        Scope.UnitFractions,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ], resolveRelationProfile, canonicalProfiles.map(([labels]) => labels)],
    numericProfile: [numericProfileLabels, resolveRangeNumericProfile, numericProfiles.map(([labels]) => labels)],
    range: [quotientRangeLabels, resolveQuotientRange, quotientRangeChoices]
} as const;

export type FractionQuotientModelGeneratorConfig = ConfigFromSchema<
    typeof FractionQuotientModelGeneratorSchema
>;
