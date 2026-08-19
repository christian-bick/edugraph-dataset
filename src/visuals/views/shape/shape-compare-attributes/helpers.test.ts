import {describe, expect, it} from 'vitest';
import {ShapeCompareAttributesProblem} from '../../../../types/problems.ts';
import {comparisonAppearances, validateShapeComparison} from './helpers.ts';

const validData: ShapeCompareAttributesProblem = {
    dimension: '3d',
    attribute: 'edges',
    shapes: [
        {shape: 'cube', count: 12},
        {shape: 'cylinder', count: 2}
    ],
    relation: 'more',
    answer: 'cube',
    prompt: 'Which shape has more edges?',
    evidence: [
        'Cube has 12 edges.',
        'Cylinder has 2 edges.',
        '12 > 2, so Cube has more edges.'
    ]
};

describe('shape comparison helpers', () => {
    it('derives deterministic and observably different appearances from the render seed', () => {
        for (let seed = 0; seed < 100; seed++) {
            expect(comparisonAppearances(seed)).toEqual(comparisonAppearances(seed));
            const [first, second] = comparisonAppearances(seed);
            expect(first.rotation).not.toBe(second.rotation);
            expect(first.scale).not.toBe(second.scale);
            expect(first.color).not.toBe(second.color);
        }
    });

    it('accepts a coherent authored three-dimensional comparison', () => {
        expect(() => validateShapeComparison(validData)).not.toThrow();
    });

    it.each([
        {...validData, dimension: '2d'},
        {...validData, attribute: 'sides'},
        {...validData, shapes: [{shape: 'cube', count: 12}, {shape: 'cube', count: 12}]},
        {...validData, shapes: [{shape: 'cube', count: 2}, {shape: 'cylinder', count: 2}]},
        {...validData, answer: 'cylinder'},
        {...validData, evidence: ['Cube has edges.']}
    ])('rejects inconsistent payload %#', data => {
        expect(() => validateShapeComparison(data as ShapeCompareAttributesProblem)).toThrow();
    });
});
