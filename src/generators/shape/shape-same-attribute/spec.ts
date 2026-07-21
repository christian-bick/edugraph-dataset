import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {matchAllExactLabels} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-same-attribute',
    generalLabels: [
        Area.ObjectSorting,
        Scope.Foldable,
        Scope.Rollable,
        Scope.Stackable
    ]
};


export const ShapeSameAttributeGeneratorSchema = {
    shapes: [
        [Area.Sphere, Area.Cube, Area.Rectangle],
        matchAllExactLabels
    ]
} as const;

export type ShapeSameAttributeGeneratorConfig = ConfigFromSchema<typeof ShapeSameAttributeGeneratorSchema>;
