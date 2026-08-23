import {describe, expect, it} from 'vitest';
import {
    DeriveOneDegreeProblem,
    InterpretDegreeIterationProblem,
    RecognizeAngleFromArcProblem
} from '../../../types/problems.ts';
import {
    counterclockwiseArcPath,
    isValidAngleConceptProblem,
    presentAngleConcept,
    pointOnCircle
} from './angle-concepts-helpers.ts';

const base = {
    geometry: {
        fullTurnDegrees: 360 as const,
        startDegrees: 0 as const,
        direction: 'counterclockwise' as const
    }
};

const recognition: RecognizeAngleFromArcProblem = {
    ...base,
    task: 'recognize-angle-from-arc',
    geometry: {...base.geometry, endDegrees: 90, sweepDegrees: 90, tickDegrees: [0, 90]},
    arcFraction: {numerator: 1, denominator: 4}
};

const oneDegree: DeriveOneDegreeProblem = {
    ...base,
    task: 'derive-one-degree',
    geometry: {...base.geometry, endDegrees: 1, sweepDegrees: 1, tickDegrees: [0, 1]},
    partitionCount: 360,
    selectedParts: 1,
    unitFraction: {numerator: 1, denominator: 360},
    degreeMeasure: 1
};

const iteration: InterpretDegreeIterationProblem = {
    ...base,
    task: 'interpret-degree-iteration',
    geometry: {...base.geometry, endDegrees: 5, sweepDegrees: 5, tickDegrees: [0, 1, 2, 3, 4, 5]},
    unitDegree: 1,
    iterationCount: 5,
    angleMeasure: 5
};

describe('angle concept payload validation', () => {
    it('accepts each supported task with exact mathematical evidence', () => {
        expect(isValidAngleConceptProblem(recognition)).toBe(true);
        expect(isValidAngleConceptProblem(oneDegree)).toBe(true);
        expect(isValidAngleConceptProblem(iteration)).toBe(true);
    });

    it('rejects inconsistent typed angle and fraction relations', () => {
        expect(isValidAngleConceptProblem({
            ...recognition,
            arcFraction: {numerator: 1, denominator: 3}
        })).toBe(false);
        expect(isValidAngleConceptProblem({...oneDegree, degreeMeasure: 2 as 1})).toBe(false);
        expect(isValidAngleConceptProblem({...iteration, angleMeasure: 6})).toBe(false);
    });

    it('derives the learner-facing relations and explanations', () => {
        expect(presentAngleConcept(recognition)).toMatchObject({
            questionRelation: '1/4 of a full turn = ?°',
            solutionRelation: '1/4 of a full turn = 90°',
            rayStatement: 'Rays OA and OB share endpoint O.'
        });
        expect(presentAngleConcept(oneDegree).solutionRelation).toBe(
            '1/360 of a full turn = 1°'
        );
        expect(presentAngleConcept(iteration).solutionRelation).toBe('5 × 1° = 5°');
    });

    it('rejects missing or non-sequential repeated-degree boundaries', () => {
        expect(isValidAngleConceptProblem({
            ...iteration,
            geometry: {...iteration.geometry, tickDegrees: [0, 1, 3, 4, 5]}
        })).toBe(false);
    });
});

describe('angle diagram geometry', () => {
    it('maps mathematical degrees counterclockwise in SVG coordinates', () => {
        expect(pointOnCircle(10, 10, 5, 0)).toEqual({x: 15, y: 10});
        expect(pointOnCircle(10, 10, 5, 90).x).toBeCloseTo(10);
        expect(pointOnCircle(10, 10, 5, 90).y).toBeCloseTo(5);
    });

    it('uses the counterclockwise SVG arc and the large-arc flag only above 180 degrees', () => {
        expect(counterclockwiseArcPath(0, 0, 10, 0, 90)).toContain('0 0 0');
        expect(counterclockwiseArcPath(0, 0, 10, 0, 270)).toContain('0 1 0');
    });
});
