import {SketchAngleProblem} from '../../../../types/problems.ts';

const MEASURES = new Set([30, 45, 60, 75, 90, 105, 120, 135, 150]);

export const isValidSketchAngleProblem = (data: SketchAngleProblem): boolean => MEASURES.has(data.requestedMeasure)
    && data.task === 'sketch-angle'
    && data.completedMeasure === data.requestedMeasure
    && data.geometry.vertexLabel === 'O'
    && data.geometry.baselinePointLabel === 'A'
    && data.geometry.terminalPointLabel === 'B'
    && data.geometry.baselineSide === 'right'
    && data.geometry.baselineDegrees === 0
    && data.geometry.terminalDegrees === data.requestedMeasure
    && data.geometry.sweepDegrees === data.completedMeasure
    && data.geometry.direction === 'counterclockwise'
    && data.prompt === `Sketch a ${data.requestedMeasure}° angle with vertex O and starting ray OA.`
    && data.questionRelation === `m∠AOB = ${data.requestedMeasure}° (requested)`
    && data.solutionRelation === `m∠AOB = ${data.completedMeasure}°`
    && data.answer === `${data.completedMeasure}°`
    && data.answerStatement === `The completed angle measures ${data.completedMeasure}°.`
    && data.explanation === `Ray OB is placed ${data.completedMeasure}° counterclockwise from ray OA, so angle AOB has the specified measure.`;
