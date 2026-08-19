import {describe, expect, it} from 'vitest';
import {UnlikeFractionComparisonProblem} from '../../../types/problems.ts';
import {isValidUnlikeFractionComparison} from './fraction-comparison-helpers.ts';

const fixtures: UnlikeFractionComparisonProblem[] = [
    {
        task: 'compare-unlike-fractions',
        first: {numerator: 3, denominator: 4, notation: '3/4'},
        second: {numerator: 1, denominator: 3, notation: '1/3'},
        comparisonKind: 'inequality',
        relation: 'greater',
        symbol: '>',
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
        secondBenchmarkRelation: 'less',
        firstBenchmarkStatement: '3/4 is greater than 1/2.',
        secondBenchmarkStatement: '1/3 is less than 1/2.',
        prompt: 'Compare 3/4 and 1/3 using 1/2 as a benchmark on the same whole.',
        questionEquation: '3/4 ? 1/3',
        solutionEquation: '3/4 > 1/3',
        answer: '3/4 > 1/3',
        answerStatement: '3/4 > 1/3.',
        rationale: 'Both fractions refer to the same whole. 3/4 is greater than 1/2. 1/3 is less than 1/2. Therefore, 3/4 > 1/3.'
    },
    {
        task: 'compare-unlike-fractions',
        first: {numerator: 2, denominator: 4, notation: '2/4'},
        second: {numerator: 3, denominator: 6, notation: '3/6'},
        comparisonKind: 'equality',
        relation: 'equal',
        symbol: '=',
        strategy: 'benchmark-half',
        sharedWhole: 1,
        benchmark: {numerator: 1, denominator: 2, notation: '1/2', xPercent: 50},
        firstModel: {partCount: 4, shadedCount: 2, filledPercent: 50, benchmarkXPercent: 50},
        secondModel: {partCount: 6, shadedCount: 3, filledPercent: 50, benchmarkXPercent: 50},
        firstBenchmarkRelation: 'equal',
        secondBenchmarkRelation: 'equal',
        firstBenchmarkStatement: '2/4 is equal to 1/2.',
        secondBenchmarkStatement: '3/6 is equal to 1/2.',
        prompt: 'Compare 2/4 and 3/6 using 1/2 as a benchmark on the same whole.',
        questionEquation: '2/4 ? 3/6',
        solutionEquation: '2/4 = 3/6',
        answer: '2/4 = 3/6',
        answerStatement: '2/4 = 3/6.',
        rationale: 'Both fractions refer to the same whole. 2/4 is equal to 1/2. 3/6 is equal to 1/2. Therefore, 2/4 = 3/6.'
    },
    {
        task: 'compare-unlike-fractions',
        first: {numerator: 1, denominator: 3, notation: '1/3'},
        second: {numerator: 3, denominator: 4, notation: '3/4'},
        comparisonKind: 'inequality',
        relation: 'less',
        symbol: '<',
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
        secondBenchmarkRelation: 'greater',
        firstBenchmarkStatement: '1/3 is less than 1/2.',
        secondBenchmarkStatement: '3/4 is greater than 1/2.',
        prompt: 'Compare 1/3 and 3/4 using 1/2 as a benchmark on the same whole.',
        questionEquation: '1/3 ? 3/4',
        solutionEquation: '1/3 < 3/4',
        answer: '1/3 < 3/4',
        answerStatement: '1/3 < 3/4.',
        rationale: 'Both fractions refer to the same whole. 1/3 is less than 1/2. 3/4 is greater than 1/2. Therefore, 1/3 < 3/4.'
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
        ['benchmark statement', (data: UnlikeFractionComparisonProblem) => {
            data.firstBenchmarkStatement = '3/4 is less than 1/2.';
        }],
        ['same numerator', (data: UnlikeFractionComparisonProblem) => {
            data.second = {numerator: 3, denominator: 8, notation: '3/8'};
            data.secondModel = {
                partCount: 8,
                shadedCount: 3,
                filledPercent: 37.5,
                benchmarkXPercent: 50
            };
            data.secondBenchmarkStatement = '3/8 is less than 1/2.';
            data.prompt = 'Compare 3/4 and 3/8 using 1/2 as a benchmark on the same whole.';
            data.questionEquation = '3/4 ? 3/8';
            data.solutionEquation = '3/4 > 3/8';
            data.answer = '3/4 > 3/8';
            data.answerStatement = '3/4 > 3/8.';
            data.rationale = 'Both fractions refer to the same whole. 3/4 is greater than 1/2. 3/8 is less than 1/2. Therefore, 3/4 > 3/8.';
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
            data.secondBenchmarkStatement = '2/3 is greater than 1/2.';
            data.prompt = 'Compare 3/4 and 2/3 using 1/2 as a benchmark on the same whole.';
            data.questionEquation = '3/4 ? 2/3';
            data.solutionEquation = '3/4 > 2/3';
            data.answer = '3/4 > 2/3';
            data.answerStatement = '3/4 > 2/3.';
            data.rationale = 'Both fractions refer to the same whole. 3/4 is greater than 1/2. 2/3 is greater than 1/2. Therefore, 3/4 > 2/3.';
        }],
        ['question answer leakage', (data: UnlikeFractionComparisonProblem) => {
            data.questionEquation = data.solutionEquation;
        }],
        ['solution equation', (data: UnlikeFractionComparisonProblem) => {
            data.solutionEquation = '3/4 < 1/3';
        }],
        ['rationale', (data: UnlikeFractionComparisonProblem) => {
            data.rationale = 'The first bar looks longer.';
        }]
    ])('rejects contradictory %s evidence', (_name, update) => {
        expect(isValidUnlikeFractionComparison(changed(update))).toBe(false);
    });
});
