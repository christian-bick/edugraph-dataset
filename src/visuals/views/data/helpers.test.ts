import {describe, expect, it} from 'vitest';
import {StatisticalGraphProblem} from '../../../types/problems.ts';
import {validateStatisticalGraph} from './helpers.ts';

const categories = [
    {label: 'Apples', count: 2},
    {label: 'Books', count: 3},
    {label: 'Kites', count: 4}
] as const;

const problems: StatisticalGraphProblem[] = [
    {categories, scale: 1},
    {
        categories,
        scale: 1,
        rawObservations: ['Books', 'Apples', 'Kites', 'Books', 'Kites', 'Apples', 'Kites', 'Books', 'Kites']
    },
    {categories, scale: 1, operation: 'addition', operandIndices: [0, 1, 2], answer: 9},
    {categories, scale: 1, operation: 'addition', operandIndices: [0, 1], answer: 5},
    {
        categories: [{label: 'Apples', count: 8}, {label: 'Books', count: 3}, {label: 'Kites', count: 2}],
        scale: 1,
        operation: 'subtraction',
        operandIndices: [0, 1, 2],
        intermediate: 5,
        answer: 3
    }
];

describe('shared statistical graph validation', () => {
    it.each(problems)('accepts a coherent canonical payload %#', problem => {
        expect(() => validateStatisticalGraph(problem, 'fixture')).not.toThrow();
    });

    it.each([
        {...problems[1], scale: 2},
        {...problems[1], rawObservations: ['Apples']},
        {...problems[0], answer: 4},
        {...problems[2], operandIndices: [2, 1, 0]},
        {...problems[2], answer: 8},
        {...problems[3], answer: 6},
        {...problems[4], intermediate: 4},
        {...problems[0], operation: 'addition'}
    ])('rejects malformed canonical data %#', problem => {
        expect(() => validateStatisticalGraph(problem as StatisticalGraphProblem, 'fixture')).toThrow();
    });
});
