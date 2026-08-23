import {describe, expect, it} from 'vitest';
import {getMeasurementRelationWord, getWeightLayout, resolveMeasurementComparison} from './helpers.ts';

describe('measure-compare helpers', () => {
    it('calculates layout correctly when left is heavier', () => {
        const layout = getWeightLayout(8, 4);
        expect(layout.leftBeamY).toBe(105);
        expect(layout.rightBeamY).toBe(75);
        expect(layout.leftPanY).toBe(135);
        expect(layout.rightPanY).toBe(105);
    });

    it('calculates layout correctly when right is heavier', () => {
        const layout = getWeightLayout(3, 7);
        expect(layout.leftBeamY).toBe(75);
        expect(layout.rightBeamY).toBe(105);
        expect(layout.leftPanY).toBe(105);
        expect(layout.rightPanY).toBe(135);
    });

    it.each([
        ['greater', 0, {val1: 3, val2: 8, answer: 'B'}],
        ['greater', 1, {val1: 8, val2: 3, answer: 'A'}],
        ['less', 0, {val1: 3, val2: 8, answer: 'A'}],
        ['less', 1, {val1: 8, val2: 3, answer: 'B'}]
    ] as const)('seeds A/B placement and derives the %s answer', (relation, seed, expected) => {
        expect(resolveMeasurementComparison({
            attribute: 'length',
            relation,
            magnitudes: {smaller: 3, larger: 8}
        }, seed)).toEqual(expected);
    });

    it.each([
        ['length', 'greater', 'longer'],
        ['length', 'less', 'shorter'],
        ['weight', 'greater', 'heavier'],
        ['weight', 'less', 'lighter']
    ] as const)('derives %s/%s display wording', (attribute, relation, expected) => {
        expect(getMeasurementRelationWord({attribute, relation})).toBe(expected);
    });

    it('normalizes fractional and negative seeds deterministically', () => {
        const data = {
            attribute: 'weight',
            relation: 'greater',
            magnitudes: {smaller: 2, larger: 9}
        } as const;
        expect(resolveMeasurementComparison(data, -3.9)).toEqual(resolveMeasurementComparison(data, 3));
    });
});
