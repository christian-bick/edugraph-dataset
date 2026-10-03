import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    ShapeCategoryHierarchyProblem,
    ShapeHierarchyClassificationCases,
    ShapeHierarchyInheritance,
    ShapeHierarchyVertex
} from '../../../types/problems.ts';
import {
    ShapeCategoryHierarchyGeneratorConfig,
    ShapeCategoryHierarchyGeneratorSchema
} from './spec.ts';

type Vertices = readonly [
    ShapeHierarchyVertex, ShapeHierarchyVertex,
    ShapeHierarchyVertex, ShapeHierarchyVertex
];

const CATEGORY_ATTRIBUTES = {
    quadrilateral: ['four-straight-sides'],
    rectangle: ['four-straight-sides', 'four-right-angles'],
    rhombus: ['four-straight-sides', 'four-equal-sides'],
    square: ['four-straight-sides', 'four-right-angles', 'four-equal-sides']
} as const;

const DIRECT_INCLUSIONS = [
    {narrower: 'rectangle', broader: 'quadrilateral'},
    {narrower: 'rhombus', broader: 'quadrilateral'},
    {narrower: 'square', broader: 'rectangle'},
    {narrower: 'square', broader: 'rhombus'}
] as const;

const INHERITANCES: readonly ShapeHierarchyInheritance[] = [
    {broader: 'rectangle', narrower: 'square', property: 'four-right-angles'},
    {broader: 'rhombus', narrower: 'square', property: 'four-equal-sides'}
];

const OTHER_QUADRILATERALS: readonly Vertices[] = [
    [{x: 0, y: 0}, {x: 5, y: 0}, {x: 4, y: 3}, {x: 1, y: 4}],
    [{x: 0, y: 0}, {x: 6, y: 1}, {x: 5, y: 4}, {x: 1, y: 3}],
    [{x: 0, y: 0}, {x: 5, y: 1}, {x: 4, y: 5}, {x: 1, y: 4}]
];

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

/** Quarter turns and translation preserve side lengths, right angles, and cyclic order. */
function positioned(vertices: Vertices): Vertices {
    const quarterTurns = randomInteger(0, 3);
    const rotate = ({x, y}: ShapeHierarchyVertex): ShapeHierarchyVertex => {
        switch (quarterTurns) {
            case 1: return {x: -y, y: x};
            case 2: return {x: -x, y: -y};
            case 3: return {x: y, y: -x};
            default: return {x, y};
        }
    };
    const rotated = vertices.map(rotate);
    const minimumX = Math.min(...rotated.map(vertex => vertex.x));
    const minimumY = Math.min(...rotated.map(vertex => vertex.y));
    const left = randomInteger(1, 4);
    const top = randomInteger(1, 4);
    const shift = ({x, y}: ShapeHierarchyVertex): ShapeHierarchyVertex => ({
        x: x - minimumX + left,
        y: y - minimumY + top
    });
    return [shift(rotated[0]!), shift(rotated[1]!), shift(rotated[2]!), shift(rotated[3]!)];
}

function classificationCases(): ShapeHierarchyClassificationCases {
    const rectangleWidth = randomInteger(4, 7);
    const rectangleHeight = randomInteger(2, 3);
    const rhombusA = randomInteger(3, 5);
    const rhombusB = randomInteger(1, 2);
    const squareSide = randomInteger(2, 4);
    const other = OTHER_QUADRILATERALS[randomInteger(0, OTHER_QUADRILATERALS.length - 1)]!;

    return [
        {
            kind: 'other-quadrilateral',
            vertices: positioned(other),
            rightAngleCount: 0,
            allSidesEqual: false,
            memberships: ['quadrilateral']
        },
        {
            kind: 'rectangle-only',
            vertices: positioned([
                {x: 0, y: 0}, {x: rectangleWidth, y: 0},
                {x: rectangleWidth, y: rectangleHeight}, {x: 0, y: rectangleHeight}
            ]),
            rightAngleCount: 4,
            allSidesEqual: false,
            memberships: ['rectangle', 'quadrilateral']
        },
        {
            kind: 'rhombus-only',
            vertices: positioned([
                {x: 0, y: 0}, {x: rhombusA, y: rhombusB},
                {x: rhombusA + rhombusB, y: rhombusA + rhombusB},
                {x: rhombusB, y: rhombusA}
            ]),
            rightAngleCount: 0,
            allSidesEqual: true,
            memberships: ['rhombus', 'quadrilateral']
        },
        {
            kind: 'square',
            vertices: positioned([
                {x: 0, y: 0}, {x: squareSide, y: 0},
                {x: squareSide, y: squareSide}, {x: 0, y: squareSide}
            ]),
            rightAngleCount: 4,
            allSidesEqual: true,
            memberships: ['square', 'rectangle', 'rhombus', 'quadrilateral']
        }
    ];
}

export class ShapeCategoryHierarchyGenerator implements ProblemGenerator<
    ShapeCategoryHierarchyProblem,
    ShapeCategoryHierarchyGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeCategoryHierarchyGeneratorSchema;

    generate(config: ShapeCategoryHierarchyGeneratorConfig): ProblemStub<ShapeCategoryHierarchyProblem> {
        validateConfigFields('shape-category-hierarchy', config, ['classificationModel']);
        if (config.classificationModel !== 'inheritance' && config.classificationModel !== 'classification') {
            throw new GeneratorValidationError('shape-category-hierarchy',
                `Unsupported classification model "${config.classificationModel}".`);
        }
        const inheritance = INHERITANCES[randomInteger(0, INHERITANCES.length - 1)]!;
        return {data: {
            kind: 'shape-category-hierarchy',
            categoryAttributes: CATEGORY_ATTRIBUTES,
            directInclusions: DIRECT_INCLUSIONS,
            inheritance,
            ...(config.classificationModel === 'classification'
                ? {classificationCases: classificationCases()}
                : {})
        }};
    }
}
