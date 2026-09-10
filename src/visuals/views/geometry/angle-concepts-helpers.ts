import {
    AngleArcFractionProblem,
    AngleUnitPartitionProblem,
    AngleUnitIterationProblem
} from '../../../types/problems.ts';

export type AngleRelationProblem = AngleArcFractionProblem | AngleUnitPartitionProblem | AngleUnitIterationProblem;
export type AngleDiagramGeometry = {startDegrees: number; endDegrees: number; tickDegrees: number[]};

/** Diagram orientation and tick placement are view choices, derived from the mathematical relation. */
export const angleDiagramGeometry = (data: AngleRelationProblem): AngleDiagramGeometry => ({
    startDegrees: 0,
    endDegrees: data.angleDegrees,
    tickDegrees: data.kind === 'angle-iteration'
        ? Array.from({length: data.count + 1}, (_, index) => index * data.unitDegrees)
        : [0, data.angleDegrees]
});

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

const isValidRecognition = (data: AngleArcFractionProblem): boolean => {
    const expectedFraction = ARC_SWEEPS.get(data.angleDegrees as 60 | 90 | 120 | 180);
    return expectedFraction !== undefined
        && data.arcFraction?.numerator === expectedFraction.numerator
        && data.arcFraction?.denominator === expectedFraction.denominator;
};

const isValidOneDegree = (data: AngleUnitPartitionProblem): boolean =>
    data.parts === 360 && data.angleDegrees === data.fullTurnDegrees / data.parts;

const isValidIteration = (data: AngleUnitIterationProblem): boolean => ITERATION_COUNTS.has(data.count)
    && data.unitDegrees === 1
    && data.angleDegrees === data.count * data.unitDegrees;

export type AngleConceptPresentation = {
    prompt: string;
    questionRelation: string;
    solutionRelation: string;
    answerStatement: string;
    explanation: string;
    rayStatement?: string;
};

export const presentAngleConcept = (data: AngleRelationProblem): AngleConceptPresentation => {
    if (data.kind === 'fractional-arc') {
        const fraction = `${data.arcFraction.numerator}/${data.arcFraction.denominator}`;
        return {
            prompt: 'What is the degree measure of the highlighted angle?',
            questionRelation: `${fraction} of a full turn = ?°`,
            solutionRelation: `${fraction} of a full turn = ${data.angleDegrees}°`,
            rayStatement: 'Rays OA and OB share endpoint O.',
            answerStatement: `The highlighted angle measures ${data.angleDegrees}° because it sweeps ${fraction} of a full turn.`,
            explanation: `The highlighted arc covers ${fraction} of the 360° full turn, so its angle measure is ${data.angleDegrees}°.`
        };
    }
    if (data.kind === 'equal-angle-partition') {
        return {
            prompt: 'A full circle is partitioned into 360 equal turns. What is the angle measure of one turn?',
            questionRelation: '1/360 of a full turn = ?',
            solutionRelation: '1/360 of a full turn = 1°',
            answerStatement: 'One equal turn measures 1°.',
            explanation: 'A full turn has 360°. Splitting it into 360 equal parts makes each part a 1° turn.'
        };
    }
    return {
        prompt: `How many degrees are in ${data.count} one-degree turns?`,
        questionRelation: `${data.count} × 1° = ?`,
        solutionRelation: `${data.count} × 1° = ${data.angleDegrees}°`,
        answerStatement: `The angle measures ${data.angleDegrees}°.`,
        explanation: `Each interval measures 1°. Iterating it ${data.count} times gives ${data.count} × 1° = ${data.angleDegrees}°.`
    };
};

export const isValidAngleRelationProblem = (data: AngleRelationProblem): boolean => {
    if (!data || data.fullTurnDegrees !== 360) return false;
    if (data.kind === 'fractional-arc') return isValidRecognition(data);
    if (data.kind === 'equal-angle-partition') return isValidOneDegree(data);
    return data.kind === 'angle-iteration' && isValidIteration(data);
};
