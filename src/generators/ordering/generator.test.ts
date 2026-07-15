import { describe, it, expect, beforeEach } from 'vitest';
import { OrderingGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Scope } from 'edugraph-ts';

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
            const inputs = [
                { labels: [Scope.NumbersWithZero], constraints: { includesZero: true } },
                { labels: [Scope.NumbersWithoutZero], constraints: { includesZero: false } }
            ];
            inputs.forEach(input => {
                const stub = generator.generate(input);
                expect(stub).not.toBeNull();
                expect(stub!.id).toBeDefined();
                expect(stub!.data.numbers).toBeInstanceOf(Array);
                expect(stub!.data.numbers.length).toBe(5);
                
                const includesZero = input.labels.includes(Scope.NumbersWithZero) || 
                                   input.constraints.includesZero === true;
                if (!includesZero) {
                    expect(stub!.data.numbers).not.toContain(0);
                }
                // Verify uniqueness in the set
                expect(new Set(stub!.data.numbers).size).toBe(5);
            });
        });

        it('should be deterministic with the same seed', () => {
            const input = { labels: [Scope.NumbersWithZero], constraints: { includesZero: true } };
            setSeed(123);
            const stub1 = generator.generate(input);
            setSeed(123);
            const stub2 = generator.generate(input);
            expect(stub1).toEqual(stub2);
        });
    });
});
