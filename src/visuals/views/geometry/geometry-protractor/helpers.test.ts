import {describe, expect, it} from 'vitest';
import {MeasureAngleProblem} from '../../../../types/problems.ts';
import {pointOnAngleCircle} from '../helpers.ts';
import {isValidMeasureAngleProblem} from './helpers.ts';

const problem = (side: 'right' | 'left', angleMeasure: 23 | 158): MeasureAngleProblem => {
    const right = side === 'right';
    const scale = right ? 'inner' : 'outer';
    return {
        task: 'measure-angle',
        prompt: 'Use the protractor to measure angle AOB.',
        geometry: {
            vertexLabel: 'O',
            baselinePointLabel: 'A',
            terminalPointLabel: 'B',
            baselineSide: side,
            baselineDegrees: right ? 0 : 180,
            terminalDegrees: right ? angleMeasure : 180 - angleMeasure,
            sweepDegrees: angleMeasure,
            direction: right ? 'counterclockwise' : 'clockwise'
        },
        protractor: {
            minimumDegrees: 0,
            maximumDegrees: 180,
            tickStepDegrees: 1,
            labelStepDegrees: 10,
            centerLabel: 'O',
            baselinePointLabel: 'A',
            zeroSide: side,
            readingScale: scale
        },
        angleMeasure,
        questionRelation: 'm∠AOB = ?°',
        solutionRelation: `m∠AOB = ${angleMeasure}°`,
        answer: `${angleMeasure}°`,
        answerStatement: `Angle AOB measures ${angleMeasure}°.`,
        explanation: `Ray OA starts at the ${side} 0° mark. Following the ${scale} scale to ray OB gives ${angleMeasure}°.`
    };
};

describe('protractor measurement validation', () => {
    it('accepts right-inner and left-outer stress orientations', () => {
        expect(isValidMeasureAngleProblem(problem('right', 23))).toBe(true);
        expect(isValidMeasureAngleProblem(problem('left', 158))).toBe(true);
    });

    it('rejects incorrect terminal geometry, scale selection, and numeric prose', () => {
        const left = problem('left', 158);
        expect(isValidMeasureAngleProblem({...left, geometry: {...left.geometry, terminalDegrees: 158}})).toBe(false);
        expect(isValidMeasureAngleProblem({...left, protractor: {...left.protractor, readingScale: 'inner'}})).toBe(false);
        expect(isValidMeasureAngleProblem({...left, solutionRelation: 'm∠AOB = 22°'})).toBe(false);
        expect(isValidMeasureAngleProblem({...left, explanation: 'The protractor gives 22°.'})).toBe(false);
    });
});

describe('shared angle geometry', () => {
    it('places 0° right and 180° left on the protractor baseline', () => {
        expect(pointOnAngleCircle(10, 10, 5, 0)).toEqual({x: 15, y: 10});
        expect(pointOnAngleCircle(10, 10, 5, 180).x).toBeCloseTo(5);
        expect(pointOnAngleCircle(10, 10, 5, 180).y).toBeCloseTo(10);
    });
});
