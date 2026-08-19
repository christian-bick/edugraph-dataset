import {describe, expect, it} from 'vitest';
import {
    DeriveOneDegreeProblem,
    InterpretDegreeIterationProblem,
    RecognizeAngleFromArcProblem
} from '../../../types/problems.ts';
import {
    counterclockwiseArcPath,
    isValidAngleConceptProblem,
    pointOnCircle
} from './angle-concepts-helpers.ts';

const base = {
    geometry: {
        centerLabel: 'O' as const,
        startPointLabel: 'A' as const,
        endPointLabel: 'B' as const,
        fullTurnDegrees: 360 as const,
        startDegrees: 0 as const,
        direction: 'counterclockwise' as const
    }
};

const recognition: RecognizeAngleFromArcProblem = {
    ...base,
    task: 'recognize-angle-from-arc',
    prompt: 'What is the degree measure of the highlighted angle?',
    geometry: {...base.geometry, endDegrees: 90, sweepDegrees: 90, tickDegrees: [0, 90]},
    arcFraction: {numerator: 1, denominator: 4, display: '1/4'},
    questionRelation: '1/4 of a full turn = ?°',
    solutionRelation: '1/4 of a full turn = 90°',
    rayStatement: 'Rays OA and OB share endpoint O.',
    answer: '90°',
    answerStatement: 'The highlighted angle measures 90° because it sweeps 1/4 of a full turn.',
    explanation: 'The highlighted arc covers 1/4 of the 360° full turn, so its angle measure is 90°.'
};

const oneDegree: DeriveOneDegreeProblem = {
    ...base,
    task: 'derive-one-degree',
    prompt: 'A full circle is partitioned into 360 equal turns. What is the angle measure of one turn?',
    geometry: {...base.geometry, endDegrees: 1, sweepDegrees: 1, tickDegrees: [0, 1]},
    partitionCount: 360,
    selectedParts: 1,
    unitFraction: {numerator: 1, denominator: 360, display: '1/360'},
    degreeMeasure: 1,
    questionRelation: '1/360 of a full turn = ?',
    solutionRelation: '1/360 of a full turn = 1°',
    fractionStatement: 'One equal turn is 1/360 of a full circle.',
    answer: '1°',
    answerStatement: 'One equal turn measures 1°.',
    explanation: 'A full turn has 360°. Splitting it into 360 equal parts makes each part a 1° turn.'
};

const iteration: InterpretDegreeIterationProblem = {
    ...base,
    task: 'interpret-degree-iteration',
    prompt: 'How many degrees are in 5 one-degree turns?',
    geometry: {...base.geometry, endDegrees: 5, sweepDegrees: 5, tickDegrees: [0, 1, 2, 3, 4, 5]},
    unitDegree: 1,
    iterationCount: 5,
    angleMeasure: 5,
    questionRelation: '5 × 1° = ?',
    solutionRelation: '5 × 1° = 5°',
    unitStatement: 'Each marked interval is a 1° turn.',
    answer: '5°',
    answerStatement: 'The angle measures 5°.',
    explanation: 'Each interval measures 1°. Iterating it 5 times gives 5 × 1° = 5°.'
};

describe('angle concept payload validation', () => {
    it('accepts each supported task with exact mathematical evidence', () => {
        expect(isValidAngleConceptProblem(recognition)).toBe(true);
        expect(isValidAngleConceptProblem(oneDegree)).toBe(true);
        expect(isValidAngleConceptProblem(iteration)).toBe(true);
    });

    it('rejects inconsistent fractions and answer-bearing relations', () => {
        expect(isValidAngleConceptProblem({...recognition, arcFraction: {numerator: 1, denominator: 3, display: '1/3'}})).toBe(false);
        expect(isValidAngleConceptProblem({...recognition, rayStatement: 'Rays OA and OC share endpoint O.'})).toBe(false);
        expect(isValidAngleConceptProblem({...recognition, answerStatement: 'The highlighted angle measures 60°.'})).toBe(false);
        expect(isValidAngleConceptProblem({...oneDegree, answer: '360°'})).toBe(false);
        expect(isValidAngleConceptProblem({...oneDegree, explanation: 'One turn measures 360°.'})).toBe(false);
        expect(isValidAngleConceptProblem({...iteration, solutionRelation: '5 × 1° = 6°'})).toBe(false);
        expect(isValidAngleConceptProblem({...iteration, explanation: 'Five turns make 6°.'})).toBe(false);
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
