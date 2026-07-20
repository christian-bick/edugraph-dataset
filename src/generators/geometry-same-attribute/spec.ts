import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {matchAllExactLabels} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-same-attribute',
    generalLabels: [
        Area.ObjectSorting,
        Scope.Foldable,
        Scope.Rollable,
        Scope.Stackable
    ]
};


export const GeometrySameAttributeGeneratorSchema = {
    shapes: [
        [Area.Sphere, Area.Cube, Area.Rectangle],
        matchAllExactLabels
    ]
} as const;

export type GeometrySameAttributeGeneratorConfig = ConfigFromSchema<typeof GeometrySameAttributeGeneratorSchema>;
