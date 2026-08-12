import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ShapeAttributeClassificationProblem,
    ShapeAttributeOption,
    ShapeCountOption
} from '../../../types/problems.ts';
import {
    getDefiningAttributeStatements,
    getShapeDefinition,
    NON_DEFINING_ATTRIBUTE_STATEMENTS,
    PLANE_SHAPE_LABELS,
    shapeNameFromLabel
} from '../helpers.ts';
import {
    ShapeClassifyAttributesGeneratorConfig,
    ShapeClassifyAttributesGeneratorSchema
} from './spec.ts';

const OPTION_IDS: ShapeAttributeOption['id'][] = ['A', 'B', 'C', 'D'];

const VERTEX_SHAPES = [
    {shape: 'triangle', label: Area.Triangle, count: 3},
    {shape: 'quadrilateral', label: Area.Quadrilateral, count: 4},
    {shape: 'pentagon', label: Area.Pentagon, count: 5},
    {shape: 'hexagon', label: Area.Hexagon, count: 6}
] as const;

const FACE_SHAPES = [
    {shape: 'cube', count: 6, satisfies: true},
    {shape: 'rectangular-prism', count: 6, satisfies: false},
    {shape: 'triangular-prism', count: 5, satisfies: false},
    {shape: 'square-pyramid', count: 5, satisfies: false}
] as const;

type UnpositionedOption = Pick<ShapeAttributeOption, 'text' | 'kind'>;

function pickRandom<T>(values: readonly T[]): T {
    return values[Math.floor(random() * values.length)];
}

function shuffleOptions(options: readonly UnpositionedOption[]): ShapeAttributeOption[] {
    const shuffled = [...options];

    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled.map((option, index) => ({
        ...option,
        id: OPTION_IDS[index]
    }));
}

function shuffleCountOptions(
    options: readonly Omit<ShapeCountOption, 'id'>[]
): ShapeCountOption[] {
    const shuffled = [...options];

    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled.map((option, index) => ({...option, id: OPTION_IDS[index]}));
}

export class ShapeClassifyAttributesGenerator implements ProblemGenerator<
    ShapeAttributeClassificationProblem,
    ShapeClassifyAttributesGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeClassifyAttributesGeneratorSchema;

    generate(
        config: ShapeClassifyAttributesGeneratorConfig
    ): ProblemStub<ShapeAttributeClassificationProblem> | null {
        validateConfigFields('shape-classify-attributes', config, []);
        if (!Array.isArray(config.attributeCounts)) {
            throw new GeneratorValidationError(
                'shape-classify-attributes',
                'The attributeCounts field must be an array.'
            );
        }
        if (!Array.isArray(config.shapes)) {
            throw new GeneratorValidationError(
                'shape-classify-attributes',
                'The shapes field must be an array.'
            );
        }

        const useVertexCount = config.attributeCounts!.includes(Scope.VertexCount);
        const useFaceCount = config.attributeCounts!.includes(Scope.FaceCount);
        const requireEqualFaces = config.attributeCounts!.includes(Scope.Equal);

        if (useVertexCount && !useFaceCount && !requireEqualFaces) {
            const requestedShapes = VERTEX_SHAPES.filter(option => config.shapes!.includes(option.label));
            const selected = pickRandom(requestedShapes.length > 0 ? requestedShapes : VERTEX_SHAPES);
            const options = shuffleCountOptions(VERTEX_SHAPES.map(option => ({
                shape: option.shape,
                count: option.count,
                satisfies: option.count === selected.count
            })));

            return {
                data: {
                    task: 'classify-count',
                    attribute: 'vertices',
                    requiredCount: selected.count,
                    options,
                    answer: options.find(option => option.satisfies)!.id
                },
                tags: [selected.label]
            };
        }

        if (!useVertexCount && useFaceCount && requireEqualFaces) {
            const options = shuffleCountOptions(FACE_SHAPES);
            return {
                data: {
                    task: 'classify-count',
                    attribute: 'equal-faces',
                    requiredCount: 6,
                    options,
                    answer: options.find(option => option.satisfies)!.id
                },
                tags: [Area.Cube]
            };
        }

        if (useVertexCount || useFaceCount || requireEqualFaces) {
            throw new GeneratorValidationError(
                'shape-classify-attributes',
                'Attribute-count labels must select either vertex count or equal face count.'
            );
        }

        const shapeLabel = pickRandom(PLANE_SHAPE_LABELS);
        const shape = shapeNameFromLabel(shapeLabel);
        if (!shape) return null;

        const definingStatement = pickRandom(getDefiningAttributeStatements(shape));
        const options = shuffleOptions([
            {text: definingStatement, kind: 'defining'},
            ...NON_DEFINING_ATTRIBUTE_STATEMENTS.map(text => ({
                text,
                kind: 'non-defining' as const
            }))
        ]);
        const answer = options.find(option => option.kind === 'defining')!.id;

        return {
            data: {
                shape,
                definition: getShapeDefinition(shape),
                options,
                answer
            },
            tags: [shapeLabel]
        };
    }
}
