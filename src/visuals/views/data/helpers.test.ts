import {describe, expect, it} from 'vitest';
import {StatisticalGraphProblem} from '../../../types/problems.ts';
import {validateStatisticalGraph} from './helpers.ts';

const categories = [
    {id: 'apple', count: 2},
    {id: 'book', count: 3},
    {id: 'kite', count: 4}
] as const;

const problems: StatisticalGraphProblem[] = [
    {categories, scale: 1},
    {categories, scale: 1, operation: 'addition', operandCategoryIds: ['apple', 'book', 'kite'], answer: 9},
    {categories, scale: 1, operation: 'addition', operandCategoryIds: ['apple', 'book'], answer: 5},
    {
        categories: [{id: 'apple', count: 8}, {id: 'book', count: 3}, {id: 'kite', count: 2}],
        scale: 1,
        operation: 'subtraction',
        operandCategoryIds: ['apple', 'book', 'kite'],
        intermediate: 5,
        answer: 3
    }
];

describe('shared statistical graph validation', () => {
    it.each(problems)('accepts a coherent canonical payload %#', problem => {
        expect(() => validateStatisticalGraph(problem, 'fixture')).not.toThrow();
    });

    it.each([
        {...problems[0], categories: [categories[1], categories[0], categories[2]]},
        {...problems[0], categories: [{id: 'apple', count: 2}, {id: 'apple', count: 3}, {id: 'kite', count: 4}]},
        {...problems[0], answer: 4},
        {...problems[1], operandCategoryIds: ['kite', 'book', 'apple']},
        {...problems[1], answer: 8},
        {...problems[2], answer: 6},
        {...problems[3], intermediate: 4},
        {...problems[0], operation: 'addition'}
    ])('rejects malformed canonical data %#', problem => {
        expect(() => validateStatisticalGraph(problem as StatisticalGraphProblem, 'fixture')).toThrow();
    });
});
