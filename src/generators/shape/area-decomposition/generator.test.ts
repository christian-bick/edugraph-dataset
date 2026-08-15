import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {AreaDecompositionGenerator} from './generator.ts';

const generator = new AreaDecompositionGenerator();

describe('AreaDecompositionGenerator', () => {
    it('produces a consistent split rectangle', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;

            expect(data.height).toBeGreaterThanOrEqual(2);
            expect(data.height).toBeLessThanOrEqual(5);
            expect(data.leftWidth).toBeGreaterThanOrEqual(2);
            expect(data.rightWidth).toBeGreaterThanOrEqual(2);
            expect(data.totalWidth).toBe(data.leftWidth + data.rightWidth);
            expect(data.leftArea).toBe(data.height * data.leftWidth);
            expect(data.rightArea).toBe(data.height * data.rightWidth);
            expect(data.totalArea).toBe(data.leftArea + data.rightArea);
            expect(data.totalArea).toBe(data.height * data.totalWidth);
        }
    });

    it('is deterministic for a fixed seed', () => {
        setSeed(27);
        const first = generator.generate({});
        setSeed(27);
        expect(generator.generate({})).toEqual(first);
    });
});
