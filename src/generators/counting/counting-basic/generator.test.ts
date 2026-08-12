import {beforeEach, describe, expect, it} from 'vitest';
import {CountingBasicGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';

describe('CountingBasicGenerator', () => {
    let generator: CountingBasicGenerator;

    beforeEach(() => {
        generator = new CountingBasicGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should throw validation error when range is missing', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });

    it('should respect resolved ranges from labels', () => {
        const config = { 
            range: { min: 0, max: 10 },
            parity: 'any' as const
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            if (stub) {
                expect(stub.data.numObjects).toBeGreaterThanOrEqual(0);
                expect(stub.data.numObjects).toBeLessThanOrEqual(10);
            }
        }
    });

    it('should generate valid stubs', () => {
        const config = { 
            range: { min: 0, max: 10 },
            parity: 'any' as const
        };
        const stub = generator.generate(config);
        expect(stub).not.toBeNull();
        expect(stub!.data.numObjects).toBeDefined();
    });

    it('generates only the requested parity and exposes it in the payload', () => {
        for (const parity of ['even', 'odd'] as const) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generator.generate({range: {min: 1, max: 20}, parity});
                expect(stub).not.toBeNull();
                expect(stub!.data.numObjects % 2).toBe(parity === 'even' ? 0 : 1);
                expect(stub!.data.parity).toBe(parity);
            }
        }
    });

    it('returns null when the requested parity has no value in range', () => {
        expect(generator.generate({range: {min: 1, max: 1}, parity: 'even'})).toBeNull();
    });



});
