import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-inc-dec',
    generalLabels: [
        Area.NumerationWithIntegers,
        Scope.StepsOf1,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives
    ]
};

const countingDirections = [
    Scope.SubtractiveCount,
    Scope.AdditiveCount,
    Area.Decrement,
    Area.Increment,
    Scope.Before,
    Scope.After
] as const;

const resolveDirection = selectExactLabelSetMap([
    [[Scope.SubtractiveCount], 'dec'],
    [[Area.Decrement, Scope.Before], 'dec'],
    [[Scope.SubtractiveCount, Area.Decrement, Scope.Before], 'dec'],
    [[Scope.AdditiveCount], 'inc'],
    [[Area.Increment, Scope.After], 'inc'],
    [[Scope.AdditiveCount, Area.Increment, Scope.After], 'inc']
] as const);

export const CountingIncDecGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ],
    direction: [
        countingDirections,
        resolveDirection,
        [
            [Scope.SubtractiveCount],
            [Area.Decrement, Scope.Before],
            [Scope.AdditiveCount],
            [Area.Increment, Scope.After]
        ]
    ]
} as const;

export type CountingIncDecGeneratorConfig = ConfigFromSchema<typeof CountingIncDecGeneratorSchema>;
