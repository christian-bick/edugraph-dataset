import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {PowerTenDecimalValue} from '../../../types/problems.ts';
import {DecimalPowerTenScalingGenerator} from './generator.ts';

const generator = new DecimalPowerTenScalingGenerator();

const inThousandths = (value: PowerTenDecimalValue): number =>
    value.unscaled * 10 ** (3 - value.scale);

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
});
