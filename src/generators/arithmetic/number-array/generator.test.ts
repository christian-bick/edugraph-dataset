import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {NumberArrayGenerator} from './generator.ts';

describe('NumberArrayGenerator', () => {
    const generator = new NumberArrayGenerator();

    it('validates its required configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it('generates rectangular arrays bounded by five rows and columns', () => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const data = generator.generate({requireIteratedOperation: false}).data;
            expect(data.rows).toBeGreaterThanOrEqual(2);
            expect(data.rows).toBeLessThanOrEqual(5);
            expect(data.columns).toBeGreaterThanOrEqual(2);
            expect(data.columns).toBeLessThanOrEqual(5);
            expect(data.total).toBe(data.rows * data.columns);
            expect(data.addends).toEqual(Array.from({length: data.rows}, () => data.columns));
        }
    });

    it('uses at least three equal addends for iterated-operation arrays', () => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const data = generator.generate({requireIteratedOperation: true}).data;
            expect(data.rows).toBeGreaterThanOrEqual(3);
            expect(data.addends).toHaveLength(data.rows);
            expect(new Set(data.addends)).toEqual(new Set([data.columns]));
        }
    });
});
