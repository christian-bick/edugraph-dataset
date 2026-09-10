import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'angle-unit-partition',
    generalLabels: [Area.AngleConcept, Area.Circle, Scope.DegreeScale, Scope.UnitFractions]
};
export const AngleUnitPartitionGeneratorSchema = {} as const;
export type AngleUnitPartitionGeneratorConfig = ConfigFromSchema<typeof AngleUnitPartitionGeneratorSchema>;
