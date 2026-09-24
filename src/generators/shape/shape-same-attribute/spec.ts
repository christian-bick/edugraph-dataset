import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {matchAllExactLabels} from '../../../lib/resolvers.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-same-attribute',
    compatibility: [generatorLabelRule('shape-property-correspondence', [
        Area.Sphere, Area.Cube, Area.Rectangle, Scope.Rollable, Scope.Stackable, Scope.Foldable
    ], selected => {
        const shapeProperties = [
            [Area.Sphere, Scope.Rollable], [Area.Cube, Scope.Stackable], [Area.Rectangle, Scope.Foldable]
        ] as const;
        return shapeProperties.some(([shape]) => selected(shape))
            && shapeProperties.every(([shape, property]) => !selected(shape) || selected(property));
    })],
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
