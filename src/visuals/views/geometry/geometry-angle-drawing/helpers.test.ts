import {describe, expect, it} from 'vitest';
import {SketchAngleProblem} from '../../../../types/problems.ts';
import {isValidSketchAngleProblem} from './helpers.ts';

const problem = (measure: 30 | 150): SketchAngleProblem => ({
    task: 'sketch-angle',
    prompt: `Sketch a ${measure}° angle with vertex O and starting ray OA.`,
    geometry: {
        vertexLabel: 'O',
        baselinePointLabel: 'A',
        terminalPointLabel: 'B',
        baselineSide: 'right',
        baselineDegrees: 0,
        terminalDegrees: measure,
        sweepDegrees: measure,
        direction: 'counterclockwise'
    },
    requestedMeasure: measure,
    completedMeasure: measure,
    questionRelation: `m∠AOB = ${measure}° (requested)`,
    solutionRelation: `m∠AOB = ${measure}°`,
    answer: `${measure}°`,
    answerStatement: `The completed angle measures ${measure}°.`,
    explanation: `Ray OB is placed ${measure}° counterclockwise from ray OA, so angle AOB has the specified measure.`
});

describe('angle drawing validation', () => {
    it('accepts acute and obtuse stress drawings', () => {
        expect(isValidSketchAngleProblem(problem(30))).toBe(true);
        expect(isValidSketchAngleProblem(problem(150))).toBe(true);
    });

    it('rejects leaked/inconsistent completed geometry and prose', () => {
        const obtuse = problem(150);
        expect(isValidSketchAngleProblem({...obtuse, completedMeasure: 30})).toBe(false);
        expect(isValidSketchAngleProblem({...obtuse, geometry: {...obtuse.geometry, terminalDegrees: 30}})).toBe(false);
        expect(isValidSketchAngleProblem({...obtuse, solutionRelation: 'm∠AOB = 30°'})).toBe(false);
        expect(isValidSketchAngleProblem({...obtuse, explanation: 'Ray OB makes a 30° angle.'})).toBe(false);
    });
});
