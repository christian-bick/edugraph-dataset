import {describe, expect, it} from 'vitest';
import {ShapePartitionProblem} from '../../../types/problems.ts';
import {
    isValidShapePartitionProblem,
    resolveShapePartitionTask,
    selectShareIndex,
    selectShareName
} from './shape-partition-helpers.ts';

const equalShare: ShapePartitionProblem = {
    model: 'equal-share-partition',
    shape: 'circle',
    parts: 4,
    wholeCount: 1,
    unitFraction: '1/4'
};

const comparison: ShapePartitionProblem = {
    model: 'unit-share-comparison',
    shape: 'rectangle',
    unitFractions: [
        {numerator: 1, denominator: 2, display: '1/2'},
        {numerator: 1, denominator: 4, display: '1/4'}
    ],
    relation: 'less',
    lesserFraction: '1/4'
};

const fractionRegion: ShapePartitionProblem = {
    model: 'fraction-region',
    shape: 'circle',
    parts: 6,
    numerator: 5,
    unitFraction: '1/6',
    fraction: '5/6'
};

describe('shape-partition Ability projection', () => {
    it.each([
        [equalShare, 'partition'],
        [equalShare, 'name-share'],
        [equalShare, 'compose-whole'],
        [equalShare, 'partition-and-label-unit-fraction'],
        [comparison, 'compare-share-size'],
        [fractionRegion, 'interpret-fraction']
    ] as const)('accepts a model and task %s', (model, task) => {
        expect(resolveShapePartitionTask(model, task)).toBe(task);
    });

    it('rejects unsupported Ability/model combinations', () => {
        expect(resolveShapePartitionTask(equalShare, 'interpret-fraction')).toBeNull();
        expect(resolveShapePartitionTask(comparison, 'partition')).toBeNull();
        expect(resolveShapePartitionTask(fractionRegion, 'name-share')).toBeNull();
        expect(resolveShapePartitionTask({
            ...equalShare,
            parts: 6,
            unitFraction: '1/6'
        }, 'name-share')).toBeNull();
    });
});

describe('shape-partition model validation', () => {
    it('accepts every complete neutral model', () => {
        expect(isValidShapePartitionProblem(equalShare)).toBe(true);
        expect(isValidShapePartitionProblem(comparison)).toBe(true);
        expect(isValidShapePartitionProblem(fractionRegion)).toBe(true);
    });

    it('rejects inconsistent partitions, fractions, comparisons, and shapes', () => {
        expect(isValidShapePartitionProblem({
            ...equalShare,
            unitFraction: '1/3'
        })).toBe(false);
        expect(isValidShapePartitionProblem({
            ...fractionRegion,
            fraction: '4/6'
        })).toBe(false);
        expect(isValidShapePartitionProblem({
            ...comparison,
            lesserFraction: '1/2'
        } as unknown as ShapePartitionProblem)).toBe(false);
        expect(isValidShapePartitionProblem({
            ...equalShare,
            shape: 'triangle'
        } as unknown as ShapePartitionProblem)).toBe(false);
    });
});

describe('shape-partition presentation choices', () => {
    it('selects a valid share from the render seed', () => {
        expect(selectShareIndex(4, 0)).toBe(0);
        expect(selectShareIndex(4, 7)).toBe(3);
        expect(selectShareIndex(4, -7)).toBe(3);
    });

    it('uses the render seed to vary equivalent fourth terminology', () => {
        expect(selectShareName(2, 3)).toBe('half');
        expect(selectShareName(4, 2)).toBe('fourth');
        expect(selectShareName(4, 3)).toBe('quarter');
    });
});
