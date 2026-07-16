import { describe, it, expect, beforeEach } from 'vitest';
import { CountingCardinalityGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('CountingCardinalityGenerator', () => {
    let generator: CountingCardinalityGenerator;

    beforeEach(() => {
        generator = new CountingCardinalityGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should generate valid cardinality stubs', () => {
        const input = { 
            labels: [], 
            constraints: { mode: 'cardinality', maxCount: 5 } 
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.numObjects).toBeLessThanOrEqual(5);
    });

    it('should return null for non-cardinality modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'simple' }
        });
        expect(stub).toBeNull();
    });
});
