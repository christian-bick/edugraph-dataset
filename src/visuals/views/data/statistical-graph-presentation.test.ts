import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {StatisticalGraphsGenerator} from '../../../generators/statistics/statistical-graphs/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {
    graphObservations,
    isArithmeticTask,
    isConstructionTask,
    revealsBarCounts,
    revealsBars,
    resolveStatisticalGraphTask,
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

describe('statistical graph presentation', () => {
    it('derives all non-arithmetic learner tasks from one canonical payload', () => {
        setSeed('graph-core');
        const data = generator.generate(baseConfig).data;

        expect(resolveStatisticalGraphTask(data, 'construction')).toBe('construct');
        expect(resolveStatisticalGraphTask(data, 'classification')).toBe('organize');
        expect(resolveStatisticalGraphTask(data, 'interpretation')).toBe('read-category-count');
        expect(resolveStatisticalGraphTask(data, 'arithmetic')).toBeNull();
        expect(taskHeading(data, false, 'organize', 4)).toMatch(/sort/i);
        expect(taskHeading(data, false, 'read-category-count', 4)).toContain('books');
    });

    it('derives deterministic scaled observations when the generator has no raw observations', () => {
        setSeed('scaled-observations');
        const data = generator.generate({...baseConfig, scale: Scope.StepsOf5}).data;
        const first = graphObservations(data, 31);
        const second = graphObservations(data, 31);

        expect(first).toEqual(second);
        expect(first).toHaveLength(data.categories.reduce((sum, category) => sum + category.count / data.scale, 0));
        for (const category of data.categories) {
            expect(first.filter(label => label === category.label)).toHaveLength(category.count / data.scale);
        }
    });

    it('keeps construction artifacts unresolved only in Question Mode', () => {
        expect(isConstructionTask('construct')).toBe(true);
        expect(isConstructionTask('organize')).toBe(true);
        expect(isArithmeticTask('construct')).toBe(false);
        expect(revealsBars(false, 'construct')).toBe(false);
        expect(revealsBars(true, 'construct')).toBe(true);
        expect(revealsBars(false, 'organize')).toBe(false);
        expect(revealsBarCounts(false, 'read-category-count')).toBe(false);
        expect(revealsBarCounts(true, 'read-category-count')).toBe(true);
    });

    it('derives arithmetic presentation from the canonical operand structure', () => {
        setSeed('graph-single');
        const single = generator.generate({...baseConfig, useAddition: true, isSingleStep: true}).data;
        setSeed('graph-total');
        const total = generator.generate({...baseConfig, useAddition: true, requireThreeOperands: true}).data;
        setSeed('graph-multi');
        const multi = generator.generate({
            ...baseConfig,
            scale: Scope.StepsOf5,
            useSubtraction: true,
            isMultiStep: true
        }).data;

        expect(resolveStatisticalGraphTask(single, 'arithmetic')).toBe('single-step-arithmetic');
        expect(resolveStatisticalGraphTask(total, 'arithmetic')).toBe('find-total');
        expect(resolveStatisticalGraphTask(multi, 'arithmetic')).toBe('multi-step-arithmetic');
        expect(resolveStatisticalGraphTask(single, 'classification')).toBeNull();
        expect(taskHeading(single, false, 'single-step-arithmetic', 0)).toContain('altogether');
        expect(taskHeading(multi, false, 'multi-step-arithmetic', 0)).toContain('How many more');
        expect(isArithmeticTask('find-total')).toBe(true);
    });
});
