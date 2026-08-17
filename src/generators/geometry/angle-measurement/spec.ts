import {Ability, Area, Scope} from 'edugraph-ts';
import {selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'angle-measurement',
    generalLabels: [Area.AngleConcept, Scope.DegreeScale]
};

export const AngleMeasurementGeneratorSchema = {
    task: [
        [Area.AngleCalculation, Ability.ConceptSpecification],
        selectCanonicalLabel([
            [[Area.AngleCalculation], 'measure-angle'],
            [[Ability.ConceptSpecification], 'sketch-angle']
        ])
    ]
} as const;

export type AngleMeasurementGeneratorConfig = ConfigFromSchema<
    typeof AngleMeasurementGeneratorSchema
>;
