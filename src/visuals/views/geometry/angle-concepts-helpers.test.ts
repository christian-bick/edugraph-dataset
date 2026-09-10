import {describe, expect, it} from 'vitest';
import {
    AngleUnitPartitionProblem,
    AngleUnitIterationProblem,
    AngleArcFractionProblem
} from '../../../types/problems.ts';
import {
    counterclockwiseArcPath,
    angleDiagramGeometry,
    isValidAngleRelationProblem,
    presentAngleConcept,
    pointOnCircle
} from './angle-concepts-helpers.ts';

const recognition: AngleArcFractionProblem = {
    kind: 'fractional-arc', fullTurnDegrees: 360, angleDegrees: 90,
    arcFraction: {numerator: 1, denominator: 4}
};

const oneDegree: AngleUnitPartitionProblem = {
    kind: 'equal-angle-partition', fullTurnDegrees: 360, parts: 360, angleDegrees: 1
};

const iteration: AngleUnitIterationProblem = {
    kind: 'angle-iteration', fullTurnDegrees: 360, unitDegrees: 1, count: 5, angleDegrees: 5
};

describe('angle concept payload validation', () => {
    it('accepts each supported task with exact mathematical evidence', () => {
        expect(isValidAngleRelationProblem(recognition)).toBe(true);
        expect(isValidAngleRelationProblem(oneDegree)).toBe(true);
        expect(isValidAngleRelationProblem(iteration)).toBe(true);
    });

    it('rejects inconsistent typed angle and fraction relations', () => {
        expect(isValidAngleRelationProblem({
            ...recognition,
            arcFraction: {numerator: 1, denominator: 3}
        })).toBe(false);
        expect(isValidAngleRelationProblem({...oneDegree, angleDegrees: 2 as 1})).toBe(false);
        expect(isValidAngleRelationProblem({...iteration, angleDegrees: 6})).toBe(false);
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

    it('rejects missing, unsupported, or inconsistent mathematical evidence', () => {
        for (const invalid of [
            null, {}, {...recognition, fullTurnDegrees: 180},
            {...recognition, arcFraction: undefined},
            {...oneDegree, parts: 180}, {...iteration, count: 7},
            {...iteration, unitDegrees: 2}, {...iteration, kind: 'unknown'}
        ]) {
            expect(isValidAngleRelationProblem(invalid as never)).toBe(false);
        }
    });

    it('derives sequential diagram boundaries from the repeated unit', () => {
        expect(angleDiagramGeometry(iteration)).toEqual({
            startDegrees: 0, endDegrees: 5, tickDegrees: [0, 1, 2, 3, 4, 5]
        });
        expect(angleDiagramGeometry(recognition).tickDegrees).toEqual([0, 90]);
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
