import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ShapeAttributeCountGenerator} from './generator.ts';

describe('shape attribute counts', () => {
    const generator = new ShapeAttributeCountGenerator();
    it.each(['vertices', 'angles'] as const)('constructs witnesses for %s constraints', attribute => {
        const seen = new Set<number>();
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generator.generate({attribute}).data;
            expect(data.requiredCount).toBe(data.corners);
            expect(data.sides).toBe(data.corners);
            seen.add(data.requiredCount);
        }
        expect([...seen].sort()).toEqual([3, 4, 5, 6]);
    });
    it('provides a cube for six equal square faces', () => {
        expect(generator.generate({attribute: 'equal-faces'}).data).toMatchObject({
            target: 'cube', requiredCount: 6, sides: 12, corners: 8
        });
    });
    it('rejects absent or invalid attributes', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({attribute: 'edges'} as never)).toThrow();
    });
});
