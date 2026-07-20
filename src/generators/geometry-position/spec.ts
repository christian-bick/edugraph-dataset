import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {matchAllLabels} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-position',
    generalLabels: [
        Area.SpatialModelling
    ]
};


export const GeometryPositionGeneratorSchema = {
    relations: [
        [Scope.Above, Scope.Below, Scope.Beside, Scope.Behind],
        matchAllLabels
    ]
} as const;

export type GeometryPositionGeneratorConfig = ConfigFromSchema<typeof GeometryPositionGeneratorSchema>;
