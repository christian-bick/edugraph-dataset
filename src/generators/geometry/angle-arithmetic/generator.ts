import {Ability, Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    AngleArithmeticGeometry,
    AngleArithmeticProblem
} from '../../../types/problems.ts';
import {AngleArithmeticGeneratorConfig, AngleArithmeticGeneratorSchema} from './spec.ts';

type AnglePair = readonly [leftMeasure: number, rightMeasure: number];

const ANGLE_PAIRS: readonly AnglePair[] = [
    [25, 35],
    [30, 60],
    [45, 45],
    [45, 70],
    [55, 75],
    [65, 85],
    [80, 75]
];

function randomItem<T>(items: readonly T[]): T {
    return items[Math.floor(random() * items.length)];
}

function geometry(leftMeasure: number, rightMeasure: number): AngleArithmeticGeometry {
    const wholeMeasure = leftMeasure + rightMeasure;
    return {
        vertexLabel: 'O',
        startPointLabel: 'A',
        dividerPointLabel: 'B',
        endPointLabel: 'C',
        leftAngleName: 'AOB',
        rightAngleName: 'BOC',
        wholeAngleName: 'AOC',
        startDegrees: 0,
        dividerDegrees: leftMeasure,
        endDegrees: wholeMeasure,
        leftSweepDegrees: leftMeasure,
        rightSweepDegrees: rightMeasure,
        wholeSweepDegrees: wholeMeasure,
        direction: 'counterclockwise'
    };
}

export class AngleArithmeticGenerator implements ProblemGenerator<
    AngleArithmeticProblem,
    AngleArithmeticGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = AngleArithmeticGeneratorSchema;

    generate(config: AngleArithmeticGeneratorConfig): ProblemStub<AngleArithmeticProblem> | null {
        validateConfigFields('angle-arithmetic', config, ['operation', 'taskAbility']);

        const [leftMeasure, rightMeasure] = randomItem(ANGLE_PAIRS);
        const wholeMeasure = leftMeasure + rightMeasure;
        const common = {
            geometry: geometry(leftMeasure, rightMeasure),
            leftMeasure,
            rightMeasure,
            wholeMeasure,
            relationStatement: 'm∠AOB + m∠BOC = m∠AOC' as const
        };

        if (
            config.operation === Area.Addition
            && config.taskAbility === Ability.ProcedureUnderstanding
        ) {
            const solutionEquation = `${leftMeasure}° + ${rightMeasure}° = ${wholeMeasure}°`;
            return {
                data: {
                    ...common,
                    task: 'explain-angle-addition',
                    operation: 'addition',
                    unknownRole: 'none',
                    prompt: 'Explain how adjacent angles AOB and BOC combine to form angle AOC.',
                    questionEquation: 'm∠AOB + m∠BOC = m∠AOC',
                    solutionEquation,
                    answer: solutionEquation,
                    answerStatement: 'The measure of angle AOC is the sum of the measures of adjacent angles AOB and BOC.',
                    explanation: `Angles AOB and BOC share ray OB and do not overlap. Their measures add: ${solutionEquation}.`
                }
            };
        }

        if (
            config.operation === Area.Addition
            && config.taskAbility === Ability.ProcedureExecution
        ) {
            const questionEquation = `${leftMeasure}° + ${rightMeasure}° = ?°`;
            const solutionEquation = `${leftMeasure}° + ${rightMeasure}° = ${wholeMeasure}°`;
            return {
                data: {
                    ...common,
                    task: 'solve-unknown-angle',
                    operation: 'addition',
                    unknownRole: 'whole',
                    prompt: 'Find the measure of angle AOC.',
                    wholePartEquation: questionEquation,
                    questionEquation,
                    solutionEquation,
                    answer: `${wholeMeasure}°`,
                    answerStatement: `Angle AOC measures ${wholeMeasure}°.`,
                    explanation: `Angles AOB and BOC are adjacent and form angle AOC. Add ${leftMeasure}° and ${rightMeasure}° to get ${wholeMeasure}°.`
                }
            };
        }

        if (
            config.operation === Area.Subtraction
            && config.taskAbility === Ability.ProcedureInversion
        ) {
            const unknownRole = random() < 0.5 ? 'left-component' : 'right-component';
            const solvesLeft = unknownRole === 'left-component';
            const unknownMeasure = solvesLeft ? leftMeasure : rightMeasure;
            const knownMeasure = solvesLeft ? rightMeasure : leftMeasure;
            const unknownAngleName = solvesLeft ? 'AOB' : 'BOC';
            const knownAngleName = solvesLeft ? 'BOC' : 'AOB';
            const wholePartEquation = solvesLeft
                ? `?° + ${rightMeasure}° = ${wholeMeasure}°`
                : `${leftMeasure}° + ?° = ${wholeMeasure}°`;
            const questionEquation = `${wholeMeasure}° − ${knownMeasure}° = ?°`;
            const solutionEquation = `${wholeMeasure}° − ${knownMeasure}° = ${unknownMeasure}°`;
            return {
                data: {
                    ...common,
                    task: 'solve-unknown-angle',
                    operation: 'subtraction',
                    unknownRole,
                    prompt: `Find the measure of angle ${unknownAngleName}.`,
                    wholePartEquation,
                    questionEquation,
                    solutionEquation,
                    answer: `${unknownMeasure}°`,
                    answerStatement: `Angle ${unknownAngleName} measures ${unknownMeasure}°.`,
                    explanation: `Angle AOC is ${wholeMeasure}°. Subtract angle ${knownAngleName}, ${knownMeasure}°, to find angle ${unknownAngleName}: ${unknownMeasure}°.`
                }
            };
        }

        return null;
    }
}
