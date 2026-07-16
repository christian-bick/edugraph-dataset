import { describe, it, expect, beforeEach } from 'vitest';
import { CountingGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('CountingGenerator', () => {
    let generator: CountingGenerator;

    beforeEach(() => {
        generator = new CountingGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should never return more than maxCount objects in simple mode', () => {
        const input = { 
            labels: [], 
            constraints: { maxCount: 5 } 
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            if (stub) {
                expect(stub.data.numObjects).toBeLessThanOrEqual(5);
            }
        }
    });

    it('should return null for non-simple modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'conservation' }
        });
        expect(stub).toBeNull();
    });
});
