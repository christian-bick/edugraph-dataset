import {
    AngleArithmeticProblem,
    ExplainAngleAdditionProblem,
    SolveUnknownComponentAngleProblem,
    SolveUnknownWholeAngleProblem
} from '../../../../types/problems.ts';

const STRESS_PAIRS = new Set(['25+35', '30+60', '45+45', '45+70', '55+75', '65+85', '80+75']);

const hasValidCommonEvidence = (data: AngleArithmeticProblem): boolean => Number.isInteger(data.leftMeasure)
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

const isValidExplanation = (data: ExplainAngleAdditionProblem): boolean => data.operation === 'addition'
    && data.unknownRole === 'none'
    && data.prompt === 'Explain how adjacent angles AOB and BOC combine to form angle AOC.'
    && data.questionEquation === data.relationStatement
    && data.solutionEquation === `${data.leftMeasure}° + ${data.rightMeasure}° = ${data.wholeMeasure}°`
    && data.answer === data.solutionEquation
    && data.answerStatement === 'The measure of angle AOC is the sum of the measures of adjacent angles AOB and BOC.'
    && data.explanation === `Angles AOB and BOC share ray OB and do not overlap. Their measures add: ${data.leftMeasure}° + ${data.rightMeasure}° = ${data.wholeMeasure}°.`;

const isValidUnknownWhole = (data: SolveUnknownWholeAngleProblem): boolean => data.operation === 'addition'
    && data.unknownRole === 'whole'
    && data.prompt === 'Find the measure of angle AOC.'
    && data.wholePartEquation === `${data.leftMeasure}° + ${data.rightMeasure}° = ?°`
    && data.questionEquation === data.wholePartEquation
    && data.solutionEquation === `${data.leftMeasure}° + ${data.rightMeasure}° = ${data.wholeMeasure}°`
    && data.answer === `${data.wholeMeasure}°`
    && data.answerStatement === `Angle AOC measures ${data.wholeMeasure}°.`
    && data.explanation === `Angles AOB and BOC are adjacent and form angle AOC. Add ${data.leftMeasure}° and ${data.rightMeasure}° to get ${data.wholeMeasure}°.`;

const isValidUnknownComponent = (data: SolveUnknownComponentAngleProblem): boolean => {
    if (data.operation !== 'subtraction') return false;
    const unknownLeft = data.unknownRole === 'left-component';
    const unknownRight = data.unknownRole === 'right-component';
    if (!unknownLeft && !unknownRight) return false;
    const knownMeasure = unknownLeft ? data.rightMeasure : data.leftMeasure;
    const unknownMeasure = unknownLeft ? data.leftMeasure : data.rightMeasure;
    const unknownAngle = unknownLeft ? 'AOB' : 'BOC';
    const knownAngle = unknownLeft ? 'BOC' : 'AOB';
    const expectedWholePart = unknownLeft
        ? `?° + ${data.rightMeasure}° = ${data.wholeMeasure}°`
        : `${data.leftMeasure}° + ?° = ${data.wholeMeasure}°`;

    return data.prompt === `Find the measure of angle ${unknownAngle}.`
        && data.wholePartEquation === expectedWholePart
        && data.questionEquation === `${data.wholeMeasure}° − ${knownMeasure}° = ?°`
        && data.solutionEquation === `${data.wholeMeasure}° − ${knownMeasure}° = ${unknownMeasure}°`
        && data.answer === `${unknownMeasure}°`
        && data.answerStatement === `Angle ${unknownAngle} measures ${unknownMeasure}°.`
        && data.explanation === `Angle AOC is ${data.wholeMeasure}°. Subtract angle ${knownAngle}, ${knownMeasure}°, to find angle ${unknownAngle}: ${unknownMeasure}°.`;
};

export const isValidAngleArithmeticProblem = (data: AngleArithmeticProblem): boolean => {
    if (!hasValidCommonEvidence(data)) return false;
    if (data.task === 'explain-angle-addition') return isValidExplanation(data);
    if (data.task !== 'solve-unknown-angle') return false;
    return data.unknownRole === 'whole'
        ? isValidUnknownWhole(data)
        : isValidUnknownComponent(data);
};
