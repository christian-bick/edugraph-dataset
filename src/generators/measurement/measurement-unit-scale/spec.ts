import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-unit-scale',
    generalLabels: [Area.UnitScaleRelation, Scope.LengthMeasurement]
};

export const MeasurementUnitScaleGeneratorSchema = {} as const;
export type MeasurementUnitScaleGeneratorConfig = ConfigFromSchema<typeof MeasurementUnitScaleGeneratorSchema>;
