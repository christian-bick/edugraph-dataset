import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
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

const taskLabelSets = [
    [Area.FactorsAndMultiples, Area.PerfectDivisibility],
    [Area.PrimeNumbers],
    [Area.CompositeNumbers],
    [Area.FactorsAndMultiples]
] as const;

export const FactorMultipleRelationsGeneratorSchema = {
    task: [
        [
            Area.FactorsAndMultiples,
            Area.PerfectDivisibility,
            Area.PrimeNumbers,
            Area.CompositeNumbers
        ],
        selectExactLabelSetMap([
            [taskLabelSets[0], 'one-digit-multiple-test'],
            [taskLabelSets[1], 'prime-classification'],
            [taskLabelSets[2], 'composite-classification'],
            [taskLabelSets[3], 'factor-pairs']
        ]),
        taskLabelSets
    ]
} as const;

export type FactorMultipleRelationsGeneratorConfig = ConfigFromSchema<
    typeof FactorMultipleRelationsGeneratorSchema
>;
