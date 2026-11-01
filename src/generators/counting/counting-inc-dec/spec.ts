import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';

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
        [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100,
            Scope.NumbersSmaller120, Scope.NumbersSmaller1000],
        selectExactLabelMap([
            [Scope.NumbersSmaller5, createCanonicalNumericRange(5)], [Scope.NumbersSmaller10, createCanonicalNumericRange(10)],
            [Scope.NumbersSmaller20, createCanonicalNumericRange(20)], [Scope.NumbersSmaller100, createCanonicalNumericRange(100)],
            [Scope.NumbersSmaller120, createCanonicalNumericRange(120)], [Scope.NumbersSmaller1000, createCanonicalNumericRange(1000)]
        ] as const)
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
