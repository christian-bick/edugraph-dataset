import {Area, Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionComparisonProblem,
    FractionComparisonBarModel,
    FractionParts,
    FractionValue,
    LegacyFractionComparisonProblem,
    UnlikeFractionComparisonProblem
} from '../../../types/problems.ts';
import {
    FractionComparisonGeneratorConfig,
    FractionComparisonGeneratorSchema
} from './spec.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
const COMMON_DENOMINATORS = [3, 4, 6, 8] as const satisfies readonly FractionParts[];
const BENCHMARK = {
    numerator: 1,
    denominator: 2,
    notation: '1/2',
    xPercent: 50
} as const;

type FractionSeed = {
    numerator: number;
    denominator: FractionParts;
};

type UnlikePair = {
    first: FractionSeed;
    second: FractionSeed;
};

const PROPER_FRACTIONS: FractionSeed[] = DENOMINATORS.flatMap(denominator =>
    Array.from({length: denominator - 1}, (_, index) => ({
        numerator: index + 1,
        denominator
    }))
);

const UNLIKE_PAIRS = {
    greater: PROPER_FRACTIONS.flatMap(first => PROPER_FRACTIONS.map(second => ({first, second})))
        .filter(({first, second}) => first.numerator !== second.numerator
            && first.denominator !== second.denominator
            && 2 * first.numerator > first.denominator
            && 2 * second.numerator < second.denominator),
    equal: PROPER_FRACTIONS.flatMap(first => PROPER_FRACTIONS.map(second => ({first, second})))
        .filter(({first, second}) => first.denominator < second.denominator
            && first.numerator !== second.numerator
            && 2 * first.numerator === first.denominator
            && 2 * second.numerator === second.denominator
            && first.denominator > 2),
    less: PROPER_FRACTIONS.flatMap(first => PROPER_FRACTIONS.map(second => ({first, second})))
        .filter(({first, second}) => first.numerator !== second.numerator
            && first.denominator !== second.denominator
            && 2 * first.numerator < first.denominator
            && 2 * second.numerator > second.denominator)
} as const satisfies Record<'greater' | 'equal' | 'less', UnlikePair[]>;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const randomItem = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)];

const randomDistinctPair = <T>(items: readonly T[]): [T, T] => {
    const firstIndex = Math.floor(random() * items.length);
    let secondIndex = Math.floor(random() * (items.length - 1));
    if (secondIndex >= firstIndex) secondIndex++;
    return [items[firstIndex], items[secondIndex]];
};

const toFractionValue = (numerator: number, denominator: FractionParts): FractionValue => ({
    numerator,
    denominator,
    notation: `${numerator}/${denominator}`
});

const relationPhrase = (relation: 'greater' | 'equal' | 'less'): string =>
    relation === 'greater' ? 'greater than' : relation === 'less' ? 'less than' : 'equal to';

const compareToHalf = (fraction: FractionValue): 'greater' | 'equal' | 'less' => {
    const difference = 2 * fraction.numerator - fraction.denominator;
    return difference > 0 ? 'greater' : difference < 0 ? 'less' : 'equal';
};

const toBarModel = (fraction: FractionValue): FractionComparisonBarModel => ({
    partCount: fraction.denominator,
    shadedCount: fraction.numerator,
    filledPercent: 100 * fraction.numerator / fraction.denominator,
    benchmarkXPercent: 50
});

const generateUnlikeComparison = (
    relation: UnlikeFractionComparisonProblem['relation']
): UnlikeFractionComparisonProblem => {
    const pair = randomItem(UNLIKE_PAIRS[relation]);
    const first = toFractionValue(pair.first.numerator, pair.first.denominator);
    const second = toFractionValue(pair.second.numerator, pair.second.denominator);
    const symbol = relation === 'greater' ? '>' as const : relation === 'less' ? '<' as const : '=' as const;
    const firstBenchmarkRelation = compareToHalf(first);
    const secondBenchmarkRelation = compareToHalf(second);
    const firstBenchmarkStatement = `${first.notation} is ${relationPhrase(firstBenchmarkRelation)} 1/2.`;
    const secondBenchmarkStatement = `${second.notation} is ${relationPhrase(secondBenchmarkRelation)} 1/2.`;
    const solutionEquation = `${first.notation} ${symbol} ${second.notation}`;

    return {
        task: 'compare-unlike-fractions',
        first,
        second,
        comparisonKind: relation === 'equal' ? 'equality' : 'inequality',
        relation,
        symbol,
        strategy: 'benchmark-half',
        sharedWhole: 1,
        benchmark: BENCHMARK,
        firstModel: toBarModel(first),
        secondModel: toBarModel(second),
        firstBenchmarkRelation,
        secondBenchmarkRelation,
        firstBenchmarkStatement,
        secondBenchmarkStatement,
        prompt: `Compare ${first.notation} and ${second.notation} using 1/2 as a benchmark on the same whole.`,
        questionEquation: `${first.notation} ? ${second.notation}`,
        solutionEquation,
        answer: solutionEquation,
        answerStatement: `${solutionEquation}.`,
        rationale: `Both fractions refer to the same whole. ${firstBenchmarkStatement} ${secondBenchmarkStatement} Therefore, ${solutionEquation}.`
    };
};

