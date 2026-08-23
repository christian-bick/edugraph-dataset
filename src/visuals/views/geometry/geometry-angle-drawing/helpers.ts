import type {AngleMeasurementProblem} from '../../../../types/problems.ts';
import {isValidAngleMeasurementProblem} from '../angle-measurement-helpers.ts';

export type SketchAnglePresentation = {
    angleMeasure: number;
    prompt: string;
    questionRelation: string;
    solutionRelation: string;
    answerStatement: string;
    explanation: string;
    geometry: {
        baselineDegrees: 0;
        terminalDegrees: number;
        sweepDegrees: number;
        direction: 'counterclockwise';
    };
};

export const isValidSketchAngleProblem = isValidAngleMeasurementProblem;

export const presentSketchAngle = (
    data: AngleMeasurementProblem
): SketchAnglePresentation => ({
    angleMeasure: data.angleMeasure,
    prompt: `Sketch a ${data.angleMeasure}° angle with vertex O and starting ray OA.`,
    questionRelation: `m∠AOB = ${data.angleMeasure}° (requested)`,
    solutionRelation: `m∠AOB = ${data.angleMeasure}°`,
    answerStatement: `The completed angle measures ${data.angleMeasure}°.`,
    explanation: `Ray OB is placed ${data.angleMeasure}° counterclockwise from ray OA, so angle AOB has the specified measure.`,
    geometry: {
        baselineDegrees: 0,
        terminalDegrees: data.angleMeasure,
        sweepDegrees: data.angleMeasure,
        direction: 'counterclockwise'
    }
});
