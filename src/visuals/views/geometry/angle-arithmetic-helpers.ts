import {AngleArithmeticProblem} from '../../../types/problems.ts';

const STRESS_PAIRS = new Set([
    '25+35',
    '30+60',
    '45+45',
    '45+70',
    '55+75',
    '65+85',
    '80+75'
]);

export type AngleArithmeticTask =
    | 'explain-angle-addition'
    | 'solve-unknown-whole'
    | 'solve-unknown-component';

type AngleArithmeticPresentationBase = {
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    answer: string;
    answerStatement: string;
    explanation: string;
};

type ExplainAngleAdditionPresentation = AngleArithmeticPresentationBase & {
    task: 'explain-angle-addition';
    unknownRole: 'none';
};

type SolveUnknownWholePresentation = AngleArithmeticPresentationBase & {
    task: 'solve-unknown-angle';
    unknownRole: 'whole';
    wholePartEquation: string;
};

type SolveUnknownComponentPresentation = AngleArithmeticPresentationBase & {
    task: 'solve-unknown-angle';
    unknownRole: 'left-component' | 'right-component';
    wholePartEquation: string;
    solutionWholePartEquation: string;
};

export type AngleArithmeticPresentation =
    | ExplainAngleAdditionPresentation
    | SolveUnknownWholePresentation
    | SolveUnknownComponentPresentation;

export type AngleArithmeticViewModel = AngleArithmeticPresentation & {
    operation: AngleArithmeticProblem['operation'];
    leftMeasure: number;
    rightMeasure: number;
    wholeMeasure: number;
};

export const resolveAngleArithmeticTask = (
    data: AngleArithmeticProblem,
    task: AngleArithmeticTask
): AngleArithmeticTask | null => {
    if (
        data.operation === 'addition'
        && task === 'explain-angle-addition'
    ) return 'explain-angle-addition';
    if (
        data.operation === 'addition'
        && task === 'solve-unknown-whole'
    ) return 'solve-unknown-whole';
    if (task === 'solve-unknown-component') return 'solve-unknown-component';
    return null;
};

export const buildAngleArithmeticPresentation = (
    data: AngleArithmeticProblem,
    task: AngleArithmeticTask,
    seed: number
): AngleArithmeticPresentation => {
    const [leftMeasure, rightMeasure] = data.adjacentAngleMeasures;
    const wholeMeasure = data.wholeAngleMeasure;
    const numericAddition = `${leftMeasure}° + ${rightMeasure}° = ${wholeMeasure}°`;

    if (task === 'explain-angle-addition') {
        return {
            task,
            unknownRole: 'none',
            prompt: 'Use the shown whole-part relationship as evidence. Explain how adjacent angles AOB and BOC combine to form angle AOC.',
            questionEquation: 'm∠AOB + m∠BOC = m∠AOC',
            solutionEquation: numericAddition,
            answer: numericAddition,
            answerStatement: 'The measure of angle AOC is the sum of the measures of adjacent angles AOB and BOC.',
            explanation: `Angles AOB and BOC share ray OB and do not overlap. Their measures add: ${numericAddition}.`
        };
    }

    if (task === 'solve-unknown-whole') {
        const questionEquation = `${leftMeasure}° + ${rightMeasure}° = ?°`;
        return {
            task: 'solve-unknown-angle',
            unknownRole: 'whole',
            prompt: 'Find the measure of angle AOC.',
            wholePartEquation: questionEquation,
            questionEquation,
            solutionEquation: numericAddition,
            answer: `${wholeMeasure}°`,
            answerStatement: `Angle AOC measures ${wholeMeasure}°.`,
            explanation: `Angles AOB and BOC are adjacent and form angle AOC. Add ${leftMeasure}° and ${rightMeasure}° to get ${wholeMeasure}°.`
        };
    }

    const unknownRole = Math.abs(seed) % 2 === 0
        ? 'left-component'
        : 'right-component';
    const solvesLeft = unknownRole === 'left-component';
    const unknownMeasure = solvesLeft ? leftMeasure : rightMeasure;
    const knownMeasure = solvesLeft ? rightMeasure : leftMeasure;
    const unknownAngleName = solvesLeft ? 'AOB' : 'BOC';
    const knownAngleName = solvesLeft ? 'BOC' : 'AOB';
    const wholePartEquation = solvesLeft
        ? `?° + ${rightMeasure}° = ${wholeMeasure}°`
        : `${leftMeasure}° + ?° = ${wholeMeasure}°`;

    return {
        task: 'solve-unknown-angle',
        unknownRole,
        prompt: `Find the measure of angle ${unknownAngleName}.`,
        wholePartEquation,
        solutionWholePartEquation: numericAddition,
        questionEquation: `${wholeMeasure}° − ${knownMeasure}° = ?°`,
        solutionEquation: `${wholeMeasure}° − ${knownMeasure}° = ${unknownMeasure}°`,
        answer: `${unknownMeasure}°`,
        answerStatement: `Angle ${unknownAngleName} measures ${unknownMeasure}°.`,
        explanation: `Angle AOC is ${wholeMeasure}°. Subtract angle ${knownAngleName}, ${knownMeasure}°, to find angle ${unknownAngleName}: ${unknownMeasure}°.`
    };
};

export const isValidAngleArithmeticProblem = (
    data: AngleArithmeticProblem
): boolean => (data.operation === 'addition' || data.operation === 'subtraction')
    && Array.isArray(data.adjacentAngleMeasures)
    && data.adjacentAngleMeasures.length === 2
    && Number.isInteger(data.adjacentAngleMeasures[0])
    && Number.isInteger(data.adjacentAngleMeasures[1])
    && Number.isInteger(data.wholeAngleMeasure)
    && data.adjacentAngleMeasures[0] > 0
    && data.adjacentAngleMeasures[1] > 0
    && data.wholeAngleMeasure < 180
    && data.adjacentAngleMeasures[0] + data.adjacentAngleMeasures[1] === data.wholeAngleMeasure
    && STRESS_PAIRS.has(`${data.adjacentAngleMeasures[0]}+${data.adjacentAngleMeasures[1]}`);
