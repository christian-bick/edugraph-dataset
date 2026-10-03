import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorCompatibilityRule} from '../../../types/compatibility.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const relationProfiles = [
    [[Scope.FractionNumbers], 'fraction-as-quotient'],
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

const exactProfile = selectExactLabelSetMap(relationProfiles);

// Fallback probes may combine a requested FractionNumbers label with a
// UnitFractions alternative that specializes it. Those two choices describe
// different original operands, so the blended selection is not a profile.
const resolveRelationProfile = withLabelChoices(exactResolver((labels: string[],
    supportedLabels?: readonly string[]) => {
    if (labels.includes(Scope.FractionNumbers) && labels.includes(Scope.UnitFractions)) return undefined;
    return exactProfile(labels, supportedLabels);
}), {kind: 'alternatives', alternatives: relationProfiles.map(([labels]) => [...labels])});

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
        Scope.UnitFractions,
        Scope.NumbersWithoutNegatives
    ], resolveRelationProfile, relationProfiles.map(([labels]) => labels)]
} as const;

export type FractionQuotientModelGeneratorConfig = ConfigFromSchema<
    typeof FractionQuotientModelGeneratorSchema
>;
