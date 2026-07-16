import { describe, it, expect, beforeEach } from 'vitest';
import { CountingClassifyCountGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('CountingClassifyCountGenerator', () => {
    let generator: CountingClassifyCountGenerator;

    beforeEach(() => {
        generator = new CountingClassifyCountGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should validate classify-count items and categories logic', () => {
        const input = {
            labels: [],
            constraints: { minTotal: 6, maxTotal: 10, classifyType: 'shape' }
        };
        for (let i = 0; i < 20; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.classifyType).toBe('shape');
            expect(stub!.data.items.length).toBeGreaterThanOrEqual(6);
            expect(stub!.data.items.length).toBeLessThanOrEqual(10);
            
            const cats = stub!.data.categories;
            const total = (cats.circle || 0) + (cats.square || 0) + (cats.triangle || 0);
            expect(total).toBe(stub!.data.items.length);
        }
    });
});
