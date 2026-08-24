import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ShapeAngleClassOption,
    ShapeAngleClassificationProblem,
    ShapeAttributeClassificationProblem,
    ShapeClassificationCoordinate,
    ShapeClassificationFigure,
    ShapeClassificationMarker,
    ShapeClassificationStroke,
    ShapeCountOption,
    ShapeLineRelationClassificationProblem,
    ShapeLineRelationOption,
    ShapeRightTriangleOption,
    RightTriangleCategoryProblem
} from '../../../types/problems.ts';
import {
    createQuadrilateralSubsumptionProblem,
    getDefiningAttributes,
    getShapeDefinition,
    PLANE_SHAPE_LABELS,
    QUADRILATERAL_SUBTYPE_LABELS,
    shapeNameFromLabel
} from '../helpers.ts';
import {
    ShapeClassifyAttributesGeneratorConfig,
    ShapeClassifyAttributesGeneratorSchema
} from './spec.ts';

const POLYGON_COUNT_SHAPES = [
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

function pickRandom<T>(values: readonly T[]): T {
    return values[Math.floor(random() * values.length)];
}

function stroke(
    start: ShapeClassificationCoordinate,
    end: ShapeClassificationCoordinate
): ShapeClassificationStroke {
    return {start, end};
}

function figure(vertices: ShapeClassificationCoordinate[]): ShapeClassificationFigure {
    return {
        vertices,
        sides: vertices.map((vertex, index) => stroke(
            vertex,
            vertices[(index + 1) % vertices.length]
        ))
    };
}

const RIGHT_TRIANGLE = figure([
    {x: 20, y: 20},
    {x: 20, y: 80},
    {x: 80, y: 80}
]);

const RIGHT_TRIANGLE_ROTATED = figure([
    {x: 20, y: 20},
    {x: 80, y: 20},
    {x: 20, y: 80}
]);

const ACUTE_TRIANGLE = figure([
    {x: 50, y: 20},
    {x: 80, y: 72},
    {x: 20, y: 72}
]);

const OBTUSE_TRIANGLE = figure([
    {x: 50, y: 30},
    {x: 85, y: 30},
    {x: 25, y: 55}
]);

const RECTANGLE = figure([
    {x: 20, y: 20},
    {x: 80, y: 20},
    {x: 80, y: 75},
    {x: 20, y: 75}
]);

const TRAPEZOID = figure([
    {x: 20, y: 25},
    {x: 80, y: 25},
    {x: 90, y: 80},
    {x: 10, y: 80}
]);

const PARALLELOGRAM = figure([
    {x: 25, y: 20},
    {x: 85, y: 20},
    {x: 70, y: 75},
    {x: 10, y: 75}
]);

const SQUARE = figure([
    {x: 25, y: 20},
    {x: 75, y: 20},
    {x: 75, y: 70},
    {x: 25, y: 70}
]);

const IRREGULAR_QUADRILATERAL = figure([
    {x: 20, y: 20},
    {x: 82, y: 32},
    {x: 70, y: 85},
    {x: 12, y: 70}
]);

const PARALLEL_MARKER: Extract<ShapeClassificationMarker, {kind: 'parallel'}> = {
    kind: 'parallel',
    strokes: [
        stroke({x: 48, y: 21}, {x: 52, y: 29}),
        stroke({x: 48, y: 76}, {x: 52, y: 84})
    ]
};

const PARALLELOGRAM_PARALLEL_MARKER: Extract<ShapeClassificationMarker, {kind: 'parallel'}> = {
    kind: 'parallel',
    strokes: [
        stroke({x: 48, y: 16}, {x: 52, y: 24}),
        stroke({x: 48, y: 71}, {x: 52, y: 79})
    ]
};

const RIGHT_TRIANGLE_MARKER: Extract<ShapeClassificationMarker, {kind: 'right-angle'}> = {
    kind: 'right-angle',
    points: [{x: 20, y: 68}, {x: 32, y: 68}, {x: 32, y: 80}]
};

const TOP_LEFT_RIGHT_MARKER: Extract<ShapeClassificationMarker, {kind: 'right-angle'}> = {
    kind: 'right-angle',
    points: [{x: 20, y: 32}, {x: 32, y: 32}, {x: 32, y: 20}]
};

type UnpositionedLineOption = Omit<ShapeLineRelationOption, 'satisfies'>;

const LINE_OPTIONS: Record<'parallel' | 'perpendicular', readonly UnpositionedLineOption[]> = {
    parallel: [
        {
            figure: TRAPEZOID,
            relations: ['parallel'],
            evidenceStrokes: [TRAPEZOID.sides[0], TRAPEZOID.sides[2]],
            marker: PARALLEL_MARKER
        },
        {
            figure: PARALLELOGRAM,
            relations: ['parallel'],
            evidenceStrokes: [PARALLELOGRAM.sides[0], PARALLELOGRAM.sides[2]],
            marker: PARALLELOGRAM_PARALLEL_MARKER
        },
        {
            figure: RIGHT_TRIANGLE,
            relations: ['perpendicular'],
            evidenceStrokes: [RIGHT_TRIANGLE.sides[0], RIGHT_TRIANGLE.sides[1]],
            marker: RIGHT_TRIANGLE_MARKER
        },
        {
            figure: IRREGULAR_QUADRILATERAL,
            relations: [],
            evidenceStrokes: [IRREGULAR_QUADRILATERAL.sides[0], IRREGULAR_QUADRILATERAL.sides[1]],
            marker: null
        }
    ],
    perpendicular: [
        {
            figure: RIGHT_TRIANGLE,
            relations: ['perpendicular'],
            evidenceStrokes: [RIGHT_TRIANGLE.sides[0], RIGHT_TRIANGLE.sides[1]],
            marker: RIGHT_TRIANGLE_MARKER
        },
        {
            figure: RECTANGLE,
            relations: ['parallel', 'perpendicular'],
            evidenceStrokes: [RECTANGLE.sides[0], RECTANGLE.sides[3]],
            marker: TOP_LEFT_RIGHT_MARKER
        },
        {
            figure: TRAPEZOID,
            relations: ['parallel'],
            evidenceStrokes: [TRAPEZOID.sides[0], TRAPEZOID.sides[2]],
            marker: PARALLEL_MARKER
        },
        {
            figure: IRREGULAR_QUADRILATERAL,
            relations: [],
            evidenceStrokes: [IRREGULAR_QUADRILATERAL.sides[0], IRREGULAR_QUADRILATERAL.sides[1]],
            marker: null
        }
    ]
};

function createLineRelationProblem(
    criterion: 'parallel' | 'perpendicular'
): ShapeLineRelationClassificationProblem {
    const options = LINE_OPTIONS[criterion].map(option => ({
        ...option,
        satisfies: option.relations.includes(criterion)
    })) as ShapeLineRelationClassificationProblem['options'];
    return {
        task: 'classify-line-relation',
        criterion,
        options
    };
}

type UnpositionedAngleOption = Omit<ShapeAngleClassOption, 'satisfies'>;

const RIGHT_TRIANGLE_RIGHT_OPTION: UnpositionedAngleOption = {
    figure: RIGHT_TRIANGLE,
    angleClasses: ['acute', 'right', 'acute'],
    angleClass: 'right',
    evidenceRays: [
        stroke(RIGHT_TRIANGLE.vertices[1], RIGHT_TRIANGLE.vertices[0]),
        stroke(RIGHT_TRIANGLE.vertices[1], RIGHT_TRIANGLE.vertices[2])
    ],
    marker: RIGHT_TRIANGLE_MARKER
};

const RIGHT_TRIANGLE_ACUTE_OPTION: UnpositionedAngleOption = {
    figure: RIGHT_TRIANGLE,
    angleClasses: ['acute', 'right', 'acute'],
    angleClass: 'acute',
    evidenceRays: [
        stroke(RIGHT_TRIANGLE.vertices[0], RIGHT_TRIANGLE.vertices[1]),
        stroke(RIGHT_TRIANGLE.vertices[0], RIGHT_TRIANGLE.vertices[2])
    ],
    marker: {kind: 'angle-arc', center: {x: 20, y: 20}, radius: 13, startDegrees: 45, endDegrees: 90}
};

const RECTANGLE_RIGHT_OPTION: UnpositionedAngleOption = {
    figure: RECTANGLE,
    angleClasses: ['right', 'right', 'right', 'right'],
    angleClass: 'right',
    evidenceRays: [
        stroke(RECTANGLE.vertices[0], RECTANGLE.vertices[1]),
        stroke(RECTANGLE.vertices[0], RECTANGLE.vertices[3])
    ],
    marker: TOP_LEFT_RIGHT_MARKER
};

const SQUARE_RIGHT_OPTION: UnpositionedAngleOption = {
    figure: SQUARE,
    angleClasses: ['right', 'right', 'right', 'right'],
    angleClass: 'right',
    evidenceRays: [
        stroke(SQUARE.vertices[0], SQUARE.vertices[1]),
        stroke(SQUARE.vertices[0], SQUARE.vertices[3])
    ],
    marker: {
        kind: 'right-angle',
        points: [{x: 25, y: 32}, {x: 37, y: 32}, {x: 37, y: 20}]
    }
};

const ACUTE_TRIANGLE_OPTION: UnpositionedAngleOption = {
    figure: ACUTE_TRIANGLE,
    angleClasses: ['acute', 'acute', 'acute'],
    angleClass: 'acute',
    evidenceRays: [
        stroke(ACUTE_TRIANGLE.vertices[0], ACUTE_TRIANGLE.vertices[1]),
        stroke(ACUTE_TRIANGLE.vertices[0], ACUTE_TRIANGLE.vertices[2])
    ],
    marker: {kind: 'angle-arc', center: {x: 50, y: 20}, radius: 13, startDegrees: 60, endDegrees: 120}
};

const OBTUSE_TRIANGLE_OPTION: UnpositionedAngleOption = {
    figure: OBTUSE_TRIANGLE,
    angleClasses: ['obtuse', 'acute', 'acute'],
    angleClass: 'obtuse',
    evidenceRays: [
        stroke(OBTUSE_TRIANGLE.vertices[0], OBTUSE_TRIANGLE.vertices[1]),
        stroke(OBTUSE_TRIANGLE.vertices[0], OBTUSE_TRIANGLE.vertices[2])
    ],
    marker: {kind: 'angle-arc', center: {x: 50, y: 30}, radius: 13, startDegrees: 0, endDegrees: 135}
};

const OBTUSE_PARALLELOGRAM_OPTION: UnpositionedAngleOption = {
    figure: PARALLELOGRAM,
    angleClasses: ['obtuse', 'acute', 'obtuse', 'acute'],
    angleClass: 'obtuse',
    evidenceRays: [
        stroke(PARALLELOGRAM.vertices[0], PARALLELOGRAM.vertices[1]),
        stroke(PARALLELOGRAM.vertices[0], PARALLELOGRAM.vertices[3])
    ],
    marker: {kind: 'angle-arc', center: {x: 25, y: 20}, radius: 13, startDegrees: 0, endDegrees: 105}
};

const ANGLE_OPTIONS: Record<'right' | 'acute' | 'obtuse', readonly UnpositionedAngleOption[]> = {
    right: [
        RIGHT_TRIANGLE_RIGHT_OPTION,
        RECTANGLE_RIGHT_OPTION,
        ACUTE_TRIANGLE_OPTION,
        OBTUSE_TRIANGLE_OPTION
    ],
    acute: [
        ACUTE_TRIANGLE_OPTION,
        RIGHT_TRIANGLE_ACUTE_OPTION,
        RECTANGLE_RIGHT_OPTION,
        SQUARE_RIGHT_OPTION
    ],
    obtuse: [
        OBTUSE_TRIANGLE_OPTION,
        OBTUSE_PARALLELOGRAM_OPTION,
        RIGHT_TRIANGLE_RIGHT_OPTION,
        ACUTE_TRIANGLE_OPTION
    ]
};

function createAngleClassificationProblem(
    criterion: 'right' | 'acute' | 'obtuse'
): ShapeAngleClassificationProblem {
    const options = ANGLE_OPTIONS[criterion].map(option => ({
        ...option,
        satisfies: option.angleClasses.includes(criterion)
    })) as ShapeAngleClassificationProblem['options'];
    return {
        task: 'classify-angle-size',
        criterion,
        options
    };
}

function rightTriangleOption(
    triangle: ShapeClassificationFigure,
    angleClasses: ShapeRightTriangleOption['angleClasses'],
    angleClass: ShapeRightTriangleOption['angleClass'],
    evidenceRays: ShapeRightTriangleOption['evidenceRays'],
    marker: ShapeClassificationMarker
): Omit<ShapeRightTriangleOption, 'satisfies'> {
    return {figure: triangle, angleClasses, angleClass, evidenceRays, marker};
}

function createRightTriangleProblem(): RightTriangleCategoryProblem {
    const unpositioned = [
        rightTriangleOption(
            RIGHT_TRIANGLE,
            ['acute', 'right', 'acute'],
            'right',
            [
                stroke(RIGHT_TRIANGLE.vertices[1], RIGHT_TRIANGLE.vertices[0]),
                stroke(RIGHT_TRIANGLE.vertices[1], RIGHT_TRIANGLE.vertices[2])
            ],
            RIGHT_TRIANGLE_MARKER
        ),
        rightTriangleOption(
            RIGHT_TRIANGLE_ROTATED,
            ['right', 'acute', 'acute'],
            'right',
            [
                stroke(RIGHT_TRIANGLE_ROTATED.vertices[0], RIGHT_TRIANGLE_ROTATED.vertices[1]),
                stroke(RIGHT_TRIANGLE_ROTATED.vertices[0], RIGHT_TRIANGLE_ROTATED.vertices[2])
            ],
            TOP_LEFT_RIGHT_MARKER
        ),
        rightTriangleOption(
            ACUTE_TRIANGLE,
            ['acute', 'acute', 'acute'],
            'acute',
            [
                stroke(ACUTE_TRIANGLE.vertices[0], ACUTE_TRIANGLE.vertices[1]),
                stroke(ACUTE_TRIANGLE.vertices[0], ACUTE_TRIANGLE.vertices[2])
            ],
            {kind: 'angle-arc', center: {x: 50, y: 20}, radius: 13, startDegrees: 60, endDegrees: 120}
        ),
        rightTriangleOption(
            OBTUSE_TRIANGLE,
            ['obtuse', 'acute', 'acute'],
            'obtuse',
            [
                stroke(OBTUSE_TRIANGLE.vertices[0], OBTUSE_TRIANGLE.vertices[1]),
                stroke(OBTUSE_TRIANGLE.vertices[0], OBTUSE_TRIANGLE.vertices[2])
            ],
            {kind: 'angle-arc', center: {x: 50, y: 30}, radius: 13, startDegrees: 0, endDegrees: 135}
        )
    ];
    const options = unpositioned.map(option => ({
        ...option,
        satisfies: option.angleClasses.includes('right')
    })) as RightTriangleCategoryProblem['options'];
    return {
        task: 'classify-right-triangle-category',
        options,
        category: 'triangle'
    };
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
        validateConfigFields('shape-classify-attributes', config, ['subsumption']);
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
        if (!Array.isArray(config.criteria)) {
            throw new GeneratorValidationError(
                'shape-classify-attributes',
                'The criteria field must be an array.'
            );
        }
        if (config.criteria.length > 1) {
            throw new GeneratorValidationError(
                'shape-classify-attributes',
                'Exactly one classification criterion may be selected.'
            );
        }

        const useVertexCount = config.attributeCounts!.includes(Scope.VertexCount);
        const useAngleCount = config.attributeCounts!.includes(Scope.AngleCount);
        const useFaceCount = config.attributeCounts!.includes(Scope.FaceCount);
        const requireEqualFaces = config.attributeCounts!.includes(Scope.Equal);

        if ((useVertexCount !== useAngleCount) && !useFaceCount && !requireEqualFaces) {
            const requestedShapes = POLYGON_COUNT_SHAPES.filter(option => config.shapes!.includes(option.label));
            const selected = pickRandom(requestedShapes.length > 0 ? requestedShapes : POLYGON_COUNT_SHAPES);
            const options: ShapeCountOption[] = POLYGON_COUNT_SHAPES.map(option => ({
                shape: option.shape,
                count: option.count,
                satisfies: option.count === selected.count
            }));

            return {
                data: {
                    task: 'classify-count',
                    attribute: useAngleCount ? 'angles' : 'vertices',
                    requiredCount: selected.count,
                    options
                }
            };
        }

        if (!useVertexCount && useFaceCount && requireEqualFaces) {
            return {
                data: {
                    task: 'classify-count',
                    attribute: 'equal-faces',
                    requiredCount: 6,
                    options: [...FACE_SHAPES]
                }
            };
        }

        if (useVertexCount || useAngleCount || useFaceCount || requireEqualFaces) {
            throw new GeneratorValidationError(
                'shape-classify-attributes',
                'Attribute-count labels must select vertex count, angle count, or equal face count.'
            );
        }

        const [criterion] = config.criteria;
        if (!config.subsumption && criterion === Area.ParallelismRelation) {
            return {data: createLineRelationProblem('parallel')};
        }
        if (!config.subsumption && criterion === Area.PerpendicularityRelation) {
            return {data: createLineRelationProblem('perpendicular')};
        }
        if (!config.subsumption && criterion === Area.RightAngle) {
            return {data: createAngleClassificationProblem('right')};
        }
        if (!config.subsumption && criterion === Area.AcuteAngle) {
            return {data: createAngleClassificationProblem('acute')};
        }
        if (!config.subsumption && criterion === Area.ObtuseAngle) {
            return {data: createAngleClassificationProblem('obtuse')};
        }
        if (
            config.subsumption
            && criterion === Area.RightAngle
            && config.shapes!.includes(Area.RightTriangle)
        ) {
            return {data: createRightTriangleProblem()};
        }
        if (criterion) return null;

        const subsumptionLabel = config.shapes!.find(label =>
            QUADRILATERAL_SUBTYPE_LABELS.includes(label as typeof QUADRILATERAL_SUBTYPE_LABELS[number])
        );
        if (config.subsumption) {
            if (!subsumptionLabel) return null;
            const shape = shapeNameFromLabel(subsumptionLabel);
            if (shape !== 'rhombus' && shape !== 'rectangle' && shape !== 'square') return null;
            return {data: createQuadrilateralSubsumptionProblem(shape)};
        }

        const shapeLabel = pickRandom(PLANE_SHAPE_LABELS);
        const shape = shapeNameFromLabel(shapeLabel);
        if (!shape) return null;

        return {
            data: {
                shape,
                definition: getShapeDefinition(shape),
                definingAttribute: pickRandom(getDefiningAttributes(shape))
            }
        };
    }
}
