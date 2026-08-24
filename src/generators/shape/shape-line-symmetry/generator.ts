import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    LineSymmetryAxis,
    LineSymmetryCoordinate,
    LineSymmetryFigure,
    ShapeLineSymmetryProblem
} from '../../../types/problems.ts';
import {
    ShapeLineSymmetryGeneratorConfig,
    ShapeLineSymmetryGeneratorSchema
} from './spec.ts';

const ROOT_TWO = Math.sqrt(2);

function coordinate(x: number, y: number): LineSymmetryCoordinate {
    return {x, y};
}

function axis(
    equation: LineSymmetryAxis['equation'],
    correspondences: ReadonlyArray<readonly [number, number]>
): LineSymmetryAxis {
    return {
        equation,
        correspondences: correspondences.map(([firstVertex, secondVertex]) => ({
            firstVertex,
            secondVertex
        }))
    };
}

const VERTICAL_EQUATION = {a: 1, b: 0, c: -50};
const HORIZONTAL_EQUATION = {a: 0, b: 1, c: -50};
const DIAGONAL_FALL_EQUATION = {a: 1 / ROOT_TWO, b: -1 / ROOT_TWO, c: 0};
const DIAGONAL_RISE_EQUATION = {
    a: 1 / ROOT_TWO,
    b: 1 / ROOT_TWO,
    c: -100 / ROOT_TWO
};

const ISOSCELES_TRIANGLE: LineSymmetryFigure = {
    kind: 'isosceles-triangle',
    vertices: [coordinate(50, 15), coordinate(85, 80), coordinate(15, 80)],
    validAxes: [axis(
        VERTICAL_EQUATION,
        [
            [0, 0],
            [1, 2]
        ]
    )]
};

const RECTANGLE: LineSymmetryFigure = {
    kind: 'rectangle',
    vertices: [coordinate(20, 25), coordinate(80, 25), coordinate(80, 75), coordinate(20, 75)],
    validAxes: [
        axis(
            VERTICAL_EQUATION,
            [
                [0, 1],
                [2, 3]
            ]
        ),
        axis(
            HORIZONTAL_EQUATION,
            [
                [0, 3],
                [1, 2]
            ]
        )
    ]
};

const SQUARE: LineSymmetryFigure = {
    kind: 'square',
    vertices: [coordinate(25, 25), coordinate(75, 25), coordinate(75, 75), coordinate(25, 75)],
    validAxes: [
        axis(
            VERTICAL_EQUATION,
            [
                [0, 1],
                [2, 3]
            ]
        ),
        axis(
            HORIZONTAL_EQUATION,
            [
                [0, 3],
                [1, 2]
            ]
        ),
        axis(
            DIAGONAL_FALL_EQUATION,
            [
                [0, 0],
                [1, 3],
                [2, 2]
            ]
        ),
        axis(
            DIAGONAL_RISE_EQUATION,
            [
                [0, 2],
                [1, 1],
                [3, 3]
            ]
        )
    ]
};

const SCALENE_TRIANGLE: LineSymmetryFigure = {
    kind: 'scalene-triangle',
    vertices: [coordinate(15, 80), coordinate(15, 20), coordinate(85, 80)],
    validAxes: []
};

const PARALLELOGRAM: LineSymmetryFigure = {
    kind: 'parallelogram',
    vertices: [coordinate(10, 25), coordinate(80, 25), coordinate(95, 63), coordinate(25, 63)],
    validAxes: []
};

const FIGURES: readonly LineSymmetryFigure[] = [
    ISOSCELES_TRIANGLE,
    RECTANGLE,
    SQUARE,
    SCALENE_TRIANGLE,
    PARALLELOGRAM
];

export class ShapeLineSymmetryGenerator implements ProblemGenerator<
    ShapeLineSymmetryProblem,
    ShapeLineSymmetryGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeLineSymmetryGeneratorSchema;

    generate(config: ShapeLineSymmetryGeneratorConfig): ProblemStub<ShapeLineSymmetryProblem> | null {
        validateConfigFields('shape-line-symmetry', config, []);
        return {
            data: {figures: [...FIGURES]}
        };
    }
}
