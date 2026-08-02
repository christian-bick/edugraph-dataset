import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasLabel} from '../../../lib/resolvers.ts';

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


export const CountingIncDecGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        resolveRangeFromLabels
    ],
    isIncrement: [[Area.Increment], hasLabel(Area.Increment)],
    isDecrement: [[Area.Decrement], hasLabel(Area.Decrement)],
    countMode: [Scope.AdditiveCount, Scope.SubtractiveCount, Scope.DerivedCount]
} as const;

export type CountingIncDecGeneratorConfig = ConfigFromSchema<typeof CountingIncDecGeneratorSchema>;
