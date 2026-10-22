import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'common-factor-multiple-relations',
    generalLabels: [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives]
};

export const CommonFactorMultipleRelationsGeneratorSchema = {
    operation: [[Area.GreatestCommonDivisor, Area.LeastCommonMultiple], selectExactLabelMap([
        [Area.GreatestCommonDivisor, 'gcd'],
        [Area.LeastCommonMultiple, 'lcm']
    ] as const)]
} as const;

export type CommonFactorMultipleRelationsGeneratorConfig = ConfigFromSchema<typeof CommonFactorMultipleRelationsGeneratorSchema>;
