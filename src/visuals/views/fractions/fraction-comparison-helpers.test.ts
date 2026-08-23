import {describe, expect, it} from 'vitest';
import {UnlikeFractionComparisonProblem} from '../../../types/problems.ts';
import {
    isValidUnlikeFractionComparison,
    unlikeFractionComparisonPresentation
} from './fraction-comparison-helpers.ts';

const fixtures: UnlikeFractionComparisonProblem[] = [
    {
        task: 'compare-unlike-fractions',
        first: {numerator: 3, denominator: 4},
        second: {numerator: 1, denominator: 3},
        relation: 'greater',
        strategy: 'benchmark-half',
        sharedWhole: 1,
        benchmark: {numerator: 1, denominator: 2},
        firstBenchmarkRelation: 'greater',
        secondBenchmarkRelation: 'less'
    },
    {
        task: 'compare-unlike-fractions',
        first: {numerator: 2, denominator: 4},
        second: {numerator: 3, denominator: 6},
        relation: 'equal',
        strategy: 'benchmark-half',
        sharedWhole: 1,
        benchmark: {numerator: 1, denominator: 2},
        firstBenchmarkRelation: 'equal',
        secondBenchmarkRelation: 'equal'
    },
    {
        task: 'compare-unlike-fractions',
        first: {numerator: 1, denominator: 3},
        second: {numerator: 3, denominator: 4},
        relation: 'less',
        strategy: 'benchmark-half',
        sharedWhole: 1,
        benchmark: {numerator: 1, denominator: 2},
        firstBenchmarkRelation: 'less',
        secondBenchmarkRelation: 'greater'
    }
];

const changed = (
    update: (data: UnlikeFractionComparisonProblem) => void
): UnlikeFractionComparisonProblem => {
    const data = structuredClone(fixtures[0]);
    update(data);
    return data;
};

describe('isValidUnlikeFractionComparison', () => {
    it('accepts greater, equal, and less benchmark comparisons', () => {
        expect(fixtures.map(isValidUnlikeFractionComparison)).toEqual([true, true, true]);
        expect(unlikeFractionComparisonPresentation(fixtures[0])).toEqual({
            symbol: '>',
            firstBenchmarkStatement: '3/4 is greater than 1/2.',
            secondBenchmarkStatement: '1/3 is less than 1/2.',
            prompt: 'Compare 3/4 and 1/3 using 1/2 as a benchmark on the same whole.',
            questionEquation: '3/4 ? 1/3',
            solutionEquation: '3/4 > 1/3',
            answerStatement: '3/4 > 1/3.',
            rationale: 'Both fractions refer to the same whole. 3/4 is greater than 1/2. 1/3 is less than 1/2. Therefore, 3/4 > 1/3.'
        });
    });

    it.each([
        ['comparison relation', (data: UnlikeFractionComparisonProblem) => {
            data.relation = 'less';
        }],
        ['benchmark value', (data: UnlikeFractionComparisonProblem) => {
            data.benchmark.denominator = 3 as 2;
        }],
        ['benchmark relation', (data: UnlikeFractionComparisonProblem) => {
            data.firstBenchmarkRelation = 'less';
        }],
        ['same numerator', (data: UnlikeFractionComparisonProblem) => {
            data.second = {numerator: 3, denominator: 8};
        }],
        ['same-side benchmark', (data: UnlikeFractionComparisonProblem) => {
            data.second = {numerator: 2, denominator: 3};
            data.secondBenchmarkRelation = 'greater';
        }],
        ['shared whole', (data: UnlikeFractionComparisonProblem) => {
            data.sharedWhole = 2 as 1;
        }]
    ])('rejects contradictory %s evidence', (_name, update) => {
        expect(isValidUnlikeFractionComparison(changed(update))).toBe(false);
    });
});
