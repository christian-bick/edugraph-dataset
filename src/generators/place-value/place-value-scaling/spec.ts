import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-scaling',
    generalLabels: [
        Area.PlaceValue,
        Area.ProportionalScaling,
        Area.Multiplication,
        Area.Division,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller1000000
    ]
};

export const PlaceValueScalingGeneratorSchema = {} as const;

export type PlaceValueScalingGeneratorConfig = ConfigFromSchema<
    typeof PlaceValueScalingGeneratorSchema
>;
