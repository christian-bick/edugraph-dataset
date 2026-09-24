import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {NumbersPrimeClassificationGenerator} from './generator.ts';

describe('NumbersPrimeClassificationGenerator', () => {
    const generator = new NumbersPrimeClassificationGenerator();

    it('generates complete, consistent numbers-prime-classification evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({})!.data;
            expect(data.classification).toBe('prime');
            expect(data.number).toBeGreaterThan(1);
            expect(data.number).toBeLessThan(100);
            expect(data.factors).toEqual(Array.from({length: data.number}, (_, i) => i + 1).filter(factor => data.number % factor === 0));
            expect(data.factorCount).toBe(data.factors.length);
            expect(data.factorCount).toBe(2);
        }
    });

    it('is deterministic for a seed and configuration', () => {
        setSeed('numbers-prime-classification');
        const first = generator.generate({});
        setSeed('numbers-prime-classification');
        expect(generator.generate({})).toEqual(first);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();

    });

});
