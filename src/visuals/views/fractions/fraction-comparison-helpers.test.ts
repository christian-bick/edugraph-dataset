import {describe, expect, it} from 'vitest';
import {UnlikeFractionComparisonProblem} from '../../../types/problems.ts';
import {
    isValidUnlikeFractionComparison,
    unlikeFractionComparisonPresentation
} from './fraction-comparison-helpers.ts';

const fixtures: UnlikeFractionComparisonProblem[] = [
    {
        task: 'compare-unlike-fractions',
        first: {numerator: 3, denominator: 4, notation: '3/4'},
        second: {numerator: 1, denominator: 3, notation: '1/3'},
        comparisonKind: 'inequality',
        relation: 'greater',
        strategy: 'benchmark-half',
        sharedWhole: 1,
        benchmark: {numerator: 1, denominator: 2, notation: '1/2', xPercent: 50},
        firstModel: {partCount: 4, shadedCount: 3, filledPercent: 75, benchmarkXPercent: 50},
        secondModel: {
            partCount: 3,
            shadedCount: 1,
            filledPercent: 100 / 3,
            benchmarkXPercent: 50
        },
        firstBenchmarkRelation: 'greater',
        secondBenchmarkRelation: 'less'
    },
    {
        task: 'compare-unlike-fractions',
        first: {numerator: 2, denominator: 4, notation: '2/4'},
        second: {numerator: 3, denominator: 6, notation: '3/6'},
        comparisonKind: 'equality',
        relation: 'equal',
        strategy: 'benchmark-half',
        sharedWhole: 1,
        benchmark: {numerator: 1, denominator: 2, notation: '1/2', xPercent: 50},
        firstModel: {partCount: 4, shadedCount: 2, filledPercent: 50, benchmarkXPercent: 50},
        secondModel: {partCount: 6, shadedCount: 3, filledPercent: 50, benchmarkXPercent: 50},
        firstBenchmarkRelation: 'equal',
        secondBenchmarkRelation: 'equal'
    },
    {
        task: 'compare-unlike-fractions',
        first: {numerator: 1, denominator: 3, notation: '1/3'},
        second: {numerator: 3, denominator: 4, notation: '3/4'},
        comparisonKind: 'inequality',
        relation: 'less',
        strategy: 'benchmark-half',
        sharedWhole: 1,
        benchmark: {numerator: 1, denominator: 2, notation: '1/2', xPercent: 50},
        firstModel: {
            partCount: 3,
            shadedCount: 1,
            filledPercent: 100 / 3,
            benchmarkXPercent: 50
        },
        secondModel: {partCount: 4, shadedCount: 3, filledPercent: 75, benchmarkXPercent: 50},
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
        ['filled extent', (data: UnlikeFractionComparisonProblem) => {
            data.firstModel.filledPercent = 50;
        }],
        ['benchmark location', (data: UnlikeFractionComparisonProblem) => {
            data.secondModel.benchmarkXPercent = 49 as 50;
        }],
        ['benchmark relation', (data: UnlikeFractionComparisonProblem) => {
            data.firstBenchmarkRelation = 'less';
        }],
        ['same numerator', (data: UnlikeFractionComparisonProblem) => {
            data.second = {numerator: 3, denominator: 8, notation: '3/8'};
            data.secondModel = {
                partCount: 8,
                shadedCount: 3,
                filledPercent: 37.5,
                benchmarkXPercent: 50
            };
        }],
        ['same-side benchmark', (data: UnlikeFractionComparisonProblem) => {
            data.second = {numerator: 2, denominator: 3, notation: '2/3'};
            data.secondModel = {
                partCount: 3,
                shadedCount: 2,
                filledPercent: 200 / 3,
                benchmarkXPercent: 50
            };
            data.secondBenchmarkRelation = 'greater';
        }],
        ['comparison kind', (data: UnlikeFractionComparisonProblem) => {
            data.comparisonKind = 'equality';
        }]
    ])('rejects contradictory %s evidence', (_name, update) => {
        expect(isValidUnlikeFractionComparison(changed(update))).toBe(false);
    });
});
