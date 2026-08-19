import {
    AngleConceptProblem,
    DeriveOneDegreeProblem,
    InterpretDegreeIterationProblem,
    RecognizeAngleFromArcProblem
} from '../../../types/problems.ts';

const ARC_SWEEPS = new Map([
    [60, {numerator: 1, denominator: 6, display: '1/6'}],
    [90, {numerator: 1, denominator: 4, display: '1/4'}],
    [120, {numerator: 1, denominator: 3, display: '1/3'}],
    [180, {numerator: 1, denominator: 2, display: '1/2'}]
] as const);

const ITERATION_COUNTS = new Set([5, 8, 10, 12, 15]);

export type DiagramPoint = {x: number; y: number};

export const pointOnCircle = (
    centerX: number,
    centerY: number,
    radius: number,
    degrees: number
): DiagramPoint => {
    const radians = degrees * Math.PI / 180;
    return {
        x: centerX + radius * Math.cos(radians),
        y: centerY - radius * Math.sin(radians)
    };
};

export const counterclockwiseArcPath = (
    centerX: number,
    centerY: number,
    radius: number,
    startDegrees: number,
    endDegrees: number
): string => {
    const start = pointOnCircle(centerX, centerY, radius, startDegrees);
    const end = pointOnCircle(centerX, centerY, radius, endDegrees);
    const sweep = endDegrees - startDegrees;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${sweep > 180 ? 1 : 0} 0 ${end.x} ${end.y}`;
};

const isSequentialTicks = (ticks: number[], endDegrees: number): boolean => ticks.length === endDegrees + 1
    && ticks.every((degree, index) => degree === index);

const hasValidGeometry = (data: AngleConceptProblem): boolean => {
    const {geometry} = data;
    return geometry.centerLabel === 'O'
        && geometry.startPointLabel === 'A'
        && geometry.endPointLabel === 'B'
        && geometry.fullTurnDegrees === 360
        && geometry.startDegrees === 0
        && geometry.endDegrees === geometry.sweepDegrees
        && geometry.direction === 'counterclockwise'
        && Array.isArray(geometry.tickDegrees);
};

const isValidRecognition = (data: RecognizeAngleFromArcProblem): boolean => {
    const expectedFraction = ARC_SWEEPS.get(data.geometry.sweepDegrees as 60 | 90 | 120 | 180);
    return expectedFraction !== undefined
        && data.arcFraction.numerator === expectedFraction.numerator
        && data.arcFraction.denominator === expectedFraction.denominator
        && data.arcFraction.display === expectedFraction.display
        && data.geometry.tickDegrees.length === 2
        && data.geometry.tickDegrees[0] === 0
        && data.geometry.tickDegrees[1] === data.geometry.sweepDegrees
        && data.prompt === 'What is the degree measure of the highlighted angle?'
        && data.questionRelation === `${data.arcFraction.display} of a full turn = ?°`
        && data.solutionRelation === `${data.arcFraction.display} of a full turn = ${data.geometry.sweepDegrees}°`
        && data.answer === `${data.geometry.sweepDegrees}°`
        && data.rayStatement === 'Rays OA and OB share endpoint O.'
        && data.answerStatement === `The highlighted angle measures ${data.geometry.sweepDegrees}° because it sweeps ${data.arcFraction.display} of a full turn.`
        && data.explanation === `The highlighted arc covers ${data.arcFraction.display} of the 360° full turn, so its angle measure is ${data.geometry.sweepDegrees}°.`;
};

const isValidOneDegree = (data: DeriveOneDegreeProblem): boolean => data.geometry.sweepDegrees === 1
    && data.geometry.tickDegrees.length === 2
    && data.geometry.tickDegrees[0] === 0
    && data.geometry.tickDegrees[1] === 1
    && data.partitionCount === 360
    && data.selectedParts === 1
    && data.unitFraction.numerator === 1
    && data.unitFraction.denominator === 360
    && data.unitFraction.display === '1/360'
    && data.degreeMeasure === 1
    && data.questionRelation === '1/360 of a full turn = ?'
    && data.solutionRelation === '1/360 of a full turn = 1°'
    && data.fractionStatement === 'One equal turn is 1/360 of a full circle.'
    && data.answer === '1°'
    && data.prompt === 'A full circle is partitioned into 360 equal turns. What is the angle measure of one turn?'
    && data.answerStatement === 'One equal turn measures 1°.'
    && data.explanation === 'A full turn has 360°. Splitting it into 360 equal parts makes each part a 1° turn.';

const isValidIteration = (data: InterpretDegreeIterationProblem): boolean => ITERATION_COUNTS.has(data.iterationCount)
    && data.unitDegree === 1
    && data.angleMeasure === data.iterationCount
    && data.geometry.sweepDegrees === data.angleMeasure
    && isSequentialTicks(data.geometry.tickDegrees, data.angleMeasure)
    && data.prompt === `How many degrees are in ${data.iterationCount} one-degree turns?`
    && data.questionRelation === `${data.iterationCount} × 1° = ?`
    && data.solutionRelation === `${data.iterationCount} × 1° = ${data.iterationCount}°`
    && data.unitStatement === 'Each marked interval is a 1° turn.'
    && data.answer === `${data.iterationCount}°`
    && data.answerStatement === `The angle measures ${data.iterationCount}°.`
    && data.explanation === `Each interval measures 1°. Iterating it ${data.iterationCount} times gives ${data.iterationCount} × 1° = ${data.iterationCount}°.`;

export const isValidAngleConceptProblem = (data: AngleConceptProblem): boolean => {
    if (!hasValidGeometry(data)) return false;
    if (data.task === 'recognize-angle-from-arc') return isValidRecognition(data);
    if (data.task === 'derive-one-degree') return isValidOneDegree(data);
    return data.task === 'interpret-degree-iteration' && isValidIteration(data);
};
