import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {matchAllExactLabels} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-position',
    generalLabels: [
        Area.SpatialModelling
    ]
};


export const ShapePositionGeneratorSchema = {
    relations: [
        [Scope.Above, Scope.Below, Scope.Beside, Scope.Behind, Scope.Ahead],
        matchAllExactLabels
    ]
} as const;

export type ShapePositionGeneratorConfig = ConfigFromSchema<typeof ShapePositionGeneratorSchema>;
