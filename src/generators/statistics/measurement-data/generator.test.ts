import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementDataGenerator} from './generator.ts';

describe('MeasurementDataGenerator', () => {
    const generator = new MeasurementDataGenerator();

    it.each(['cm', 'in'] as const)('generates whole-unit observations in %s', unitScale => {
        for (let seed = 0; seed < 80; seed++) {
            setSeed(seed);
            const data = generator.generate({numberKind: 'integer', unitScale, useSingleFrame: false}).data;
            expect(data.unit).toBe(unitScale);
            expect(data.subdivisions).toBe(1);
            expect(data.observations).toHaveLength(6);
            expect(new Set(data.observations.map(({object}) => object)).size).toBe(6);
            expect(data.observations.every(({value}) => Number.isInteger(value) && value >= 2 && value <= 10)).toBe(true);
        }
    });

    it.each(['cm', 'in'] as const)('preserves fractional observations and replay in %s', unitScale => {
        for (const useSingleFrame of [false, true]) for (let seed = 0; seed < 80; seed++) {
            const config = {numberKind: 'fraction', unitScale, useSingleFrame} as const;
            setSeed(seed);
            const data = generator.generate(config).data;
            const subdivisions = useSingleFrame ? 8 : 4;
            const ticks = data.observations.map(({value}) => value * subdivisions);
            expect(data.subdivisions).toBe(subdivisions);
            expect(data.unit).toBe(unitScale);
            expect(ticks.every(Number.isInteger)).toBe(true);
            expect(ticks.every(value => value >= 8 && value <= 32)).toBe(true);
            expect(ticks.some(value => value % subdivisions === 1)).toBe(true);
            expect(ticks.some(value => value % subdivisions === subdivisions / 2)).toBe(true);
            if (useSingleFrame) expect(new Set(ticks).size).toBeLessThan(6);
            setSeed(seed);
            expect(generator.generate(config).data).toEqual(data);
        }
    });

    it('rejects absent, invalid, and incompatible configuration', () => {
        const valid = {numberKind: 'integer', unitScale: 'cm', useSingleFrame: false} as const;
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate(null as never)).toThrow();
        for (const invalid of [
            {...valid, numberKind: 'complex'}, {...valid, unitScale: 'm'},
            {...valid, useSingleFrame: 'yes'}, {...valid, useSingleFrame: true}
        ]) expect(() => generator.generate(invalid as never)).toThrow();
    });
});
