import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {
    makeEighthUnitObservations, makeQuarterUnitObservations, makeWholeUnitObservations
} from '../measurement-data-helpers.ts';
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

    it.each([
        ['half', 2], ['quarter', 4], ['eighth', 8]
    ] as const)('generates exact %s-unit measurements under either frame selection', (numberKind, subdivisions) => {
        for (const unitScale of ['cm', 'in'] as const) {
            for (const useSingleFrame of [false, true] as const) for (let seed = 0; seed < 80; seed++) {
                const config = {numberKind, unitScale, useSingleFrame};
                setSeed(seed);
                const data = generator.generate(config).data;
                const ticks = data.observations.map(({value}) => value * subdivisions);
                const objects = data.observations.map(({object}) => object);
                expect(data.unit).toBe(unitScale);
                expect(data.subdivisions).toBe(subdivisions);
                expect(data.observations).toHaveLength(6);
                expect(new Set(objects).size).toBe(6);
                const minimum = numberKind === 'eighth' ? 1 : 2;
                const maximum = numberKind === 'eighth' ? 4 : 8;
                expect(ticks.every(value => Number.isInteger(value) && value >= minimum * subdivisions
                    && value <= maximum * subdivisions)).toBe(true);
                expect(ticks.some(value => value % 2 === 1)).toBe(true);
                if (numberKind === 'half') {
                    expect(new Set(ticks).size).toBeLessThan(6);
                    expect(ticks.some(value => value % 2 === 0)).toBe(true);
                }
                setSeed(seed);
                expect(generator.generate(config).data).toEqual(data);
                setSeed(seed);
                expect(generator.generate({...config, useSingleFrame: !useSingleFrame}).data).toEqual(data);
            }
        }
    });

    it.each([
        ['integer', false, 1, makeWholeUnitObservations],
        ['fraction', false, 4, makeQuarterUnitObservations],
        ['fraction', true, 8, makeEighthUnitObservations]
    ] as const)('keeps the legacy %s/%s observation draw and RNG continuation',
        (numberKind, useSingleFrame, subdivisions, sample) => {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const observations = sample();
                const continuation = getRandomState();
                setSeed(seed);
                const data = generator.generate({numberKind, unitScale: 'cm', useSingleFrame}).data;
                expect(data).toEqual({unit: 'cm', subdivisions, observations});
                expect(getRandomState()).toBe(continuation);
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
