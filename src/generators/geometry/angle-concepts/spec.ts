import {Ability, Area, Scope} from 'edugraph-ts';
import {matchAllExactLabels, selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const taskFeatureLabels = [
    Area.RayConcept,
    Area.Circle,
    Area.FractionInterpretation,
    Area.AngleCalculation,
    Scope.DegreeScale,
    Scope.UnitFractions,
    Ability.Interpretation
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'angle-concepts',
    generalLabels: [Area.AngleConcept, Scope.AngleMeasurement]
};

export const AngleConceptsGeneratorSchema = {
    task: [
        [Area.ArchConcept, Ability.ConceptDerivation, Area.Iteration],
        selectCanonicalLabel([
            [[Area.ArchConcept], 'recognize-angle-from-arc'],
            [[Ability.ConceptDerivation], 'derive-one-degree'],
            [[Area.Iteration], 'interpret-degree-iteration']
        ])
    ],
    taskFeatures: [taskFeatureLabels, matchAllExactLabels]
} as const;

export type AngleConceptsGeneratorConfig = ConfigFromSchema<
    typeof AngleConceptsGeneratorSchema
>;
