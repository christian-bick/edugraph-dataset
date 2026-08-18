import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {StatisticalGraphsGenerator} from '../../../../generators/statistics/statistical-graphs/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {
    isArithmeticTask,
    isConstructionTask,
    revealsBarCounts,
    revealsBars,
    taskHeading
} from './presentation.ts';

const generator = new StatisticalGraphsGenerator();
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

describe('data-bar-graph presentation', () => {
    it('keeps construct and organize bars unresolved only in Question Mode', () => {
        setSeed('bar-construct');
        const construct = generator.generate(baseConfig).data;
        setSeed('bar-organize');
        const organize = generator.generate({
            ...baseConfig,
            useObjectSorting: true,
            useConceptClassification: true
        }).data;

        for (const data of [construct, organize]) {
            expect(isConstructionTask(data.task)).toBe(true);
            expect(isArithmeticTask(data.task)).toBe(false);
            expect(revealsBars(data, false)).toBe(false);
            expect(revealsBars(data, true)).toBe(true);
        }
        expect(taskHeading(organize, false)).toBe(organize.task === 'organize' ? organize.prompt : '');
    });

    it('keeps read and find-total graphs complete while withholding answers in the view', () => {
        setSeed('bar-read');
        const read = generator.generate({...baseConfig, interpretCategory: true}).data;
        setSeed('bar-total');
        const total = generator.generate({
            ...baseConfig,
            useAddition: true,
            requireThreeOperands: true
        }).data;

        expect(read.task).toBe('read-category-count');
        expect(total.task).toBe('find-total');
        expect(revealsBars(read, false)).toBe(true);
        expect(revealsBars(total, false)).toBe(true);
        expect(revealsBarCounts(read, false)).toBe(false);
        expect(revealsBarCounts(read, true)).toBe(true);
        expect(revealsBarCounts(total, false)).toBe(true);
        expect(isConstructionTask(read.task)).toBe(false);
        expect(isArithmeticTask(total.task)).toBe(true);
        if (total.task === 'find-total') {
            expect(total.operandIndices).toEqual([0, 1, 2]);
            expect(total.answer).toBe(total.categories.reduce((sum, category) => sum + category.count, 0));
        }
    });

    it('preserves legacy single-step and multi-step arithmetic headings', () => {
        setSeed('bar-single');
        const single = generator.generate({
            ...baseConfig,
            useAddition: true,
            isSingleStep: true
        }).data;
        setSeed('bar-multi');
        const multi = generator.generate({
            ...baseConfig,
            scale: Scope.StepsOf5,
            useSubtraction: true,
            isMultiStep: true
        }).data;

        expect(single.task).toBe('single-step-arithmetic');
        expect(multi.task).toBe('multi-step-arithmetic');
        expect(taskHeading(single, false)).toContain('altogether');
        expect(taskHeading(multi, false)).toContain('How many more');
        expect(isArithmeticTask(single.task)).toBe(true);
        expect(isArithmeticTask(multi.task)).toBe(true);
    });
});
