import { describe, it, expect, beforeEach } from 'vitest';
import { CountingIncDecGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('CountingIncDecGenerator', () => {
    let generator: CountingIncDecGenerator;

    beforeEach(() => {
        generator = new CountingIncDecGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should return null when attempting to decrement 1 object', () => {
        const input = { 
            labels: [], 
            constraints: { type: 'dec', maxCount: 1 } 
        };
        const stub = generator.generate(input);
        expect(stub).toBeNull();
    });

    it('should generate valid inc-dec stubs', () => {
        const input = { 
            labels: [], 
            constraints: { type: 'inc', count: 5 } 
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.mode).toBe('simple');
        expect(stub!.data.numObjects).toBe(5);
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.incDecAnswer).toBe(6);
    });

    it('should return null for non-inc-dec inputs', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'simple' } // no type constraint
        });
        expect(stub).toBeNull();
    });
});
