import { describe, it, expect, beforeEach } from 'vitest';
import { CountingConservationGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('CountingConservationGenerator', () => {
    let generator: CountingConservationGenerator;

    beforeEach(() => {
        generator = new CountingConservationGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should validate conservation mode constraints and output', () => {
        const input = {
            labels: [],
            constraints: { mode: 'conservation', minCount: 5, maxCount: 12 }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.numObjects).toBeGreaterThanOrEqual(5);
            expect(stub!.data.numObjects).toBeLessThanOrEqual(12);
        }
    });

    it('should return null for non-conservation modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'simple' }
        });
        expect(stub).toBeNull();
    });
});
