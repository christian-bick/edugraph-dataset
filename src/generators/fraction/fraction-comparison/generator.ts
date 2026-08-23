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
    denominator
});

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
    const firstBenchmarkRelation = compareToHalf(first);
    const secondBenchmarkRelation = compareToHalf(second);

    return {
        task: 'compare-unlike-fractions',
        first,
        second,
        comparisonKind: relation === 'equal' ? 'equality' : 'inequality',
        relation,
        strategy: 'benchmark-half',
        sharedWhole: 1,
        benchmark: BENCHMARK,
        firstModel: toBarModel(first),
        secondModel: toBarModel(second),
        firstBenchmarkRelation,
        secondBenchmarkRelation
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
            'comparisonMode',
            'usesReferenceComparison',
            'usesCommonDenominator',
            'usesCommonNumerator',
            'relation'
        ]);

        const comparisonMode = config.comparisonMode!;
        const relationLabel = config.relation!;
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
                ? comparisonMode === Area.NumericEquality
                : comparisonMode === Area.NumericInequality;
            if (!kindMatchesRelation
                || config.usesCommonDenominator
                || config.usesCommonNumerator) {
                throw new GeneratorValidationError(
                    'fraction-comparison',
                    'Fraction reference comparison requires NumericEquality with Equal or NumericInequality with Greater/Less, without a common-component family.'
                );
            }
            return {data: generateUnlikeComparison(relation)};
        }

        const usesCommonDenominator = comparisonMode === Area.FractionCommonDenominatorComparison
            && config.usesCommonDenominator === true
            && config.usesCommonNumerator === false;
        const usesCommonNumerator = comparisonMode === Area.FractionCommonNumeratorComparison
            && config.usesCommonDenominator === false
            && config.usesCommonNumerator === true;
        if (!usesCommonDenominator && !usesCommonNumerator) {
            throw new GeneratorValidationError(
                'fraction-comparison',
                'Each common-component scope requires its matching fraction comparison strategy.'
            );
        }
        if (relation !== 'greater' && relation !== 'less') {
            throw new GeneratorValidationError(
                'fraction-comparison',
                'Common-component comparison requires its strategy with Greater or Less.'
            );
        }

        let first: FractionValue;
        let second: FractionValue;
        let family: LegacyFractionComparisonProblem['family'];
        let sharedComponent: number;

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
        }

        return {
            data: {
                task: 'compare-fractions',
                first,
                second,
                family,
                sharedComponent,
                relation,
                sharedWhole: 1
            }
        };
    }
}
