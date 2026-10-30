import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {resolveGroupCountProfile} from './group-count-profile.ts';

const operandProfiles = [
    [[Scope.FractionDividend, Scope.FractionDivisor, Scope.ProperFractions], 'fraction-by-fraction-proper'],
    [[Scope.FractionDividend, Scope.FractionDivisor, Scope.ImproperFractions], 'fraction-by-fraction-improper'],
    [[Scope.FractionDividend, Scope.IntegerDivisor, Scope.ProperFractions], 'fraction-by-integer-proper'],
    [[Scope.FractionDividend, Scope.IntegerDivisor, Scope.ImproperFractions], 'fraction-by-integer-improper'],
    [[Scope.IntegerDividend, Scope.FractionDivisor, Scope.ProperFractions], 'integer-by-fraction-proper'],
    [[Scope.IntegerDividend, Scope.FractionDivisor, Scope.ImproperFractions], 'integer-by-fraction-improper']
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'fraction-division-relations',
    generalLabels: [Area.Division, Scope.NumbersWithoutNegatives],
    compatibility: [generatorLabelRule('fraction-division-complete-group-profile',
        [Scope.FractionDividend, Scope.IntegerDivisor, Scope.ProperFractions, Scope.NumbersWithZero, Scope.NumbersWithoutZero], selected =>
            selected(Scope.NumbersWithZero) !== selected(Scope.NumbersWithoutZero)
            && !(selected(Scope.FractionDividend) && selected(Scope.IntegerDivisor)
                && selected(Scope.ProperFractions) && selected(Scope.NumbersWithoutZero)))]
};

export const FractionDivisionRelationsGeneratorSchema = {
    operandProfile: [
        [Scope.FractionDividend, Scope.FractionDivisor, Scope.IntegerDividend, Scope.IntegerDivisor,
            Scope.ProperFractions, Scope.ImproperFractions],
        selectExactLabelSetMap(operandProfiles),
        operandProfiles.map(([labels]) => labels)
    ],
    // The required numerical model assesses the count of complete groups.
    // A latent zero remainder is not an additional assessed zero quantity.
    groupCountProfile: [[Scope.NumbersWithZero, Scope.NumbersWithoutZero], resolveGroupCountProfile,
        [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]],
    withEquation: [[Area.Equation], hasLabel(Area.Equation)],
    withMultiplication: [[Area.Multiplication], hasLabel(Area.Multiplication)]
} as const;

export type FractionDivisionRelationsGeneratorConfig = ConfigFromSchema<typeof FractionDivisionRelationsGeneratorSchema>;
