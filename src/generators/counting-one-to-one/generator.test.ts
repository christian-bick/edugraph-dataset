import { describe, it, expect, beforeEach } from 'vitest';
import { CountingOneToOneGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('CountingOneToOneGenerator', () => {
    let generator: CountingOneToOneGenerator;

    beforeEach(() => {
        generator = new CountingOneToOneGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should generate valid one-to-one stubs', () => {
        const input = { 
            labels: [], 
            constraints: { mode: 'one-to-one', maxCount: 5 } 
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.mode).toBe('one-to-one');
        expect(stub!.data.numObjects).toBeLessThanOrEqual(5);
    });

    it('should return null for non-one-to-one modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'simple' }
        });
        expect(stub).toBeNull();
    });
});
