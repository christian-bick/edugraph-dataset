import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectCanonicalLabel} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-inc-dec',
    generalLabels: [
        Area.NumerationWithIntegers,
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

const resolveDirection = selectCanonicalLabel([
    [[Scope.SubtractiveCount, Area.Decrement, Scope.Before], Scope.SubtractiveCount],
    [[Scope.AdditiveCount, Area.Increment, Scope.After], Scope.AdditiveCount]
] as const);

export const CountingIncDecGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        resolveRangeFromLabels
    ],
    direction: [countingDirections, resolveDirection],
    stepMagnitude: [Scope.StepsOf1, Scope.StepsOf10]
} as const;

export type CountingIncDecGeneratorConfig = ConfigFromSchema<typeof CountingIncDecGeneratorSchema>;
