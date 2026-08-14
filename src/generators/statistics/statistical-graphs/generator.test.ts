import {Scope} from 'edugraph-ts';
import {beforeEach, describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {StatisticalGraphsGenerator} from './generator.ts';

describe('StatisticalGraphsGenerator', () => {
    const generator = new StatisticalGraphsGenerator();
    beforeEach(() => setSeed(42));

    const baseConfig = {
        scale: Scope.StepsOf1,
        useAddition: false,
        useSubtraction: false,
        useTwoOperands: false,
        useThreeOperands: false
    } as const;

    it('generates three distinct positive whole-number category counts', () => {
        const problem = generator.generate(baseConfig);
        expect(problem.data.categories).toHaveLength(3);
        expect(new Set(problem.data.categories.map(({count}) => count)).size).toBe(3);
        for (const {count} of problem.data.categories) {
            expect(Number.isInteger(count)).toBe(true);
            expect(count).toBeGreaterThanOrEqual(2);
            expect(count).toBeLessThanOrEqual(8);
        }
        expect(problem.data.scale).toBe(1);
        expect(problem.data.operation).toBeUndefined();
    });

    it.each([
        [Scope.StepsOf2, 2],
        [Scope.StepsOf5, 5],
        [Scope.StepsOf10, 10]
    ] as const)('generates totals aligned to %s', (scale, scaleValue) => {
        const data = generator.generate({...baseConfig, scale}).data;
        expect(data.scale).toBe(scaleValue);
        expect(data.categories.every(({count}) => count % scaleValue === 0)).toBe(true);
        expect(data.categories.every(({count}) => count >= 2 * scaleValue && count <= 8 * scaleValue)).toBe(true);
    });

    it.each([
        [true, false, 'addition'],
        [false, true, 'subtraction']
    ] as const)('generates a coherent %s graph question', (useAddition, useSubtraction, operation) => {
        const data = generator.generate({...baseConfig, useAddition, useSubtraction, useTwoOperands: true}).data;
        const [firstIndex, secondIndex] = data.operandIndices!;
        const first = data.categories[firstIndex].count;
        const second = data.categories[secondIndex].count;

        expect(data.operation).toBe(operation);
        expect(data.answer).toBe(operation === 'addition' ? first + second : first - second);
        if (operation === 'subtraction') expect(first).toBeGreaterThan(second);
    });

    it('generates a connected three-operand subtraction question', () => {
        const data = generator.generate({
            ...baseConfig,
            scale: Scope.StepsOf5,
            useSubtraction: true,
            useThreeOperands: true
        }).data;
        if (data.operandIndices?.length !== 3) throw new Error('Expected three operand indices.');
        const [firstIndex, secondIndex, thirdIndex] = data.operandIndices;
        const first = data.categories[firstIndex].count;
        const second = data.categories[secondIndex].count;
        const third = data.categories[thirdIndex].count;

        expect(data.operation).toBe('subtraction');
        expect(data.intermediate).toBe(first - second);
        expect(data.answer).toBe(data.intermediate! - third);
        expect(data.answer).toBeGreaterThan(0);
    });

    it('rejects contradictory configurations', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({...baseConfig, useAddition: true, useSubtraction: true, useTwoOperands: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useAddition: true, useTwoOperands: false})).toThrow();
        expect(() => generator.generate({...baseConfig, useTwoOperands: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useSubtraction: true, useTwoOperands: true, useThreeOperands: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useAddition: true, useThreeOperands: true})).toThrow();
    });
});
