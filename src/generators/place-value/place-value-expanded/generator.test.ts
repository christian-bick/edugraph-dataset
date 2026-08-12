import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueExpandedGenerator} from './generator.ts';

describe('PlaceValueExpandedGenerator', () => {
    const generator = new PlaceValueExpandedGenerator();

    it('strictly validates its configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it.each([
        [Scope.TwoOperands, 2],
        [Scope.ThreeOperands, 3]
    ] as const)('generates %s expanded forms', (operandCardinality, expectedLength) => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const data = generator.generate({
                range: {min: 100, max: 1000},
                operandCardinality
            })!.data;
            expect(data.number).toBeGreaterThanOrEqual(100);
            expect(data.number).toBeLessThanOrEqual(999);
            expect(data.terms).toHaveLength(expectedLength);
            expect(data.terms.reduce((sum, term) => sum + term, 0)).toBe(data.number);
            expect(data.terms.every(term => term > 0)).toBe(true);
        }
    });
});