export class FractionComparisonGenerator implements ProblemGenerator<
    FractionComparisonProblem,
    FractionComparisonGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionComparisonGeneratorSchema;

    generate(config: FractionComparisonGeneratorConfig): ProblemStub<FractionComparisonProblem> {
        validateConfigFields('fraction-comparison', config, [
            'comparisonKind',
            'usesProcedureUnderstanding',
            'usesReferenceComparison',
            'usesCommonDenominator',
            'usesCommonNumerator',
            'usesNumeratorInterpretation',
            'usesDenominatorInterpretation',
            'relation'
        ]);

        const comparisonKind = config.comparisonKind!;
        const relationLabel = config.relation!;
        const usesProcedureUnderstanding = config.usesProcedureUnderstanding === true;
        const usesReferenceComparison = config.usesReferenceComparison === true;
        const relation = relationLabel === Scope.Greater
            ? 'greater' as const
            : relationLabel === Scope.Less
                ? 'less' as const
                : relationLabel === Scope.Equal
                    ? 'equal' as const
                    : null;

        if (!relation) {
            throw new GeneratorValidationError(
                'fraction-comparison',
                'The relation must be Greater, Equal, or Less.'
            );
        }

        if (usesReferenceComparison) {
            const kindMatchesRelation = relation === 'equal'
                ? comparisonKind === Area.NumericEquality
                : comparisonKind === Area.NumericInequality;
            if (!kindMatchesRelation
                || config.usesCommonDenominator
                || config.usesCommonNumerator
                || config.usesNumeratorInterpretation
                || config.usesDenominatorInterpretation) {
                throw new GeneratorValidationError(
                    'fraction-comparison',
                    'Fraction reference comparison requires NumericEquality with Equal or NumericInequality with Greater/Less, without a common-component family.'
                );
            }
            return {data: generateUnlikeComparison(relation)};
        }

        if (usesProcedureUnderstanding) {
            throw new GeneratorValidationError(
                'fraction-comparison',
                'ProcedureUnderstanding alone does not select a fraction comparison strategy.'
            );
        }

        const usesCommonDenominator = config.usesCommonDenominator === true
            && config.usesCommonNumerator === false
            && config.usesNumeratorInterpretation === true
            && config.usesDenominatorInterpretation === false;
        const usesCommonNumerator = config.usesCommonDenominator === false
            && config.usesCommonNumerator === true
            && config.usesNumeratorInterpretation === false
            && config.usesDenominatorInterpretation === true;
        if (!usesCommonDenominator && !usesCommonNumerator) {
            throw new GeneratorValidationError(
                'fraction-comparison',
                'CommonDenominator requires FractionNumeratorInterpretation, while CommonNumerator requires FractionDenominatorInterpretation.'
            );
        }
        if (comparisonKind !== Area.NumericComparison
            || (relation !== 'greater' && relation !== 'less')) {
            throw new GeneratorValidationError(
                'fraction-comparison',
                'Legacy common-component comparison requires NumericComparison with Greater or Less.'
            );
        }

        const symbol = relation === 'greater' ? '>' as const : '<' as const;
        let first: FractionValue;
        let second: FractionValue;
        let family: LegacyFractionComparisonProblem['family'];
        let sharedComponent: number;
        let rationale: string;

        if (usesCommonDenominator) {
            const denominator = randomItem(COMMON_DENOMINATORS);
            const [one, two] = randomDistinctPair(
                Array.from({length: denominator - 1}, (_, index) => index + 1)
            );
            const lower = Math.min(one, two);
            const upper = Math.max(one, two);
            const firstNumerator = relation === 'greater' ? upper : lower;
            const secondNumerator = relation === 'greater' ? lower : upper;
            first = toFractionValue(firstNumerator, denominator);
            second = toFractionValue(secondNumerator, denominator);
            family = 'common-denominator';
            sharedComponent = denominator;
            rationale = `Both ${first.notation} and ${second.notation} refer to the same whole and share denominator ${denominator}; comparing numerators ${firstNumerator} and ${secondNumerator} shows ${first.notation} is ${relation} than ${second.notation}.`;
        } else {
            const [one, two] = randomDistinctPair(DENOMINATORS);
            const lower = Math.min(one, two) as FractionParts;
            const upper = Math.max(one, two) as FractionParts;
            const firstDenominator = relation === 'greater' ? lower : upper;
            const secondDenominator = relation === 'greater' ? upper : lower;
            const numerator = randomInteger(1, Math.min(firstDenominator, secondDenominator) - 1);
            first = toFractionValue(numerator, firstDenominator);
            second = toFractionValue(numerator, secondDenominator);
            family = 'common-numerator';
            sharedComponent = numerator;
            const partSize = relation === 'greater' ? 'larger' : 'smaller';
            rationale = `Both ${first.notation} and ${second.notation} refer to the same whole and share numerator ${numerator}; denominator ${firstDenominator} makes ${partSize} parts than denominator ${secondDenominator}, so ${first.notation} is ${relation} than ${second.notation}.`;
        }

        return {
            data: {
                task: 'compare-fractions',
                first,
                second,
                family,
                sharedComponent,
                relation,
                symbol,
                sharedWhole: 1,
                answer: `${first.notation} ${symbol} ${second.notation}`,
                rationale
            }
        };
    }
}
