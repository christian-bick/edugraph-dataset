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
        useConceptClassification: false,
        interpretCategory: false,
        requireThreeOperands: false,
        isSingleStep: false,
        isMultiStep: false
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
        expect(problem.data.task).toBe('construct');
        expect(problem.data.graphState).toBe('to-construct');
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
        const data = generator.generate({...baseConfig, useAddition, useSubtraction, isSingleStep: true}).data;
        const [firstIndex, secondIndex] = data.operandIndices!;
        const first = data.categories[firstIndex].count;
        const second = data.categories[secondIndex].count;

        expect(data.operation).toBe(operation);
        expect(data.task).toBe('single-step-arithmetic');
        expect(data.graphState).toBe('complete');
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
        if (data.operandIndices?.length !== 3) throw new Error('Expected three operand indices.');
        const [firstIndex, secondIndex, thirdIndex] = data.operandIndices;
        const first = data.categories[firstIndex].count;
        const second = data.categories[secondIndex].count;
        const third = data.categories[thirdIndex].count;

        expect(data.operation).toBe('subtraction');
        expect(data.task).toBe('multi-step-arithmetic');
        expect(data.intermediate).toBe(first - second);
        expect(data.answer).toBe(data.intermediate! - third);
        expect(data.answer).toBeGreaterThan(0);
    });

    it('authors shuffled raw observations with exact three-category frequencies', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({
                ...baseConfig,
                useObjectSorting: true,
                useConceptClassification: true
            }).data;
            expect(data.task).toBe('organize');
            expect(data.graphState).toBe('to-construct');
            expect(data.scale).toBe(1);
            expect(data.categories).toHaveLength(3);
            expect(data.rawObservations).toBeDefined();
            expect(data.rawObservations).toHaveLength(
                data.categories.reduce((total, category) => total + category.count, 0)
            );
            for (const category of data.categories) {
                expect(data.rawObservations!.filter(label => label === category.label)).toHaveLength(category.count);
            }
            const grouped = data.categories.flatMap(category =>
                Array.from({length: category.count}, () => category.label)
            );
            expect(data.rawObservations).not.toEqual(grouped);
            expect(data.prompt).toMatch(/sort/i);
        }
    });

    it('selects and answers one named category on a completed graph', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({...baseConfig, interpretCategory: true}).data;
            expect(data.task).toBe('read-category-count');
            expect(data.graphState).toBe('complete');
            expect(data.scale).toBe(1);
            expect(data.selectedCategoryIndex).toBeGreaterThanOrEqual(0);
            expect(data.selectedCategoryIndex).toBeLessThanOrEqual(2);
            const selected = data.categories[data.selectedCategoryIndex!];
            expect(data.selectedCategory).toBe(selected.label);
            expect(data.answer).toBe(selected.count);
            expect(data.prompt).toContain(selected.label.toLowerCase());
            expect(data.operation).toBeUndefined();
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
            expect(data.task).toBe('find-total');
            expect(data.graphState).toBe('complete');
            expect(data.scale).toBe(1);
            expect(data.operation).toBe('addition');
            expect(data.operandIndices).toEqual([0, 1, 2]);
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
        expect(() => generator.generate({...baseConfig, useObjectSorting: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useConceptClassification: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useObjectSorting: true, useConceptClassification: true, interpretCategory: true})).toThrow();
        expect(() => generator.generate({...baseConfig, interpretCategory: true, useSubtraction: true, isSingleStep: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useAddition: true, requireThreeOperands: true, isSingleStep: true})).toThrow();
        expect(() => generator.generate({...baseConfig, useAddition: true, requireThreeOperands: true, scale: Scope.StepsOf2})).toThrow();
    });
});
