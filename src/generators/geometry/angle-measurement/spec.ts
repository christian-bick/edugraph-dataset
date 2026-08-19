import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'angle-measurement',
    generalLabels: [Area.AngleConcept, Scope.DegreeScale]
};

export const AngleMeasurementGeneratorSchema = {
    useProtractorMeasurement: [[Area.AngleCalculation], hasLabel(Area.AngleCalculation)]
} as const;

export type AngleMeasurementGeneratorConfig = ConfigFromSchema<
    typeof AngleMeasurementGeneratorSchema
>;
