import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {fractionProductDomain, fractionProductProfiles, fractionProductUpperBounds} from '../fraction-product-domain.ts';
import {FractionProductRelationsGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
describe('fraction-product equal-parts relations', () => {
    it.each(fractionProductProfiles)('%s selects only native mathematics inside its resolved range', productProfile => {
        const generator = new FractionProductRelationsGenerator(), random = vi.spyOn(rng, 'random');
        for (const upper of fractionProductUpperBounds('relation', productProfile)) {
            const range = createCanonicalNumericRange(upper), rows = fractionProductDomain('relation', productProfile, range);
            for (const [draw, expected] of [[0, rows[0]!], [1 - Number.EPSILON, rows.at(-1)!]] as const) {
                for (const material of [0.25, 0.75]) {
                    random.mockReturnValueOnce(draw).mockReturnValueOnce(material);
                    const stub = generator.generate({productProfile, range}), data = stub.data;
                    expect(Object.keys(stub)).toEqual(['data']);
                    expect(data.kind).toBe('fraction-product-relation');
                    expect(data.multiplier).toEqual(expected.multiplier);
                    expect(data.quantity).toEqual(expected.quantity);
                    expect(data.partition).not.toHaveProperty('scaledQuantity');
                    expect(data).not.toHaveProperty('weight');
                    expect(data.context).toEqual({material: material < 0.5 ? 'ribbon' : 'rope', measureUnit: 'meter'});
                    const {numerator: a, denominator: b} = data.multiplierValue, {numerator: q, denominator: c} = data.quantityValue;
                    expect(data.product).toEqual({numerator: a * q, denominator: b * c});
                    expect(data.partition).toEqual({equalPartsPerCopy: b, selectedPartCount: a, copyCount: Math.ceil(a / b),
                        availablePartCount: Math.ceil(a / b) * b, onePartValue: {numerator: q, denominator: b * c}});
                    expect(data.equationWitness !== undefined).toBe(!productProfile.startsWith('fraction-partition-'));
                    const maximum = Math.max(a / b, q / c, a * q / (b * c), q / (b * c), a, b, Math.ceil(a / b));
                    expect(maximum).toBeGreaterThan(range.maximumAbove);
                    expect(maximum).toBeLessThanOrEqual(range.max);
                }
            }
        }
    });

    it('replays exactly and rejects incomplete or infeasible configuration', () => {
        const generator = new FractionProductRelationsGenerator();
        const config = {productProfile: 'mixed-equation', range: createCanonicalNumericRange(10)} as const;
        rng.setSeed(47); const expected = generator.generate(config), state = rng.getRandomState();
        rng.setSeed(47); expect(generator.generate(config)).toEqual(expected); expect(rng.getRandomState()).toBe(state);
        for (const candidate of [undefined, null, {}, {productProfile: config.productProfile}, {range: config.range},
            {...config, productProfile: 'unknown'}, {...config, range: createCanonicalNumericRange(100)},
            {...config, range: {...config.range, maximumAbove: -1}}]) expect(() => generator.generate(candidate as never)).toThrow();
    });
});
