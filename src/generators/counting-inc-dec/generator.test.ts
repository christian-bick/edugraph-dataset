import {beforeEach, describe, expect, it} from 'vitest';
import {CountingIncDecGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

import {Scope} from 'edugraph-ts';

describe('CountingIncDecGenerator', () => {
    let generator: CountingIncDecGenerator;

    beforeEach(() => {
        generator = new CountingIncDecGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should generate valid inc stubs with AdditiveCount label', () => {
        const input = { 
            labels: [Scope.AdditiveCount], 
            constraints: {} 
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 1);
    });

    it('should generate valid dec stubs with SubtractiveCount label', () => {
        const input = { 
            labels: [Scope.SubtractiveCount], 
            constraints: {} 
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('dec');
        expect(stub!.data.numObjects).toBeGreaterThan(1);
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects - 1);
    });

    it('should return null when attempting to decrement 1 object', () => {
        // If we set seed to a value that produces 0 or 1.
        // Let's just find one dynamically
        let foundNull = false;
        for (let i = 0; i < 100; i++) {
            setSeed(i);
            const input = { 
                labels: [Scope.SubtractiveCount], 
                constraints: {} 
            };
            const stub = generator.generate(input);
            if (stub === null) {
                foundNull = true;
                break;
            }
        }
        expect(foundNull).toBe(true);
    });
});
