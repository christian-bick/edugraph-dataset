import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {RatioRelationsGenerator} from './generator.ts';

const generator = new RatioRelationsGenerator();

describe('RatioRelationsGenerator', () => {
    it('requires the resolved mathematical range', () => {
        for (const config of [null, {}, {range: null}, {range: {}}, {range: {min: 1, max: 20}}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it.each([20, 100])('preserves ordered named quantities strictly below %s', max => {
        const contexts = new Set<string>();
        const values = new Set<number>();
        for (let seed = 0; seed < 120; seed++) {
            setSeed(seed);
            const {data} = generator.generate({range: {min: 0, max}});
            expect(data.kind).toBe('ratio-relation');
            expect(data.antecedent.name).not.toBe(data.consequent.name);
            for (const quantity of [data.antecedent, data.consequent]) {
                expect(quantity.name).not.toBe('');
                expect(quantity.unit).not.toBe('');
                expect(quantity.value.denominator).toBe(1);
                expect(quantity.value.numerator).toBeGreaterThan(0);
                expect(quantity.value.numerator).toBeLessThan(max);
                values.add(quantity.value.numerator);
            }
            contexts.add(data.antecedent.name);
            expect(Object.keys(data).sort()).toEqual(['antecedent', 'consequent', 'kind']);
        }
        expect(contexts.size).toBe(4);
        expect(Math.max(...values)).toBeGreaterThan(max / 2);
    });

    it('replays an identical mathematical relation from a seed', () => {
        setSeed(72);
        const first = generator.generate({range: {min: 0, max: 100}});
        setSeed(72);
        expect(generator.generate({range: {min: 0, max: 100}})).toEqual(first);
    });
});
