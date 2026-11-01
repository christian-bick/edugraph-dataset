import {afterEach, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import type {PowerTenDecimalValue} from '../../../types/problems.ts';
import {DecimalPowerTenScalingGenerator} from './generator.ts';

const generator = new DecimalPowerTenScalingGenerator();

const inThousandths = (value: PowerTenDecimalValue): number =>
    value.unscaled * 10 ** (3 - value.scale);

afterEach(() => vi.restoreAllMocks());

describe('DecimalPowerTenScalingGenerator', () => {
    it('requires its selected operation', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate(null as never)).toThrow();
    });

    it.each(['multiplication', 'division'] as const)(
        'builds an exact 10^0, 10^1, 10^2 %s pattern with digit-place witnesses',
        operation => {
            for (let seed = 0; seed < 80; seed++) {
                setSeed(seed);
                const {data} = generator.generate({operation});
                expect(data.kind).toBe('decimal-power-ten-scaling');
                expect(data.operation).toBe(operation);
                expect(data.series.map(step => step.power.exponent)).toEqual([0, 1, 2]);
                expect(data.series.map(step => step.power.repeatedFactors)).toEqual([
                    [], [10], [10, 10]
                ]);
                expect(data.series.map(step => step.before)).toEqual([
                    data.series[0].before, data.series[0].before, data.series[0].before
                ]);
                expect(data.series.map(step => step.crossesUnitsPlace)).toEqual([
                    false, true, true
                ]);

                for (const step of data.series) {
                    const before = inThousandths(step.before);
                    const after = inThousandths(step.after);
                    expect(operation === 'multiplication'
                        ? after : before).toBe((operation === 'multiplication'
                        ? before : after) * step.power.value);
                    expect(step.before.numeral).toMatch(/^\d+\.\d+$/);
                    expect(step.after.numeral).toMatch(/^\d+(?:\.\d+)?$/);
                    expect(step.placeShifts).toHaveLength(2);
                    expect(step.placeShifts.map(shift => shift.digit)).toEqual(
                        String(step.before.unscaled).split('').map(Number)
                    );
                    const shift = operation === 'multiplication'
                        ? step.power.exponent : -step.power.exponent;
                    expect(step.placeShifts.every(place =>
                        place.resultPlaceExponent - place.originalPlaceExponent === shift
                    )).toBe(true);
                    expect(step.placeShifts.reduce((sum, place) =>
                        sum + inThousandths(place.originalContribution), 0)).toBe(before);
                    expect(step.placeShifts.reduce((sum, place) =>
                        sum + inThousandths(place.resultContribution), 0)).toBe(after);
                }
                expect(data).not.toHaveProperty('prompt');
                expect(data).not.toHaveProperty('explanation');
                expect(data).not.toHaveProperty('blank');
            }
        }
    );

    it('replays a selected operation under the same seed', () => {
        setSeed('decimal-ten-replay');
        const first = generator.generate({operation: 'division'});
        setSeed('decimal-ten-replay');
        expect(generator.generate({operation: 'division'})).toEqual(first);
    });

    it('witnesses canonical upper100 without a positive lower across all 162 supported cases', () => {
        const draw = vi.spyOn(rng, 'random');
        const range = createCanonicalNumericRange(100);
        const numeric = (value: PowerTenDecimalValue) => value.unscaled / 10 ** value.scale;
        const seen = new Set<string>();
        for (const operation of ['multiplication', 'division'] as const) {
            for (let tens = 1; tens <= 9; tens++) for (let ones = 1; ones <= 9; ones++) {
                draw.mockReturnValueOnce((tens - 0.5) / 9).mockReturnValueOnce((ones - 0.5) / 9);
                const {data} = generator.generate({operation});
                expect(data.series[0].before.unscaled).toBe(10 * tens + ones);
                const values = data.series.flatMap(step => [
                    numeric(step.before), numeric(step.after), step.power.value,
                    ...step.power.repeatedFactors,
                    ...step.placeShifts.flatMap(place => [
                        numeric(place.originalContribution), numeric(place.resultContribution)
                    ])
                ]);
                expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                expect(Math.max(...values)).toBe(100);
                expect(Math.min(...values)).toBeLessThan(5);
                seen.add(`${operation}:${data.series[0].before.unscaled}`);
            }
        }
        expect(seen.size).toBe(162);
        expect(draw).toHaveBeenCalledTimes(324);
    });
});
