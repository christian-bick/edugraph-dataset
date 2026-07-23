import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-compose-shapes',
    generalLabels: [
        Area.ShapeComposition
    ]
};


export const ShapeComposeShapesGeneratorSchema = {
    classify: [
        [
            Area.Rectangle,
            Area.Square,
            Area.Triangle
        ],
        selectExactMatch
    ],
} as const;

export type ShapeComposeShapesGeneratorConfig = ConfigFromSchema<typeof ShapeComposeShapesGeneratorSchema>;
