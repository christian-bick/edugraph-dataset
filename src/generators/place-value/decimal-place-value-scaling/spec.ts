import {Area, Scope} from 'edugraph-ts';
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
        Scope.DecimalNumbers
    ]
};

export const DecimalPlaceValueScalingGeneratorSchema = {} as const;

export type DecimalPlaceValueScalingGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceValueScalingGeneratorSchema
>;
