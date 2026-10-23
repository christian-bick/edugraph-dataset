import {Area} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const solidFamilies = [
    [[Area.RectangularPrism], 'rectangular-prism'],
    [[Area.Prism, Area.Triangle], 'triangular-prism'],
    [[Area.Pyramid], 'pyramid']
] as const;
const mathematicalRelations = [
    [[], 'boundary-incidence'],
    [[Area.SurfaceAreaCalculation], 'surface-additivity']
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'polyhedral-nets',
    generalLabels: [Area.ShapeDecomposition]
};

export const PolyhedralNetsGeneratorSchema = {
    solidFamily: [[Area.RectangularPrism, Area.Prism, Area.Triangle, Area.Pyramid],
        selectExactLabelSetMap(solidFamilies), solidFamilies.map(([labels]) => labels)],
    mathematicalRelation: [[Area.SurfaceAreaCalculation], selectExactLabelSetMap(mathematicalRelations),
        mathematicalRelations.map(([labels]) => labels)]
} as const;

export type PolyhedralNetsGeneratorConfig = ConfigFromSchema<typeof PolyhedralNetsGeneratorSchema>;
