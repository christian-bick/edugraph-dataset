import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';

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
    Area.Increment
] as const;

function resolveDirection(labels: string[]): Scope.SubtractiveCount | Scope.AdditiveCount | undefined {
    if (labels.includes(Scope.SubtractiveCount) || labels.includes(Area.Decrement)) {
        return Scope.SubtractiveCount;
    }
    if (labels.includes(Scope.AdditiveCount) || labels.includes(Area.Increment)) {
        return Scope.AdditiveCount;
    }
    return undefined;
}


export const CountingIncDecGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller20]),
        resolveRangeFromLabels
    ],
    direction: [countingDirections, resolveDirection]
} as const;

export type CountingIncDecGeneratorConfig = ConfigFromSchema<typeof CountingIncDecGeneratorSchema>;
