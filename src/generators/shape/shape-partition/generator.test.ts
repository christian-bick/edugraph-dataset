import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ShapePartitionGenerator} from './generator.ts';

describe('ShapePartitionGenerator', () => {
    const generator = new ShapePartitionGenerator();

    it('strictly validates shape configuration', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });

    it('generates halves and fourths for both supported shapes', () => {
        for (const shape of [Area.Circle, Area.Rectangle] as const) {
            const seen = new Set<number>();
            for (let seed = 0; seed < 30; seed++) {
                setSeed(seed);
                const stub = generator.generate({shape});
                expect(stub).not.toBeNull();
                expect(stub!.data.shape).toBe(shape === Area.Circle ? 'circle' : 'rectangle');
                expect([2, 4]).toContain(stub!.data.parts);
                seen.add(stub!.data.parts);
            }
            expect(seen).toEqual(new Set([2, 4]));
        }
    });
});
