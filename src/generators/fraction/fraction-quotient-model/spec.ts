import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorCompatibilityRule} from '../../../types/compatibility.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const relationProfiles = [
    [[Scope.FractionNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero], 'fraction-as-quotient'],
    [[Area.Equation, Scope.IntegerDividend, Scope.IntegerDivisor,
        Scope.FractionQuotient, Scope.NumbersWithoutNegatives], 'whole-sharing-equation'],
    [[Scope.FractionDividend, Scope.IntegerDivisor,
        Scope.UnitFractions, Scope.NumbersWithoutNegatives], 'unit-dividend-basic'],
    [[Area.Multiplication, Scope.FractionDividend, Scope.IntegerDivisor,
        Scope.UnitFractions, Scope.NumbersWithoutNegatives], 'unit-dividend-inverse'],
    [[Area.Equation, Scope.FractionDividend, Scope.IntegerDivisor,
        Scope.UnitFractions, Scope.NumbersWithoutNegatives], 'unit-dividend-equation'],
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
    labels.some(label => label === Scope.FractionDividend)
        ? [...labels, Scope.NumbersWithoutZero]
        : value === 'whole-sharing-equation'
            ? [...labels, Scope.IntegerNumbers, Scope.TwoOperands, Scope.SingleDigitLargestOperand] : labels,
    value
] as const);
const exactProfile = selectExactLabelSetMap([
    ...canonicalProfiles,
    ...relationProfiles.filter(([labels, value]) => labels.some(label => label === Scope.FractionDividend)
        || value === 'whole-sharing-equation'),
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

export const spec: GeneratorSpec = {
    generatorId: 'fraction-quotient-model',
    generalLabels: [Area.Division],
    compatibility: [fractionNotationRole]
};

export const FractionQuotientModelGeneratorSchema = {
    relationProfile: [[
        Area.Equation,
        Area.Multiplication,
        Scope.FractionNumbers,
        Scope.IntegerDividend,
        Scope.IntegerDivisor,
        Scope.FractionDividend,
        Scope.FractionDivisor,
        Scope.FractionQuotient,
        Scope.IntegerNumbers,
        Scope.TwoOperands,
        Scope.SingleDigitLargestOperand,
        Scope.UnitFractions,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ], resolveRelationProfile, canonicalProfiles.map(([labels]) => labels)]
} as const;

export type FractionQuotientModelGeneratorConfig = ConfigFromSchema<
    typeof FractionQuotientModelGeneratorSchema
>;
