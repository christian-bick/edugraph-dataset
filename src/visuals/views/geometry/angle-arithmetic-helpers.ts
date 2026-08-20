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
};

export type AngleArithmeticPresentation =
    | ExplainAngleAdditionPresentation
    | SolveUnknownWholePresentation
    | SolveUnknownComponentPresentation;

export type AngleArithmeticViewModel = AngleArithmeticProblem & AngleArithmeticPresentation;

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
    const {leftMeasure, rightMeasure, wholeMeasure} = data;
    const numericAddition = `${leftMeasure}° + ${rightMeasure}° = ${wholeMeasure}°`;

    if (task === 'explain-angle-addition') {
        return {
            task,
            unknownRole: 'none',
            prompt: 'Use the shown whole-part relationship as evidence. Explain how adjacent angles AOB and BOC combine to form angle AOC.',
            questionEquation: data.relationStatement,
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
    && Number.isInteger(data.leftMeasure)
    && Number.isInteger(data.rightMeasure)
    && Number.isInteger(data.wholeMeasure)
    && data.leftMeasure > 0
    && data.rightMeasure > 0
    && data.wholeMeasure < 180
    && data.leftMeasure + data.rightMeasure === data.wholeMeasure
    && STRESS_PAIRS.has(`${data.leftMeasure}+${data.rightMeasure}`)
    && data.geometry.vertexLabel === 'O'
    && data.geometry.startPointLabel === 'A'
    && data.geometry.dividerPointLabel === 'B'
    && data.geometry.endPointLabel === 'C'
    && data.geometry.leftAngleName === 'AOB'
    && data.geometry.rightAngleName === 'BOC'
    && data.geometry.wholeAngleName === 'AOC'
    && data.geometry.startDegrees === 0
    && data.geometry.dividerDegrees === data.leftMeasure
    && data.geometry.endDegrees === data.wholeMeasure
    && data.geometry.leftSweepDegrees === data.leftMeasure
    && data.geometry.rightSweepDegrees === data.rightMeasure
    && data.geometry.wholeSweepDegrees === data.wholeMeasure
    && data.geometry.direction === 'counterclockwise'
    && data.relationStatement === 'm∠AOB + m∠BOC = m∠AOC';
