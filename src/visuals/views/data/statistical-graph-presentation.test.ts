import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {StatisticalGraphsGenerator} from '../../../generators/statistics/statistical-graphs/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {
    isArithmeticTask,
    isConstructionTask,
    revealsBarCounts,
    revealsBars,
    taskHeading
} from './statistical-graph-presentation.ts';

const generator = new StatisticalGraphsGenerator();
const baseConfig = {
    scale: Scope.StepsOf1,
    useAddition: false,
    useSubtraction: false,
    useObjectSorting: false,
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
            useObjectSorting: true
        }).data;

        expect(isConstructionTask('construct')).toBe(true);
        expect(isArithmeticTask('construct')).toBe(false);
        expect(revealsBars(construct, false, 'construct')).toBe(false);
        expect(revealsBars(construct, true, 'construct')).toBe(true);
        expect(isConstructionTask('organize')).toBe(true);
        expect(revealsBars(organize, false, 'organize')).toBe(false);
        expect(revealsBars(organize, true, 'organize')).toBe(true);
        expect(taskHeading(organize, false, 'organize')).toBe(organize.task === 'organize' ? organize.prompt : '');
    });

    it('keeps read and find-total graphs complete while withholding answers in the view', () => {
        setSeed('bar-read');
        const read = generator.generate(baseConfig).data;
        setSeed('bar-total');
        const total = generator.generate({
            ...baseConfig,
            useAddition: true,
            requireThreeOperands: true
        }).data;

        expect(read.task).toBe('categorical-data');
        expect(total.task).toBe('find-total');
        expect(revealsBars(read, false, 'read-category-count')).toBe(true);
        expect(revealsBars(total, false, 'find-total')).toBe(true);
        expect(revealsBarCounts(read, false, 'read-category-count')).toBe(false);
        expect(revealsBarCounts(read, true, 'read-category-count')).toBe(true);
        expect(revealsBarCounts(total, false, 'find-total')).toBe(true);
        expect(isConstructionTask('read-category-count')).toBe(false);
        expect(isArithmeticTask('find-total')).toBe(true);
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
        expect(taskHeading(single, false, 'single-step-arithmetic')).toContain('altogether');
        expect(taskHeading(multi, false, 'multi-step-arithmetic')).toContain('How many more');
        expect(isArithmeticTask('single-step-arithmetic')).toBe(true);
        expect(isArithmeticTask('multi-step-arithmetic')).toBe(true);
    });
});
