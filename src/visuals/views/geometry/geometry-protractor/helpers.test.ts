import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../../lib/random.ts';
import type {AngleMeasurementProblem} from '../../../../types/problems.ts';
import {pointOnAngleCircle} from '../helpers.ts';
import {isValidMeasureAngleProblem, presentMeasureAngle} from './helpers.ts';

const problem = (angleMeasure: AngleMeasurementProblem['angleMeasure']): AngleMeasurementProblem => ({
    angleMeasure
});

describe('protractor measurement presentation', () => {
    it('accepts every supported neutral measure and rejects unsupported values', () => {
        expect(isValidMeasureAngleProblem(problem(23))).toBe(true);
        expect(isValidMeasureAngleProblem(problem(150))).toBe(true);
        expect(isValidMeasureAngleProblem({angleMeasure: 22 as never})).toBe(false);
    });

    it('seeds both valid protractor orientations and derives their complete presentation', () => {
        const orientations = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const presentation = presentMeasureAngle(problem(158));
            orientations.add(presentation.geometry.baselineSide);
            expect(presentation.geometry.sweepDegrees).toBe(158);
            expect(presentation.geometry.terminalDegrees).toBe(
                presentation.geometry.baselineSide === 'right' ? 158 : 22
            );
            expect(presentation.protractor.readingScale).toBe(
                presentation.geometry.baselineSide === 'right' ? 'inner' : 'outer'
            );
            expect(presentation.solutionRelation).toBe('m∠AOB = 158°');
        }
        expect(orientations).toEqual(new Set(['right', 'left']));
    });
});

describe('shared angle geometry', () => {
    it('places 0° right and 180° left on the protractor baseline', () => {
        expect(pointOnAngleCircle(10, 10, 5, 0)).toEqual({x: 15, y: 10});
        expect(pointOnAngleCircle(10, 10, 5, 180).x).toBeCloseTo(5);
        expect(pointOnAngleCircle(10, 10, 5, 180).y).toBeCloseTo(10);
    });
});
