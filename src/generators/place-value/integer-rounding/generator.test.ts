import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {IntegerRoundingGenerator} from './generator.ts';

describe('IntegerRoundingGenerator', () => {
    const generator = new IntegerRoundingGenerator();

    it('strictly validates configuration', () => {
        expect(() => generator.generate({})).toThrow();
    });

    it.each([
        [Scope.StepsOf10, 10],
        [Scope.StepsOf100, 100]
    ] as const)('rounds using %s', (roundingMagnitude, roundingPlace) => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({
                range: {min: 0, max: 1000},
                roundingMagnitude
            })!.data;

            expect(data.roundingPlace).toBe(roundingPlace);
            expect(data.number).toBeGreaterThan(data.lowerMultiple);
            expect(data.number).toBeLessThan(data.upperMultiple);
            expect(data.midpoint).toBe((data.lowerMultiple + data.upperMultiple) / 2);
            expect(data.distanceLower).toBe(data.number - data.lowerMultiple);
            expect(data.distanceUpper).toBe(data.upperMultiple - data.number);
            expect(data.roundedValue).toBe(Math.round(data.number / roundingPlace) * roundingPlace);
            expect(data.isMidpointTie).toBe(data.number === data.midpoint);
        }
    });

    it('returns null for unsupported magnitudes and unusable ranges', () => {
        expect(generator.generate({
            range: {min: 0, max: 1000},
            roundingMagnitude: 'unsupported'
        } as never)).toBeNull();
        expect(generator.generate({
            range: {min: 995, max: 1000},
            roundingMagnitude: Scope.StepsOf100
        })).toBeNull();
    });
});
