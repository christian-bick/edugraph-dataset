import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {selectExactMatch} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-compose-shapes',
    generalLabels: [
        Area.ShapeComposition,
        Ability.ConceptComposition
    ]
};


export const GeometryComposeShapesGeneratorSchema = {
    classify: [
        [
            Area.Rectangle,
            Area.Square
        ],
        selectExactMatch
    ],
} as const;

export type GeometryComposeShapesGeneratorConfig = ConfigFromSchema<typeof GeometryComposeShapesGeneratorSchema>;
