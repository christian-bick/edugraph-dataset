import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'factor-multiple-relations',
    generalLabels: [
        Area.FactorsAndMultiples,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100
    ]
};

export const FactorMultipleRelationsGeneratorSchema = {
    task: [[Area.PerfectDivisibility], selectExactLabelSetMap([
        [[Area.PerfectDivisibility], 'one-digit-multiple-test'],
        [[], 'factor-pairs']
    ]), [[], [Area.PerfectDivisibility]]]
} as const;

export type FactorMultipleRelationsGeneratorConfig = ConfigFromSchema<typeof FactorMultipleRelationsGeneratorSchema>;
