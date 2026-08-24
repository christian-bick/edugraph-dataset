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
        useObjectSorting: false,
        requireThreeOperands: false,
        isSingleStep: false,
        isMultiStep: false
    } as const;

    it('generates three distinct positive whole-number category counts', () => {
        const problem = generator.generate(baseConfig);
        expect(problem.data.categories).toHaveLength(3);
        expect(problem.data.categories.map(({id}) => id)).toEqual(['apple', 'book', 'kite']);
        expect(new Set(problem.data.categories.map(({count}) => count)).size).toBe(3);
        for (const {count} of problem.data.categories) {
            expect(Number.isInteger(count)).toBe(true);
            expect(count).toBeGreaterThanOrEqual(2);
            expect(count).toBeLessThanOrEqual(8);
        }
        expect(problem.data.scale).toBe(1);
        expect(problem.data.operation).toBeUndefined();
        expect(problem.data.answer).toBeUndefined();
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
        const data = generator.generate({...baseConfig, useAddition, useSubtraction, isSingleStep: true}).data;
        const [firstId, secondId] = data.operandCategoryIds!;
        const first = data.categories.find(category => category.id === firstId)!.count;
        const second = data.categories.find(category => category.id === secondId)!.count;

        expect(data.operation).toBe(operation);
        expect(data.answer).toBe(operation === 'addition' ? first + second : first - second);
        if (operation === 'subtraction') expect(first).toBeGreaterThan(second);
    });

    it('generates a connected multi-step subtraction question', () => {
        const data = generator.generate({
            ...baseConfig,
            scale: Scope.StepsOf5,
            useSubtraction: true,
            isMultiStep: true
        }).data;
        if (data.operandCategoryIds?.length !== 3) throw new Error('Expected three operand category IDs.');
        const [firstId, secondId, thirdId] = data.operandCategoryIds;
        const [first, second, third] = [firstId, secondId, thirdId]
            .map(id => data.categories.find(category => category.id === id)!.count);

        expect(data.operation).toBe('subtraction');
        expect(data.intermediate).toBe(first - second);
        expect(data.answer).toBe(data.intermediate! - third);
        expect(data.answer).toBeGreaterThan(0);
    });

    it('keeps object-sorting presentation out of the canonical mathematical payload', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const canonical = generator.generate(baseConfig).data;
            setSeed(seed);
            const sorting = generator.generate({
                ...baseConfig,
                useObjectSorting: true
            }).data;
            expect(sorting).toEqual(canonical);
            expect(sorting.categories.map(({id}) => id)).toEqual(['apple', 'book', 'kite']);
            expect(Object.keys(sorting).sort()).toEqual(['categories', 'scale']);
        }
    });

    it('does not preselect a learner task for canonical categorical data', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate(baseConfig).data;
            expect(data.scale).toBe(1);
            expect(data.operation).toBeUndefined();
            expect(data.operandCategoryIds).toBeUndefined();
            expect(data.answer).toBeUndefined();
        }
    });

    it('uses all three categories as explicit addition operands for the total', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({
                ...baseConfig,
                useAddition: true,
                requireThreeOperands: true
            }).data;
            expect(data.scale).toBe(1);
            expect(data.operation).toBe('addition');
            expect(data.operandCategoryIds).toEqual(['apple', 'book', 'kite']);
            expect(data.answer).toBe(data.categories.reduce((total, category) => total + category.count, 0));
        }
    });

    it('rejects contradictory configurations', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({...baseConfig, useAddition: true, useSubtraction: true, isSingleStep: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useAddition: true, isSingleStep: false})).toThrow();
        expect(() => generator.generate({...baseConfig, isSingleStep: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useSubtraction: true, isSingleStep: true, isMultiStep: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useAddition: true, isMultiStep: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useObjectSorting: true, useSubtraction: true, isSingleStep: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useAddition: true, requireThreeOperands: true, isSingleStep: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useAddition: true, requireThreeOperands: true, scale: Scope.StepsOf2})).toThrow();
    });
});
