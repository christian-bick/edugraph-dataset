import {
    FractionComparisonBarModel,
    FractionValue,
    LegacyFractionComparisonProblem,
    UnlikeFractionComparisonProblem
} from '../../../types/problems.ts';
import {formatFraction} from '../../helpers/fraction.ts';

const EPSILON = 0.001;
const DENOMINATORS = [2, 3, 4, 6, 8] as const;

const validFraction = (fraction: FractionValue): boolean => typeof fraction === 'object'
    && fraction !== null
    && Number.isInteger(fraction.numerator)
    && fraction.numerator > 0
    && Number.isInteger(fraction.denominator)
    && DENOMINATORS.includes(fraction.denominator)
    && fraction.numerator < fraction.denominator;

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

const relationSymbol = (relation: 'greater' | 'equal' | 'less'): '>' | '=' | '<' =>
    relation === 'greater' ? '>' : relation === 'less' ? '<' : '=';

const benchmarkStatement = (
    notation: string,
    relation: 'greater' | 'equal' | 'less'
): string => relation === 'equal'
    ? `${notation} is equal to 1/2.`
    : `${notation} is ${relation} than 1/2.`;

export type UnlikeFractionComparisonPresentation = {
    symbol: '>' | '=' | '<';
    firstBenchmarkStatement: string;
    secondBenchmarkStatement: string;
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    answerStatement: string;
    rationale: string;
};

export const unlikeFractionComparisonPresentation = (
    data: UnlikeFractionComparisonProblem
): UnlikeFractionComparisonPresentation => {
    const symbol = relationSymbol(data.relation);
    const firstNotation = formatFraction(data.first);
    const secondNotation = formatFraction(data.second);
    const firstBenchmarkStatement = benchmarkStatement(
        firstNotation,
        data.firstBenchmarkRelation
    );
    const secondBenchmarkStatement = benchmarkStatement(
        secondNotation,
        data.secondBenchmarkRelation
    );
    const solutionEquation = `${firstNotation} ${symbol} ${secondNotation}`;
    return {
        symbol,
        firstBenchmarkStatement,
        secondBenchmarkStatement,
        prompt: `Compare ${firstNotation} and ${secondNotation} using 1/2 as a benchmark on the same whole.`,
        questionEquation: `${firstNotation} ? ${secondNotation}`,
        solutionEquation,
        answerStatement: `${solutionEquation}.`,
        rationale: `Both fractions refer to the same whole. ${firstBenchmarkStatement} ${secondBenchmarkStatement} Therefore, ${solutionEquation}.`
    };
};

export type LegacyFractionComparisonPresentation = {
    symbol: '>' | '<';
    answer: string;
    rationale: string;
};

export const legacyFractionComparisonPresentation = (
    data: LegacyFractionComparisonProblem
): LegacyFractionComparisonPresentation => {
    const symbol = relationSymbol(data.relation) as '>' | '<';
    const firstNotation = formatFraction(data.first);
    const secondNotation = formatFraction(data.second);
    const answer = `${firstNotation} ${symbol} ${secondNotation}`;
    const rationale = data.family === 'common-denominator'
        ? `Both ${firstNotation} and ${secondNotation} refer to the same whole and share denominator ${data.sharedComponent}; comparing numerators ${data.first.numerator} and ${data.second.numerator} shows ${firstNotation} is ${data.relation} than ${secondNotation}.`
        : `Both ${firstNotation} and ${secondNotation} refer to the same whole and share numerator ${data.sharedComponent}; denominator ${data.first.denominator} makes ${data.relation === 'greater' ? 'larger' : 'smaller'} parts than denominator ${data.second.denominator}, so ${firstNotation} is ${data.relation} than ${secondNotation}.`;
    return {symbol, answer, rationale};
};

export const isValidUnlikeFractionComparison = (
    data: UnlikeFractionComparisonProblem
): boolean => {
    if (data.task !== 'compare-unlike-fractions'
        || !validFraction(data.first)
        || !validFraction(data.second)
        || data.first.denominator === data.second.denominator
        || data.first.numerator === data.second.numerator
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
    const benchmarkProvesRelation = relation === 'greater'
        ? firstBenchmarkRelation === 'greater' && secondBenchmarkRelation === 'less'
        : relation === 'less'
            ? firstBenchmarkRelation === 'less' && secondBenchmarkRelation === 'greater'
            : firstBenchmarkRelation === 'equal' && secondBenchmarkRelation === 'equal';

    return benchmarkProvesRelation
        && data.relation === relation
        && data.comparisonKind === (relation === 'equal' ? 'equality' : 'inequality')
        && data.firstBenchmarkRelation === firstBenchmarkRelation
        && data.secondBenchmarkRelation === secondBenchmarkRelation;
};
