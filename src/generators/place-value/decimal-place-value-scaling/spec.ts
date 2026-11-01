import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {scalingRangeLabels, scalingZeroLabels, resolveScalingRange, resolveScalingZero} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-place-value-scaling',
    compatibility: [generatorLabelRule('adjacent-place-decimal-range', [...scalingRangeLabels, ...scalingZeroLabels], selected =>
        !selected(Scope.NumbersWithoutZero) || selected(Scope.NumbersSmaller120) || selected(Scope.NumbersSmaller1000))],
    generalLabels: [
        Area.PlaceValue,
        Area.ProportionalScaling,
        Area.Multiplication,
        Area.Division,
        Scope.Base10,
        Scope.DecimalNumbers,
        Scope.NumbersWithoutNegatives
    ]
};

export const DecimalPlaceValueScalingGeneratorSchema = {
    requireZeroCoefficient: [
        scalingZeroLabels, resolveScalingZero, scalingZeroLabels.map(label => [label])
    ],
    range: [scalingRangeLabels, resolveScalingRange, scalingRangeLabels.map(label => [label])]
} as const;

export type DecimalPlaceValueScalingGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceValueScalingGeneratorSchema
>;
