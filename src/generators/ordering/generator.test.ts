import {beforeEach, describe, expect, it} from 'vitest';
import {OrderingGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

describe('OrderingGenerator', () => {
    let generator: OrderingGenerator;

    beforeEach(() => {
        generator = new OrderingGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('ordering');
    });

    describe('generate', () => {
        it('should generate valid problem stubs', () => {
            const configs = [
                { includeZero: true, allowNegatives: false, range: { min: 0, max: 10 } },
                { includeZero: false, allowNegatives: false, range: { min: 1, max: 10 } },
                { includeZero: true, allowNegatives: true, range: { min: 0, max: 10 } }
            ];
            configs.forEach(config => {
                const stub = generator.generate(config);
                expect(stub).not.toBeNull();
                expect(stub!.id).toBeDefined();
                expect(stub!.data.numbers).toBeInstanceOf(Array);
                expect(stub!.data.numbers.length).toBe(5);
                
                if (!config.includeZero) {
                    expect(stub!.data.numbers).not.toContain(0);
                }
                if (!config.allowNegatives) {
                    stub!.data.numbers.forEach((n: number) => expect(n).toBeGreaterThanOrEqual(0));
                }
                // Verify uniqueness in the set
                expect(new Set(stub!.data.numbers).size).toBe(5);
            });
        });

        it('should be deterministic with the same seed', () => {
            const config = { includeZero: true, allowNegatives: false, range: { min: 0, max: 10 } };
            setSeed(123);
            const stub1 = generator.generate(config);
            setSeed(123);
            const stub2 = generator.generate(config);
            expect(stub1).toEqual(stub2);
        });
    });
});
