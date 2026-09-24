import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-patterns',
    compatibility: [generatorLabelRule('shape-pattern-task', [
        Area.PatternGeneration, Area.EmergentFeatureRecognition
    ], selected => selected(Area.PatternGeneration) || selected(Area.EmergentFeatureRecognition))],
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
    ]
} as const;

export type ShapePatternsGeneratorConfig = ConfigFromSchema<typeof ShapePatternsGeneratorSchema>;
