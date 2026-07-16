import { describe, it, expect, beforeEach } from 'vitest';
import { ComparisonGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Scope } from 'edugraph-ts';

describe('ComparisonGenerator', () => {
    let generator: ComparisonGenerator;

    beforeEach(() => {
        generator = new ComparisonGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('comparison');
    });

    it('should be deterministic with the same seed', () => {
        const input = { labels: [], constraints: {} };
        setSeed(123);
        const stub1 = generator.generate(input);
        setSeed(123);
        const stub2 = generator.generate(input);
        expect(stub1).toEqual(stub2);
    });

    it('should return null if numbers are equal', () => {
        for (let i = 0; i < 100; i++) {
            const stub = generator.generate({ 
                labels: [Scope.NumbersSmaller10], 
                constraints: { digits: 1 } 
            });
            if (stub) {
                expect(stub.data.num1).not.toEqual(stub.data.num2);
            }
        }
    });

    it('should return null for non-numeric modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'matching' }
        });
        expect(stub).toBeNull();
    });
});
