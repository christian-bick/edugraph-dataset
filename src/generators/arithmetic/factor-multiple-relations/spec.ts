import {Area, Scope} from 'edugraph-ts';
import {selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'factor-multiple-relations',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100
    ]
};

export const FactorMultipleRelationsGeneratorSchema = {
    task: [
        [
            Area.FactorsAndMultiples,
            Area.PerfectDivisibility,
            Area.PrimeNumbers,
            Area.CompositeNumbers
        ],
        selectCanonicalLabel([
            [[Area.PerfectDivisibility], 'one-digit-multiple-test'],
            [[Area.PrimeNumbers], 'prime-classification'],
            [[Area.CompositeNumbers], 'composite-classification'],
            [[Area.FactorsAndMultiples], 'factor-pairs']
        ])
    ]
} as const;

export type FactorMultipleRelationsGeneratorConfig = ConfigFromSchema<
    typeof FactorMultipleRelationsGeneratorSchema
>;
