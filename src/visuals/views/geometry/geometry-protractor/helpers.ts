import {random} from '../../../../lib/random.ts';
import type {AngleMeasurementProblem} from '../../../../types/problems.ts';
import {isValidAngleMeasurementProblem} from '../angle-measurement-helpers.ts';

export type MeasureAnglePresentation = {
    angleMeasure: number;
    prompt: string;
    questionRelation: string;
    solutionRelation: string;
    answerStatement: string;
    explanation: string;
    geometry: {
        baselineSide: 'right' | 'left';
        baselineDegrees: 0 | 180;
        terminalDegrees: number;
        sweepDegrees: number;
        direction: 'counterclockwise' | 'clockwise';
    };
    protractor: {
        minimumDegrees: 0;
        maximumDegrees: 180;
        tickStepDegrees: 1;
        labelStepDegrees: 10;
        readingScale: 'inner' | 'outer';
    };
};

export const isValidMeasureAngleProblem = isValidAngleMeasurementProblem;

export const presentMeasureAngle = (
    data: AngleMeasurementProblem
): MeasureAnglePresentation => {
    const baselineSide = random() < 0.5 ? 'right' : 'left';
    const startsRight = baselineSide === 'right';
    const readingScale = startsRight ? 'inner' : 'outer';
    return {
        angleMeasure: data.angleMeasure,
        prompt: 'Use the protractor to measure angle AOB.',
        questionRelation: 'm∠AOB = ?°',
        solutionRelation: `m∠AOB = ${data.angleMeasure}°`,
        answerStatement: `Angle AOB measures ${data.angleMeasure}°.`,
        explanation: `Ray OA starts at the ${baselineSide} 0° mark. Following the ${readingScale} scale to ray OB gives ${data.angleMeasure}°.`,
        geometry: {
            baselineSide,
            baselineDegrees: startsRight ? 0 : 180,
            terminalDegrees: startsRight ? data.angleMeasure : 180 - data.angleMeasure,
            sweepDegrees: data.angleMeasure,
            direction: startsRight ? 'counterclockwise' : 'clockwise'
        },
        protractor: {
            minimumDegrees: 0,
            maximumDegrees: 180,
            tickStepDegrees: 1,
            labelStepDegrees: 10,
            readingScale
        }
    };
};
