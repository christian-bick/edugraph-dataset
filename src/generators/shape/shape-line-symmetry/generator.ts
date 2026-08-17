import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {Ability} from 'edugraph-ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    LineSymmetryAxis,
    LineSymmetryCoordinate,
    LineSymmetryFigure,
    LineSymmetryIdentificationOption,
    ShapeAttributeOption,
    ShapeLineSymmetryProblem
} from '../../../types/problems.ts';
import {
    ShapeLineSymmetryGeneratorConfig,
    ShapeLineSymmetryGeneratorSchema
} from './spec.ts';

const OPTION_IDS: readonly ShapeAttributeOption['id'][] = ['A', 'B', 'C', 'D'];
const ROOT_TWO = Math.sqrt(2);

function coordinate(x: number, y: number): LineSymmetryCoordinate {
    return {x, y};
}

function correspondence(
    first: LineSymmetryCoordinate,
    second: LineSymmetryCoordinate,
    equation: LineSymmetryAxis['equation']
) {
    return {
        first,
        second,
        foldPoint: coordinate((first.x + second.x) / 2, (first.y + second.y) / 2),
        distanceToAxis: Math.abs(equation.a * first.x + equation.b * first.y + equation.c)
    };
}

function axis(
    id: LineSymmetryAxis['id'],
    start: LineSymmetryCoordinate,
    end: LineSymmetryCoordinate,
    equation: LineSymmetryAxis['equation'],
    pairs: ReadonlyArray<readonly [LineSymmetryCoordinate, LineSymmetryCoordinate]>
): LineSymmetryAxis {
    return {
        id,
        start,
        end,
        equation,
        correspondences: pairs.map(([first, second]) => correspondence(first, second, equation))
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
    figureKind: 'isosceles-triangle',
    vertices: [coordinate(50, 15), coordinate(85, 80), coordinate(15, 80)],
    validAxes: [axis(
        'vertical',
        coordinate(50, 8),
        coordinate(50, 92),
        VERTICAL_EQUATION,
        [
            [coordinate(15, 80), coordinate(85, 80)],
            [coordinate(32.5, 47.5), coordinate(67.5, 47.5)]
        ]
    )],
    axisCount: 1
};

const RECTANGLE: LineSymmetryFigure = {
    figureKind: 'rectangle',
    vertices: [coordinate(20, 25), coordinate(80, 25), coordinate(80, 75), coordinate(20, 75)],
    validAxes: [
        axis(
            'vertical',
            coordinate(50, 12),
            coordinate(50, 88),
            VERTICAL_EQUATION,
            [
                [coordinate(20, 25), coordinate(80, 25)],
                [coordinate(20, 75), coordinate(80, 75)]
            ]
        ),
        axis(
            'horizontal',
            coordinate(8, 50),
            coordinate(92, 50),
            HORIZONTAL_EQUATION,
            [
                [coordinate(20, 25), coordinate(20, 75)],
                [coordinate(80, 25), coordinate(80, 75)]
            ]
        )
    ],
    axisCount: 2
};

const SQUARE: LineSymmetryFigure = {
    figureKind: 'square',
    vertices: [coordinate(25, 25), coordinate(75, 25), coordinate(75, 75), coordinate(25, 75)],
    validAxes: [
        axis(
            'vertical',
            coordinate(50, 12),
            coordinate(50, 88),
            VERTICAL_EQUATION,
            [
                [coordinate(25, 25), coordinate(75, 25)],
                [coordinate(25, 75), coordinate(75, 75)]
            ]
        ),
        axis(
            'horizontal',
            coordinate(12, 50),
            coordinate(88, 50),
            HORIZONTAL_EQUATION,
            [
                [coordinate(25, 25), coordinate(25, 75)],
                [coordinate(75, 25), coordinate(75, 75)]
            ]
        ),
        axis(
            'diagonal-fall',
            coordinate(12, 12),
            coordinate(88, 88),
            DIAGONAL_FALL_EQUATION,
            [
                [coordinate(75, 25), coordinate(25, 75)],
                [coordinate(50, 25), coordinate(25, 50)]
            ]
        ),
        axis(
            'diagonal-rise',
            coordinate(12, 88),
            coordinate(88, 12),
            DIAGONAL_RISE_EQUATION,
            [
                [coordinate(25, 25), coordinate(75, 75)],
                [coordinate(50, 25), coordinate(75, 50)]
            ]
        )
    ],
    axisCount: 4
};

const SCALENE_TRIANGLE: LineSymmetryFigure = {
    figureKind: 'scalene-triangle',
    vertices: [coordinate(15, 80), coordinate(15, 20), coordinate(85, 80)],
    validAxes: [],
    axisCount: 0
};

const PARALLELOGRAM: LineSymmetryFigure = {
    figureKind: 'parallelogram',
    vertices: [coordinate(10, 25), coordinate(80, 25), coordinate(95, 63), coordinate(25, 63)],
    validAxes: [],
    axisCount: 0
};

const IDENTIFICATION_FIGURES = [
    ISOSCELES_TRIANGLE,
    RECTANGLE,
    SCALENE_TRIANGLE,
    PARALLELOGRAM
] as const;

const DRAWING_FIGURES = [ISOSCELES_TRIANGLE, RECTANGLE, SQUARE] as const;

function shuffleOptions(
    figures: readonly LineSymmetryFigure[]
): Extract<ShapeLineSymmetryProblem, {task: 'identify-line-symmetry'}>['options'] {
    const shuffled = [...figures];
    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled.map((figure, index): LineSymmetryIdentificationOption => ({
        id: OPTION_IDS[index],
        figure,
        hasLineSymmetry: figure.axisCount > 0
    })) as Extract<ShapeLineSymmetryProblem, {task: 'identify-line-symmetry'}>['options'];
}

function lineCountPhrase(count: LineSymmetryFigure['axisCount']): string {
    return `${count} ${count === 1 ? 'line' : 'lines'} of symmetry`;
}

export class ShapeLineSymmetryGenerator implements ProblemGenerator<
    ShapeLineSymmetryProblem,
    ShapeLineSymmetryGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeLineSymmetryGeneratorSchema;

    generate(config: ShapeLineSymmetryGeneratorConfig): ProblemStub<ShapeLineSymmetryProblem> | null {
        validateConfigFields('shape-line-symmetry', config, []);
        if (!Array.isArray(config.abilities) || config.abilities.length === 0) {
            throw new GeneratorValidationError(
                'shape-line-symmetry',
                'The abilities field must be a non-empty array.'
            );
        }

        const identify = config.abilities.length === 2
            && config.abilities.includes(Ability.ConceptClassification)
            && config.abilities.includes(Ability.VisualRecognition);
        if (identify) {
            const options = shuffleOptions(IDENTIFICATION_FIGURES);
            const answerIds = options
                .filter(option => option.hasLineSymmetry)
                .map(option => option.id) as Extract<
                    ShapeLineSymmetryProblem,
                    {task: 'identify-line-symmetry'}
                >['answerIds'];
            return {
                data: {
                    task: 'identify-line-symmetry',
                    prompt: 'Classify each figure by whether it can be folded along a line into exactly matching halves.',
                    positiveLabel: 'has line symmetry',
                    negativeLabel: 'does not have line symmetry',
                    options,
                    answerIds,
                    answerStatement: `Figures ${answerIds.join(' and ')} have at least one line of symmetry.`,
                    explanation: 'Each selected figure can be folded along a valid line so its matching parts coincide.'
                }
            };
        }

        const draw = config.abilities.length === 1
            && config.abilities[0] === Ability.VisualArticulation;
        if (draw) {
            const drawingFigure = DRAWING_FIGURES[Math.floor(random() * DRAWING_FIGURES.length)];
            const answer = lineCountPhrase(drawingFigure.axisCount);
            return {
                data: {
                    task: 'draw-line-symmetry',
                    prompt: 'Draw every line where folding the figure makes exactly matching halves.',
                    figure: drawingFigure,
                    completedAxes: drawingFigure.validAxes,
                    answer,
                    answerStatement: `The figure has ${answer}.`,
                    explanation: 'Folding along each completed line maps every supplied pair of points onto each other.'
                }
            };
        }

        return null;
    }
}
