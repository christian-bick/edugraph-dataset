import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {rational} from '../../ratio/helpers.ts';
import {isUnitDimensionRelation} from '../../../visuals/views/measure/measurement-ratio-presentation.ts';
import {UnitDimensionRelationsGenerator} from './generator.ts';
import {dimensionRelationCaseCount, dimensionRelationFrameAt, dimensionRelationRangeProfiles} from './numeric-domain.ts';

const signatures = {
    multiplication: ['1,0,0|1,0,0', '1,-1,0|0,1,0', '0,-1,1|0,1,0', '-3,0,1|3,0,0'],
    division: ['1,0,0|0,1,0', '2,0,0|1,0,0', '1,0,0|1,0,0', '1,-1,0|1,-1,0', '0,0,1|0,1,0', '0,0,1|-3,0,1']
};
const fractionKey = (value: {numerator: number; denominator: number}) => `${value.numerator}/${value.denominator}`;

describe('UnitDimensionRelationsGenerator', () => {
    it('preserves every original unit-pair and rational draw, counting identity1 only for required cancellation', () => {
        const expected = new Map<string, number>(), seen = new Map<string, number>();
        for (const operation of ['multiplication', 'division'] as const) for (const units of signatures[operation]) {
            for (let ln = 1; ln <= 12; ln++) for (let ld = 1; ld <= 4; ld++) for (let rn = 1; rn <= 12; rn++) for (let rd = 1; rd <= 4; rd++) {
                const key = [operation, units, fractionKey(rational(ln, ld)), fractionKey(rational(rn, rd))].join(':');
                expected.set(key, (expected.get(key) ?? 0) + 1);
            }
        }
        const generator = new UnitDimensionRelationsGenerator(), draw = vi.spyOn(rng, 'random');
        let cases = 0;
        try {
            for (const operation of ['multiplication', 'division'] as const) for (const {range} of dimensionRelationRangeProfiles) {
                const count = dimensionRelationCaseCount(operation, range);
                for (let index = 0; index < count; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / count);
                    const {data} = generator.generate({operation, range});
                    expect(isUnitDimensionRelation(data)).toBe(true);
                    const signature = [data.left.units, data.right.units].map(unit => [unit.m, unit.s, unit.kg].join(',')).join('|');
                    const key = [operation, signature, fractionKey(data.left.value), fractionKey(data.right.value)].join(':');
                    seen.set(key, (seen.get(key) ?? 0) + 1);
                    const values = [data.left.value, data.right.value, data.result.value].map(value => value.numerator / value.denominator);
                    expect(hasCanonicalRangeWitness([...values, ...(data.cancellations.length ? [1] : [])], range),
                        JSON.stringify({key, range, values, cancellations: data.cancellations})).toBe(true);
                    if (range.min > 0) {
                        expect(operation).toBe('multiplication');
                        expect(signature).toBe('1,0,0|1,0,0');
                        expect(data.cancellations).toEqual([]);
                    }
                    expect(draw).toHaveBeenCalledTimes(1);
                    cases++;
                }
            }
            expect(seen).toEqual(expected);
            expect(cases).toBe(23040);
        } finally { draw.mockRestore(); }
    }, 30000);

    it('rejects absent, invalid and infeasible configurations or case indices before drawing', () => {
        const generator = new UnitDimensionRelationsGenerator(), draw = vi.spyOn(rng, 'random');
        const range = dimensionRelationRangeProfiles[0]!.range;
        try {
            for (const config of [null, {}, {operation: null}, {operation: ''}, {operation: 'addition'},
                {operation: 'division'}, {operation: 'division', range: {min: 0, max: 5}},
                {operation: 'division', range: dimensionRelationRangeProfiles.at(-1)!.range}]) {
                expect(() => generator.generate(config as never)).toThrow();
            }
            expect(dimensionRelationCaseCount('addition', range)).toBe(0);
            for (const index of [-1, 0.5, dimensionRelationCaseCount('division', range)]) {
                expect(() => dimensionRelationFrameAt('division', range, index)).toThrow();
            }
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });

    it('replays values and continuation while isolating mutable output from the domain', () => {
        const generator = new UnitDimensionRelationsGenerator();
        const config = {operation: 'division', range: dimensionRelationRangeProfiles[0]!.range} as const;
        rng.setSeed(456);
        const first = generator.generate(config), continuation = rng.random();
        rng.setSeed(456);
        expect(generator.generate(config)).toEqual(first);
        expect(rng.random()).toBe(continuation);
        const original = JSON.stringify(first);
        first.data.left.units.m = 99;
        first.data.left.value.numerator = 999;
        rng.setSeed(456);
        expect(JSON.stringify(generator.generate(config))).toBe(original);
    });
});
