import {
    FractionComparisonBarModel,
    FractionValue,
    UnlikeFractionComparisonProblem
} from '../../../../types/problems.ts';

const EPSILON = 0.001;
const DENOMINATORS = [2, 3, 4, 6, 8] as const;

const validFraction = (fraction: FractionValue): boolean => typeof fraction === 'object'
    && fraction !== null
    && Number.isInteger(fraction.numerator)
    && fraction.numerator > 0
    && Number.isInteger(fraction.denominator)
    && DENOMINATORS.includes(fraction.denominator)
    && fraction.numerator < fraction.denominator
    && fraction.notation === `${fraction.numerator}/${fraction.denominator}`;

const compare = (first: number, second: number): 'greater' | 'equal' | 'less' =>
    first > second ? 'greater' : first < second ? 'less' : 'equal';

const validModel = (
    model: FractionComparisonBarModel,
    fraction: FractionValue
): boolean => typeof model === 'object'
    && model !== null
    && model.partCount === fraction.denominator
    && model.shadedCount === fraction.numerator
    && Number.isFinite(model.filledPercent)
    && Math.abs(model.filledPercent - fraction.numerator / fraction.denominator * 100) < EPSILON
    && model.benchmarkXPercent === 50;

const benchmarkStatement = (
    notation: string,
    relation: 'greater' | 'equal' | 'less'
): string => relation === 'equal'
    ? `${notation} is equal to 1/2.`
    : `${notation} is ${relation} than 1/2.`;

export const isValidUnlikeFractionComparison = (
    data: UnlikeFractionComparisonProblem
): boolean => {
    if (data.task !== 'compare-unlike-fractions'
        || !validFraction(data.first)
        || !validFraction(data.second)
        || data.first.denominator === data.second.denominator
        || data.first.numerator === data.second.numerator
        || data.first.notation === data.second.notation
        || data.strategy !== 'benchmark-half'
        || data.sharedWhole !== 1
        || typeof data.benchmark !== 'object'
        || data.benchmark === null
        || data.benchmark.numerator !== 1
        || data.benchmark.denominator !== 2
        || data.benchmark.notation !== '1/2'
        || data.benchmark.xPercent !== 50
        || !validModel(data.firstModel, data.first)
        || !validModel(data.secondModel, data.second)) return false;

    const relation = compare(
        data.first.numerator * data.second.denominator,
        data.second.numerator * data.first.denominator
    );
    const firstBenchmarkRelation = compare(
        data.first.numerator * 2,
        data.first.denominator
    );
    const secondBenchmarkRelation = compare(
        data.second.numerator * 2,
        data.second.denominator
    );
    const symbol = relation === 'greater' ? '>' : relation === 'less' ? '<' : '=';
    const expectedSolution = `${data.first.notation} ${symbol} ${data.second.notation}`;
    const expectedFirstBenchmark = benchmarkStatement(
        data.first.notation,
        firstBenchmarkRelation
    );
    const expectedSecondBenchmark = benchmarkStatement(
        data.second.notation,
        secondBenchmarkRelation
    );
    const benchmarkProvesRelation = relation === 'greater'
        ? firstBenchmarkRelation === 'greater' && secondBenchmarkRelation === 'less'
        : relation === 'less'
            ? firstBenchmarkRelation === 'less' && secondBenchmarkRelation === 'greater'
            : firstBenchmarkRelation === 'equal' && secondBenchmarkRelation === 'equal';

    return benchmarkProvesRelation
        && data.relation === relation
        && data.symbol === symbol
        && data.comparisonKind === (relation === 'equal' ? 'equality' : 'inequality')
        && data.firstBenchmarkRelation === firstBenchmarkRelation
        && data.secondBenchmarkRelation === secondBenchmarkRelation
        && data.firstBenchmarkStatement === expectedFirstBenchmark
        && data.secondBenchmarkStatement === expectedSecondBenchmark
        && data.prompt === `Compare ${data.first.notation} and ${data.second.notation} using 1/2 as a benchmark on the same whole.`
        && data.questionEquation === `${data.first.notation} ? ${data.second.notation}`
        && data.solutionEquation === expectedSolution
        && data.answer === expectedSolution
        && data.answerStatement === `${expectedSolution}.`
        && data.rationale === `Both fractions refer to the same whole. ${expectedFirstBenchmark} ${expectedSecondBenchmark} Therefore, ${expectedSolution}.`;
};
