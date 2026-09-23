import {Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {generatorId: 'shape-attribute-count', generalLabels: []};
const resolveAttribute = selectExactLabelSetMap([
    [[Scope.VertexCount], 'vertices'],
    [[Scope.AngleCount], 'angles'],
    [[Scope.FaceCount, Scope.Equal], 'equal-faces']
] as const);
export const ShapeAttributeCountGeneratorSchema = {
    attribute: [
        [Scope.VertexCount, Scope.AngleCount, Scope.FaceCount, Scope.Equal],
        resolveAttribute,
        [[Scope.VertexCount], [Scope.AngleCount], [Scope.FaceCount, Scope.Equal]]
    ]
} as const;
export type ShapeAttributeCountGeneratorConfig = ConfigFromSchema<typeof ShapeAttributeCountGeneratorSchema>;
