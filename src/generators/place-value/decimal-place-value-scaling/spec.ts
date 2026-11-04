import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {scalingRangeLabels, resolveScalingRange} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-place-value-scaling',
    generalLabels: [
        Area.PlaceValue,
        Area.ProportionalScaling,
        Area.Multiplication,
        Area.Division,
        Scope.Base10,
        Scope.DecimalNumbers,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const DecimalPlaceValueScalingGeneratorSchema = {
    range: [scalingRangeLabels, resolveScalingRange, scalingRangeLabels.map(label => [label])]
} as const;

export type DecimalPlaceValueScalingGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceValueScalingGeneratorSchema
>;
