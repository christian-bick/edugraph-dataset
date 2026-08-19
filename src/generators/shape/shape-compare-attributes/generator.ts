import {Area} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ShapeCompareAttributesProblem,
    ShapeComparisonAttribute,
    ShapeComparisonName
} from '../../../types/problems.ts';
import {ShapeCompareAttributesGeneratorConfig, ShapeCompareAttributesGeneratorSchema} from './spec.ts';

type ShapeDefinition = {
    dimension: ShapeCompareAttributesProblem['dimension'];
    counts: Partial<Record<ShapeComparisonAttribute, number>>;
};

const SHAPES_BY_LABEL: Readonly<Record<string, ShapeComparisonName>> = {
    [Area.Triangle]: 'triangle',
    [Area.Square]: 'square',
    [Area.Rectangle]: 'rectangle',
    [Area.Hexagon]: 'hexagon',
    [Area.Circle]: 'circle',
    [Area.Cube]: 'cube',
    [Area.Cone]: 'cone',
    [Area.Cylinder]: 'cylinder',
    [Area.Sphere]: 'sphere'
};

const LABELS_BY_SHAPE = Object.fromEntries(
    Object.entries(SHAPES_BY_LABEL).map(([label, shape]) => [shape, label])
) as Readonly<Record<ShapeComparisonName, string>>;

const DEFINITIONS: Readonly<Record<ShapeComparisonName, ShapeDefinition>> = {
    triangle: {dimension: '2d', counts: {sides: 3, vertices: 3}},
    square: {dimension: '2d', counts: {sides: 4, vertices: 4}},
    rectangle: {dimension: '2d', counts: {sides: 4, vertices: 4}},
    hexagon: {dimension: '2d', counts: {sides: 6, vertices: 6}},
    circle: {dimension: '2d', counts: {sides: 0, vertices: 0}},
    cube: {dimension: '3d', counts: {faces: 6, vertices: 8, edges: 12}},
    cone: {dimension: '3d', counts: {faces: 1, vertices: 1, edges: 1}},
    cylinder: {dimension: '3d', counts: {faces: 2, vertices: 0, edges: 2}},
    sphere: {dimension: '3d', counts: {faces: 0, vertices: 0, edges: 0}}
};

const ATTRIBUTES_BY_DIMENSION = {
    '2d': ['sides', 'vertices'],
    '3d': ['faces', 'vertices', 'edges']
} as const satisfies Readonly<Record<ShapeCompareAttributesProblem['dimension'], readonly ShapeComparisonAttribute[]>>;

function titleCase(shape: ShapeComparisonName): string {
    return shape.charAt(0).toUpperCase() + shape.slice(1);
}

function attributeText(attribute: ShapeComparisonAttribute, count?: number): string {
    if (attribute === 'faces') return count === 1 ? 'flat face' : 'flat faces';
    if (attribute === 'vertices') return count === 1 ? 'vertex' : 'vertices';
    if (attribute === 'sides') return count === 1 ? 'side' : 'sides';
    return count === 1 ? 'edge' : 'edges';
}

export class ShapeCompareAttributesGenerator implements ProblemGenerator<ShapeCompareAttributesProblem, ShapeCompareAttributesGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeCompareAttributesGeneratorSchema;

    generate(config: ShapeCompareAttributesGeneratorConfig): ProblemStub<ShapeCompareAttributesProblem> {
        validateConfigFields('shape-compare-attributes', config, ['shape']);
        const shape1 = SHAPES_BY_LABEL[config.shape!];
        if (!shape1) {
            throw new GeneratorValidationError('shape-compare-attributes', 'The selected shape is unsupported.');
        }

        const definition = DEFINITIONS[shape1];
        const attributes = ATTRIBUTES_BY_DIMENSION[definition.dimension];
        const attribute = attributes[Math.floor(random() * attributes.length)];
        const val1 = definition.counts[attribute]!;
        const pool = (Object.keys(DEFINITIONS) as ShapeComparisonName[]).filter(candidate => {
            const candidateDefinition = DEFINITIONS[candidate];
            return candidate !== shape1
                && candidateDefinition.dimension === definition.dimension
                && candidateDefinition.counts[attribute] !== val1;
        });
        if (pool.length === 0) {
            throw new GeneratorValidationError(
                'shape-compare-attributes',
                'The selected shape has no same-dimensional comparison partner.'
            );
        }
        const shape2 = pool[Math.floor(random() * pool.length)];
        const val2 = DEFINITIONS[shape2].counts[attribute]!;
        const answer = val1 > val2 ? shape1 : shape2;
        const greaterCount = Math.max(val1, val2);
        const lesserCount = Math.min(val1, val2);
        const pluralAttribute = attributeText(attribute);

        return {
            data: {
                dimension: definition.dimension,
                attribute,
                shapes: [
                    {shape: shape1, count: val1},
                    {shape: shape2, count: val2}
                ],
                relation: 'more',
                answer,
                prompt: `Which shape has more ${pluralAttribute}?`,
                evidence: [
                    `${titleCase(shape1)} has ${val1} ${attributeText(attribute, val1)}.`,
                    `${titleCase(shape2)} has ${val2} ${attributeText(attribute, val2)}.`,
                    `${greaterCount} > ${lesserCount}, so ${titleCase(answer)} has more ${pluralAttribute}.`
                ]
            },
            tags: [LABELS_BY_SHAPE[shape2]]
        };
    }
}
