import {describe, expect, it} from 'vitest';
import type {AngleMeasurementProblem} from '../../../../types/problems.ts';
import {isValidSketchAngleProblem, presentSketchAngle} from './helpers.ts';

const problem = (angleMeasure: AngleMeasurementProblem['angleMeasure']): AngleMeasurementProblem => ({
    angleMeasure
});

describe('angle drawing presentation', () => {
    it('accepts every supported neutral measure and rejects unsupported values', () => {
        expect(isValidSketchAngleProblem(problem(23))).toBe(true);
        expect(isValidSketchAngleProblem(problem(150))).toBe(true);
        expect(isValidSketchAngleProblem({angleMeasure: 22 as never})).toBe(false);
    });

    it('derives the requested and completed drawing from one angle measure', () => {
        expect(presentSketchAngle(problem(127))).toEqual({
            angleMeasure: 127,
            prompt: 'Sketch a 127° angle with vertex O and starting ray OA.',
            questionRelation: 'm∠AOB = 127° (requested)',
            solutionRelation: 'm∠AOB = 127°',
            answerStatement: 'The completed angle measures 127°.',
            explanation: 'Ray OB is placed 127° counterclockwise from ray OA, so angle AOB has the specified measure.',
            geometry: {
                baselineDegrees: 0,
                terminalDegrees: 127,
                sweepDegrees: 127,
                direction: 'counterclockwise'
            }
        });
    });
});
