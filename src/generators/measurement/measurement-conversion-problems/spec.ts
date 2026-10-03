import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {MeasurementConversionGeneratorSchema} from '../measurement-conversion/spec.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-conversion-problems',
    generalLabels: [
        Area.Equation,
        Area.UnitScaleRelation,
        Area.Addition,
        Scope.MultiStep
    ]
};

export const MeasurementConversionProblemsGeneratorSchema = {
    unitPair: MeasurementConversionGeneratorSchema.unitPair,
    numberKind: [
        [Scope.IntegerNumbers, Scope.DecimalNumbers],
        selectExactLabelMap([
            [Scope.IntegerNumbers, 'integer'],
            [Scope.DecimalNumbers, 'decimal']
        ] as const)
    ]
} as const;

export type MeasurementConversionProblemsGeneratorConfig = ConfigFromSchema<
    typeof MeasurementConversionProblemsGeneratorSchema
>;
