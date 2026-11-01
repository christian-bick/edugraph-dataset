import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {isUnitRateRelation} from '../../../visuals/views/ratio/ratio-language-presentation.ts';
import {UnitRateRelationsGenerator} from './generator.ts';
import {unitRateFramesForRange, unitRateRangeProfiles} from './numeric-domain.ts';

describe('UnitRateRelationsGenerator', () => {
    it('retains all original bounded ratio/scaling outcomes in both price and speed contexts', () => {
        const expected = new Set<string>();
        for (const context of ['price', 'speed']) for (const scale of [0.5, 2, 3]) {
            for (let first = 1; first <= Math.floor(99 / Math.max(1, scale)); first++) for (let second = 2; second <= 8; second++) {
                expected.add([context, first, second, scale].join(':'));
            }
        }
        const seen = new Set<string>();
        const generator = new UnitRateRelationsGenerator();
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const {range} of unitRateRangeProfiles) {
                const pool = unitRateFramesForRange(range);
                for (let index = 0; index < pool.length; index++) for (let context = 0; context < 2; context++) {
                    draw.mockClear().mockReturnValueOnce((context + 0.5) / 2).mockReturnValueOnce((index + 0.5) / pool.length);
                    const {data} = generator.generate({range});
                    expect(isUnitRateRelation(data)).toBe(true);
                    const number = (value: {numerator: number; denominator: number}) => value.numerator / value.denominator;
                    const key = [data.context, number(data.antecedent.value), number(data.consequent.value), number(data.scaleFactor)].join(':');
                    expect(seen.has(key)).toBe(false);
                    seen.add(key);
                    const values = [data.antecedent.value, data.consequent.value, data.unitRate,
                        data.scaleFactor, data.scaled.antecedent, data.scaled.consequent].map(number);
                    expect(hasCanonicalRangeWitness([...values, 1], range)).toBe(true);
                    expect(Math.max(...values)).toBeLessThanOrEqual(99);
                    expect(data.antecedent.unit).toBe(data.context === 'price' ? 'dollars' : 'kilometers');
                    expect(data.consequent.unit).toBe(data.context === 'price' ? 'kilograms' : 'hours');
                    expect(draw).toHaveBeenCalledTimes(2);
                }
            }
            expect(seen).toEqual(expected);
            expect(seen.size).toBe(2534);
        } finally { draw.mockRestore(); }
    }, 20000);

    it('rejects missing, malformed, noncanonical and unsupported profiles before sampling', () => {
        const generator = new UnitRateRelationsGenerator();
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const config of [null, {}, {range: null}, {range: {min: 0, max: 20}},
                {range: {...unitRateRangeProfiles[0]!.range, min: 5}}]) {
                expect(() => generator.generate(config as never)).toThrow();
            }
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });

    it('replays the same selected profile and random continuation', () => {
        const generator = new UnitRateRelationsGenerator();
        const config = {range: unitRateRangeProfiles.at(-1)!.range};
        rng.setSeed(99);
        const first = generator.generate(config), continuation = rng.random();
        rng.setSeed(99);
        expect(generator.generate(config)).toEqual(first);
        expect(rng.random()).toBe(continuation);
        const original = JSON.stringify(first);
        first.data.scaleFactor.numerator = 999;
        rng.setSeed(99);
        expect(JSON.stringify(generator.generate(config))).toBe(original);
    });
});
