import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-power-ten-scaling',
    generalLabels: [
        Area.PatternRecognition,
        Area.PlaceValue,
        Area.ProportionalScaling,
        Area.Exponentiation,
        Scope.PowersOf10,
        Scope.IntegerExponent,
        Scope.NumbersWithoutNegatives,
        Scope.Base10,
        Scope.DecimalNumbers
    ]
};

export const DecimalPowerTenScalingGeneratorSchema = {
    operation: [
        [Area.Multiplication, Area.Division],
        selectExactLabelMap([
            [Area.Multiplication, 'multiplication'],
            [Area.Division, 'division']
        ])
    ]
} as const;

export type DecimalPowerTenScalingGeneratorConfig = ConfigFromSchema<
    typeof DecimalPowerTenScalingGeneratorSchema
>;
