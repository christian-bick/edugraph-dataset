import {beforeEach, describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {StatisticalGraphsGenerator} from './generator.ts';

describe('StatisticalGraphsGenerator', () => {
    const generator = new StatisticalGraphsGenerator();
    beforeEach(() => setSeed(42));

    it('generates three distinct positive whole-number category counts', () => {
        const problem = generator.generate({useAddition: false, useSubtraction: false, useTwoOperands: false});
        expect(problem.data.categories).toHaveLength(3);
        expect(new Set(problem.data.categories.map(({count}) => count)).size).toBe(3);
        for (const {count} of problem.data.categories) {
            expect(Number.isInteger(count)).toBe(true);
            expect(count).toBeGreaterThanOrEqual(2);
            expect(count).toBeLessThanOrEqual(8);
        }
        expect(problem.data.operation).toBeUndefined();
    });

    it.each([
        [true, false, 'addition'],
        [false, true, 'subtraction']
    ] as const)('generates a coherent %s graph question', (useAddition, useSubtraction, operation) => {
        const data = generator.generate({useAddition, useSubtraction, useTwoOperands: true}).data;
        const [firstIndex, secondIndex] = data.operandIndices!;
        const first = data.categories[firstIndex].count;
        const second = data.categories[secondIndex].count;

        expect(data.operation).toBe(operation);
        expect(data.answer).toBe(operation === 'addition' ? first + second : first - second);
        if (operation === 'subtraction') expect(first).toBeGreaterThan(second);
    });

    it('rejects contradictory configurations', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({useAddition: true, useSubtraction: true, useTwoOperands: true})).toThrow();
        expect(() => generator.generate({useAddition: true, useSubtraction: false, useTwoOperands: false})).toThrow();
        expect(() => generator.generate({useAddition: false, useSubtraction: false, useTwoOperands: true})).toThrow();
    });
});
