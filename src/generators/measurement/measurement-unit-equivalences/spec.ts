import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {measurementConversionUnitPairSchema} from '../conversion-schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-unit-equivalences',
    generalLabels: [
        Area.UnitScaleRelation,
        Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const MeasurementUnitEquivalencesGeneratorSchema = {
    unitPair: measurementConversionUnitPairSchema
} as const;

export type MeasurementUnitEquivalencesGeneratorConfig = ConfigFromSchema<
    typeof MeasurementUnitEquivalencesGeneratorSchema
>;
