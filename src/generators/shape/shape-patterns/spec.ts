import {Ability, Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-patterns',
    generalLabels: [
        Scope.VisualGeometry
    ]
};

export const ShapePatternsGeneratorSchema = {
    generatesPattern: [
        [Area.PatternGeneration],
        hasLabel(Area.PatternGeneration)
    ],
    recognizesEmergentFeature: [
        [Area.EmergentFeatureRecognition],
        hasLabel(Area.EmergentFeatureRecognition)
    ],
    articulateVisually: [
        [Ability.VisualArticulation],
        hasLabel(Ability.VisualArticulation)
    ],
    classifyFeature: [
        [Ability.ConceptClassification],
        hasLabel(Ability.ConceptClassification)
    ],
    understandProcedure: [
        [Ability.ProcedureUnderstanding],
        hasLabel(Ability.ProcedureUnderstanding)
    ],
    articulateTextually: [
        [Ability.TextualArticulation],
        hasLabel(Ability.TextualArticulation)
    ]
} as const;

export type ShapePatternsGeneratorConfig = ConfigFromSchema<typeof ShapePatternsGeneratorSchema>;
