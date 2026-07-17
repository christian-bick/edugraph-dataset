import {beforeEach, describe, expect, it} from 'vitest';
import {ComparisonGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Scope} from 'edugraph-ts';

describe('ComparisonGenerator', () => {
    let generator: ComparisonGenerator;

    beforeEach(() => {
        generator = new ComparisonGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('comparison');
    });

    it('should respect resolved ranges', () => {
        for (let i = 0; i < 100; i++) {
            const stub = generator.generate({ 
                range: { min: 0, max: 10 },
                wantsGreater: false,
                wantsLess: false,
                wantsEqual: false
            });
            if (stub) {
                expect(stub.data.num1).toBeGreaterThanOrEqual(0);
                expect(stub.data.num1).toBeLessThanOrEqual(10);
                expect(stub.data.num2).toBeGreaterThanOrEqual(0);
                expect(stub.data.num2).toBeLessThanOrEqual(10);
                expect(['<', '>', '=']).toContain(stub.data.answer);
            }
        }
    });

    it('should respect greater constraint', () => {
        const config = {
            range: { min: 0, max: 20 },
            wantsGreater: true,
            wantsLess: false,
            wantsEqual: false
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeGreaterThan(stub!.data.num2);
            expect(stub!.data.answer).toBe('>');
        }
    });

    it('should respect less constraint', () => {
        const config = {
            range: { min: 0, max: 20 },
            wantsGreater: false,
            wantsLess: true,
            wantsEqual: false
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBeLessThan(stub!.data.num2);
            expect(stub!.data.answer).toBe('<');
        }
    });

    it('should respect equal constraint', () => {
        const config = {
            range: { min: 0, max: 20 },
            wantsGreater: false,
            wantsLess: false,
            wantsEqual: true
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toEqual(stub!.data.num2);
            expect(stub!.data.answer).toBe('=');
        }
    });
});
