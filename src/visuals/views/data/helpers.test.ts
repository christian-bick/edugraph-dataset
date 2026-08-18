import {describe, expect, it} from 'vitest';
import {StatisticalGraphProblem} from '../../../types/problems.ts';
import {validateStatisticalGraph} from './helpers.ts';

const categories = [
    {label: 'Apples', count: 2},
    {label: 'Books', count: 3},
    {label: 'Kites', count: 4}
] as const;

const problems: StatisticalGraphProblem[] = [
    {task: 'construct', graphState: 'to-construct', categories, scale: 1},
    {
        task: 'organize', graphState: 'to-construct', categories, scale: 1,
        rawObservations: ['Books', 'Apples', 'Kites', 'Books', 'Kites', 'Apples', 'Kites', 'Books', 'Kites'],
        prompt: 'Sort the observations.'
    },
    {
        task: 'read-category-count', graphState: 'complete', categories, scale: 1,
        selectedCategoryIndex: 1, selectedCategory: 'Books', answer: 3, prompt: 'How many books?'
    },
    {
        task: 'find-total', graphState: 'complete', categories, scale: 1,
        operation: 'addition', operandIndices: [0, 1, 2], answer: 9, prompt: 'How many altogether?'
    },
    {
        task: 'single-step-arithmetic', graphState: 'complete', categories, scale: 1,
        operation: 'addition', operandIndices: [0, 1], answer: 5
    },
    {
        task: 'multi-step-arithmetic', graphState: 'complete',
        categories: [{label: 'Apples', count: 8}, {label: 'Books', count: 3}, {label: 'Kites', count: 2}],
        scale: 1, operation: 'subtraction', operandIndices: [0, 1, 2], intermediate: 5, answer: 3
    }
];

describe('shared statistical graph validation', () => {
    it.each(problems)('accepts a coherent $task payload', problem => {
        expect(() => validateStatisticalGraph(problem, 'fixture')).not.toThrow();
    });

    it.each([
        {...problems[1], scale: 2},
        {...problems[1], rawObservations: ['Apples']},
        {...problems[2], selectedCategory: 'Kites'},
        {...problems[2], answer: 4},
        {...problems[3], operandIndices: [2, 1, 0]},
        {...problems[3], answer: 8},
        {...problems[4], answer: 6},
        {...problems[5], intermediate: 4}
    ])('rejects a malformed task-specific payload %#', problem => {
        expect(() => validateStatisticalGraph(problem as StatisticalGraphProblem, 'fixture')).toThrow();
    });
});
