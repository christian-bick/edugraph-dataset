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
        const config = { 
            range: { min: 0, max: 10 },
            direction: Scope.AdditiveCount
        };
        const stub = generator.generate(config);
        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 1);
    });

    it('should generate valid dec stubs with SubtractiveCount label', () => {
        const config = { 
            range: { min: 0, max: 10 },
            direction: Scope.SubtractiveCount
        };
        const stub = generator.generate(config);
        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('dec');
        expect(stub!.data.numObjects).toBeGreaterThan(1);
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects - 1);
    });

    it('should fallback to random direction when direction is not specified', () => {
        const config = { range: { min: 2, max: 10 } };
        let hasInc = false;
        let hasDec = false;
        for (let i = 0; i < 20; i++) {
            setSeed(i);
            const stub = generator.generate(config);
            if (stub?.data.incDecType === 'inc') hasInc = true;
            if (stub?.data.incDecType === 'dec') hasDec = true;
        }
        expect(hasInc).toBe(true);
        expect(hasDec).toBe(true);
    });

    it('should return null when attempting to decrement 1 object', () => {
        // If we set seed to a value that produces 0 or 1.
        // Let's just find one dynamically
        let foundNull = false;
        for (let i = 0; i < 100; i++) {
            setSeed(i);
            const config = { 
                range: { min: 0, max: 10 },
                direction: Scope.SubtractiveCount
            };
            const stub = generator.generate(config);
            if (stub === null) {
                foundNull = true;
                break;
            }
        }
        expect(foundNull).toBe(true);
    });
});
