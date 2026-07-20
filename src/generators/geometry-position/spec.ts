import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {matchAllLabels} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-position',
    supportedLabels: [
        Area.SpatialModelling
    ]
};


export const GeometryPositionGeneratorSchema = {
    // TODO: Ontological constraints relations could be beneficial here in the future instead of manual resolvers.
    relations: [
        [Scope.Above, Scope.Below, Scope.Beside, Scope.Behind],
        matchAllLabels([Scope.Above, Scope.Below, Scope.Beside, Scope.Behind])
    ]
} as const;

export type GeometryPositionGeneratorConfig = ConfigFromSchema<typeof GeometryPositionGeneratorSchema>;
