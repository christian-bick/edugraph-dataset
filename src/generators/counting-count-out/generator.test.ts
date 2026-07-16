import { describe, it, expect, beforeEach } from 'vitest';
import { CountingCountOutGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('CountingCountOutGenerator', () => {
    let generator: CountingCountOutGenerator;

    beforeEach(() => {
        generator = new CountingCountOutGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should validate count-out mode totalCount bounds', () => {
        const input = {
            labels: [],
            constraints: { mode: 'count-out', count: 7, totalCount: 12 }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.mode).toBe('count-out');
        expect(stub!.data.numObjects).toBe(7);
        expect(stub!.data.totalCount).toBe(12);
    });

    it('should return null for non-count-out modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'simple' }
        });
        expect(stub).toBeNull();
    });
});
