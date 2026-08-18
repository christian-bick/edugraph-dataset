import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {matchAllExactLabels} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-same-attribute',
    generalLabels: [
        Area.ObjectSorting
    ]
};


export const ShapeSameAttributeGeneratorSchema = {
    shapes: [
        [Area.Sphere, Area.Cube, Area.Rectangle],
        matchAllExactLabels
    ],
    property: [
        [Scope.Rollable, Scope.Stackable, Scope.Foldable],
        matchAllExactLabels
    ]
} as const;

export type ShapeSameAttributeGeneratorConfig = ConfigFromSchema<typeof ShapeSameAttributeGeneratorSchema>;
