import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'angle-unit-iteration',
    generalLabels: [Area.AngleConcept, Area.AngleCalculation, Area.Iteration, Scope.DegreeScale]
};
export const AngleUnitIterationGeneratorSchema = {} as const;
export type AngleUnitIterationGeneratorConfig = ConfigFromSchema<typeof AngleUnitIterationGeneratorSchema>;
