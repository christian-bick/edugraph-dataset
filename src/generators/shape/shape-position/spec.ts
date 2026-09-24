import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {matchAllExactLabels} from '../../../lib/resolvers.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-position',
    compatibility: [generatorLabelRule('spatial-relation', [
        Scope.Above, Scope.Below, Scope.Beside, Scope.Behind, Scope.Ahead
    ], selected => [Scope.Above, Scope.Below, Scope.Beside, Scope.Behind, Scope.Ahead].some(selected))],
    generalLabels: [
        Area.SpatialPosition
    ]
};


export const ShapePositionGeneratorSchema = {
    relations: [
        [Scope.Above, Scope.Below, Scope.Beside, Scope.Behind, Scope.Ahead],
        matchAllExactLabels
    ]
} as const;

export type ShapePositionGeneratorConfig = ConfigFromSchema<typeof ShapePositionGeneratorSchema>;
