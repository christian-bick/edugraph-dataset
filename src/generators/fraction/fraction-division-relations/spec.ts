import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

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
    generalLabels: [Area.Division, Scope.NumbersWithoutNegatives]
};

export const FractionDivisionRelationsGeneratorSchema = {
    operandProfile: [
        [Scope.FractionDividend, Scope.FractionDivisor, Scope.IntegerDividend, Scope.IntegerDivisor,
            Scope.ProperFractions, Scope.ImproperFractions],
        selectExactLabelSetMap(operandProfiles),
        operandProfiles.map(([labels]) => labels)
    ],
    withEquation: [[Area.Equation], hasLabel(Area.Equation)],
    withMultiplication: [[Area.Multiplication], hasLabel(Area.Multiplication)]
} as const;

export type FractionDivisionRelationsGeneratorConfig = ConfigFromSchema<typeof FractionDivisionRelationsGeneratorSchema>;
