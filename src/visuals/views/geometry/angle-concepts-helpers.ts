import {
    AngleConceptProblem,
    DeriveOneDegreeProblem,
    InterpretDegreeIterationProblem,
    RecognizeAngleFromArcProblem
} from '../../../types/problems.ts';

const ARC_SWEEPS = new Map([
    [60, {numerator: 1, denominator: 6}],
    [90, {numerator: 1, denominator: 4}],
    [120, {numerator: 1, denominator: 3}],
    [180, {numerator: 1, denominator: 2}]
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
    return geometry.fullTurnDegrees === 360
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
        && data.geometry.tickDegrees.length === 2
        && data.geometry.tickDegrees[0] === 0
        && data.geometry.tickDegrees[1] === data.geometry.sweepDegrees;
};

const isValidOneDegree = (data: DeriveOneDegreeProblem): boolean => data.geometry.sweepDegrees === 1
    && data.geometry.tickDegrees.length === 2
    && data.geometry.tickDegrees[0] === 0
    && data.geometry.tickDegrees[1] === 1
    && data.partitionCount === 360
    && data.selectedParts === 1
    && data.unitFraction.numerator === 1
    && data.unitFraction.denominator === 360
    && data.degreeMeasure === 1;

const isValidIteration = (data: InterpretDegreeIterationProblem): boolean => ITERATION_COUNTS.has(data.iterationCount)
    && data.unitDegree === 1
    && data.angleMeasure === data.iterationCount
    && data.geometry.sweepDegrees === data.angleMeasure
    && isSequentialTicks(data.geometry.tickDegrees, data.angleMeasure);

export type AngleConceptPresentation = {
    prompt: string;
    questionRelation: string;
    solutionRelation: string;
    answerStatement: string;
    explanation: string;
    rayStatement?: string;
};

export const presentAngleConcept = (data: AngleConceptProblem): AngleConceptPresentation => {
    if (data.task === 'recognize-angle-from-arc') {
        const fraction = `${data.arcFraction.numerator}/${data.arcFraction.denominator}`;
        return {
            prompt: 'What is the degree measure of the highlighted angle?',
            questionRelation: `${fraction} of a full turn = ?°`,
            solutionRelation: `${fraction} of a full turn = ${data.geometry.sweepDegrees}°`,
            rayStatement: 'Rays OA and OB share endpoint O.',
            answerStatement: `The highlighted angle measures ${data.geometry.sweepDegrees}° because it sweeps ${fraction} of a full turn.`,
            explanation: `The highlighted arc covers ${fraction} of the 360° full turn, so its angle measure is ${data.geometry.sweepDegrees}°.`
        };
    }
    if (data.task === 'derive-one-degree') {
        return {
            prompt: 'A full circle is partitioned into 360 equal turns. What is the angle measure of one turn?',
            questionRelation: '1/360 of a full turn = ?',
            solutionRelation: '1/360 of a full turn = 1°',
            answerStatement: 'One equal turn measures 1°.',
            explanation: 'A full turn has 360°. Splitting it into 360 equal parts makes each part a 1° turn.'
        };
    }
    return {
        prompt: `How many degrees are in ${data.iterationCount} one-degree turns?`,
        questionRelation: `${data.iterationCount} × 1° = ?`,
        solutionRelation: `${data.iterationCount} × 1° = ${data.angleMeasure}°`,
        answerStatement: `The angle measures ${data.angleMeasure}°.`,
        explanation: `Each interval measures 1°. Iterating it ${data.iterationCount} times gives ${data.iterationCount} × 1° = ${data.angleMeasure}°.`
    };
};

export const isValidAngleConceptProblem = (data: AngleConceptProblem): boolean => {
    if (!hasValidGeometry(data)) return false;
    if (data.task === 'recognize-angle-from-arc') return isValidRecognition(data);
    if (data.task === 'derive-one-degree') return isValidOneDegree(data);
    return data.task === 'interpret-degree-iteration' && isValidIteration(data);
};
