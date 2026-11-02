import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../../lib/random.ts';
import {IntegerRoundingGenerator} from './generator.ts';
import {integerRoundingQuantities, roundingDomain} from './domain.ts';
import {roundingPlaces} from './endpoint-profile.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';

describe('IntegerRoundingGenerator', () => {
    const generator = new IntegerRoundingGenerator();
    it('strictly validates configuration and canonical witnesses', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({range: createCanonicalNumericRange(1000), roundingMagnitude: Scope.StepsOf10})).toThrow('zeroEndpoint');
        expect(() => generator.generate({range: {min: 0, max: 1000}, roundingMagnitude: Scope.StepsOf10, zeroEndpoint: false} as never)).toThrow();
        expect(generator.generate({range: createCanonicalNumericRange(1000), roundingMagnitude: 'unsupported', zeroEndpoint: false} as never)).toBeNull();
        expect(generator.generate({range: createCanonicalNumericRange(1000), roundingMagnitude: Scope.StepsOf1000, zeroEndpoint: false})).toBeNull();
    });
    it('generates coherent required calculations in every canonical source cell and replays seeds', () => {
        for (const [roundingMagnitude, place] of roundingPlaces) for (const zeroEndpoint of [false, true]) {
            for (const {range} of canonicalRangeProfiles) {
                const domain = roundingDomain(place, zeroEndpoint, range);
                if (!domain.count) continue;
                const config = {range, roundingMagnitude, zeroEndpoint};
                for (const seed of [0, 17, 77]) {
                    setSeed(seed);
                    const first = generator.generate(config)!;
                    setSeed(seed);
                    expect(generator.generate(config)).toEqual(first);
                    const data = first.data;
                    expect(hasCanonicalRangeWitness(integerRoundingQuantities(data), range)).toBe(true);
                    expect(data.roundingPlace).toBe(place);
                    expect(data.number).toBeGreaterThan(data.lowerMultiple);
                    expect(data.number).toBeLessThan(data.upperMultiple);
                    expect(data.midpoint).toBe((data.lowerMultiple + data.upperMultiple) / 2);
                    expect(data.distanceLower).toBe(data.number - data.lowerMultiple);
                    expect(data.distanceUpper).toBe(data.upperMultiple - data.number);
                    expect(data.roundedValue).toBe(Math.round(data.number / place) * place);
                    expect(data.isMidpointTie).toBe(data.number === data.midpoint);
                    expect(data.lowerMultiple === 0).toBe(zeroEndpoint);
                    if ('task' in data) {
                        expect(data.number).toBeGreaterThanOrEqual(1000);
                        if (!data.isMidpointTie) expect(Math.abs(data.number - data.midpoint)).toBeGreaterThanOrEqual(Math.ceil(place * 0.05));
                    } else expect(data.number).toBeLessThan(1000);
                }
            }
        }
    });
});
