import {describe, expect, it} from 'vitest';
import type {CoordinatePatternPairsProblem} from '../../../types/problems.ts';
import {
    coordinateGridScale,
    coordinatePointPosition,
    GRID_BOTTOM,
    GRID_LEFT,
    markerLabelPosition,
    validateCoordinatePattern
} from './coordinate-pattern-helpers.ts';

const originPattern: CoordinatePatternPairsProblem = {
    kind: 'coordinate-pattern-pairs',
    first: {start: 0, rule: {kind: 'add-constant', increment: 2}, terms: [0, 2, 4, 6]},
    second: {start: 0, rule: {kind: 'add-constant', increment: 3}, terms: [0, 3, 6, 9]},
    points: [{x: 0, y: 0}, {x: 2, y: 3}, {x: 4, y: 6}, {x: 6, y: 9}]
};

const axisPattern: CoordinatePatternPairsProblem = {
    kind: 'coordinate-pattern-pairs',
    first: {start: 2, rule: {kind: 'add-constant', increment: 2}, terms: [2, 4, 6, 8]},
    second: {start: 0, rule: {kind: 'add-constant', increment: 3}, terms: [0, 3, 6, 9]},
    points: [{x: 2, y: 0}, {x: 4, y: 3}, {x: 6, y: 6}, {x: 8, y: 9}]
};

describe('coordinate pattern evidence and grid geometry', () => {
    it('accepts exact zipped first-quadrant pairs including origin and a nonzero axis point', () => {
        expect(() => validateCoordinatePattern('test', originPattern)).not.toThrow();
        expect(() => validateCoordinatePattern('test', axisPattern)).not.toThrow();
    });

    it('rejects unequal lengths and a term that does not follow its own rule', () => {
        const short = {...originPattern, second: {...originPattern.second, terms: [0, 3, 6]}};
        expect(() => validateCoordinatePattern('test', short)).toThrow('complete aligned');
        const wrongStep = {...originPattern, first: {...originPattern.first, terms: [0, 2, 5, 6]}};
        expect(() => validateCoordinatePattern('test', wrongStep)).toThrow('complete aligned');
    });

    it('rejects any pair that disagrees with the sequence rows or exceeds the grid', () => {
        const mismatched = {...originPattern, points: [{x: 0, y: 0}, {x: 2, y: 4}, ...originPattern.points.slice(2)]};
        expect(() => validateCoordinatePattern('test', mismatched)).toThrow('exactly match');
        const tooLarge = {...originPattern, points: [{x: 37, y: 0}, ...originPattern.points.slice(1)]};
        expect(() => validateCoordinatePattern('test', tooLarge)).toThrow('fit the coordinate grid');
    });

    it('requires an axis point and preserves equal unit lengths on both axes', () => {
        const interiorOnly: CoordinatePatternPairsProblem = {
            ...originPattern,
            first: {start: 1, rule: {kind: 'add-constant', increment: 2}, terms: [1, 3, 5, 7]},
            second: {start: 1, rule: {kind: 'add-constant', increment: 3}, terms: [1, 4, 7, 10]},
            points: [{x: 1, y: 1}, {x: 3, y: 4}, {x: 5, y: 7}, {x: 7, y: 10}]
        };
        expect(() => validateCoordinatePattern('test', interiorOnly)).toThrow('axis point');
        const {maximum} = coordinateGridScale(originPattern);
        const origin = coordinatePointPosition({x: 0, y: 0}, maximum);
        const diagonal = coordinatePointPosition({x: 1, y: 1}, maximum);
        expect(diagonal.x - origin.x).toBe(origin.y - diagonal.y);
    });

    it('keeps origin and axis marker labels away from zero and tick labels', () => {
        const {maximum} = coordinateGridScale(axisPattern);
        const originLabel = markerLabelPosition({x: 0, y: 0}, maximum);
        const xAxisLabel = markerLabelPosition({x: 2, y: 0}, maximum);
        const yAxisLabel = markerLabelPosition({x: 0, y: 3}, maximum);
        expect(originLabel.x).toBeGreaterThan(GRID_LEFT);
        expect(originLabel.y).toBeLessThan(GRID_BOTTOM);
        expect(xAxisLabel.y).toBeLessThan(GRID_BOTTOM);
        expect(yAxisLabel.x).toBeGreaterThan(GRID_LEFT);
    });
});
