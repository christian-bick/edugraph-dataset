import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-place-value-scaling',
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
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        selectExactLabelMap([[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const)
    ]
} as const;

export type DecimalPlaceValueScalingGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceValueScalingGeneratorSchema
>;
