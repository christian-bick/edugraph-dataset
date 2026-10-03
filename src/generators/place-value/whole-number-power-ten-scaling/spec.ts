import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'whole-number-power-ten-scaling',
    generalLabels: [
        Area.PatternRecognition,
        Area.PlaceValue,
        Area.Multiplication,
        Area.Exponentiation,
        Scope.PowersOf10,
        Scope.IntegerExponent,
        Scope.NumbersWithoutNegatives,
        Scope.Base10,
        Scope.IntegerNumbers
    ]
};

export const WholeNumberPowerTenScalingGeneratorSchema = {} as const;

export type WholeNumberPowerTenScalingGeneratorConfig = ConfigFromSchema<
    typeof WholeNumberPowerTenScalingGeneratorSchema
>;
