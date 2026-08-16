import {Area, Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionComparisonProblem,
    FractionParts,
    FractionValue
} from '../../../types/problems.ts';
import {
    FractionComparisonGeneratorConfig,
    FractionComparisonGeneratorSchema
} from './spec.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
const COMMON_DENOMINATORS = [3, 4, 6, 8] as const satisfies readonly FractionParts[];

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

export class FractionComparisonGenerator implements ProblemGenerator<
    FractionComparisonProblem,
    FractionComparisonGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionComparisonGeneratorSchema;

    generate(config: FractionComparisonGeneratorConfig): ProblemStub<FractionComparisonProblem> {
        validateConfigFields('fraction-comparison', config, [
            'comparisonFamily',
            'interpretation',
            'relation'
        ]);

        const comparisonFamily = config.comparisonFamily!;
        const interpretation = config.interpretation!;
        const relationLabel = config.relation!;
        const usesCommonDenominator = comparisonFamily === Scope.CommonDenominator
            && interpretation === Area.FractionNumeratorInterpretation;
        const usesCommonNumerator = comparisonFamily === Scope.CommonNumerator
            && interpretation === Area.FractionDenominatorInterpretation;
        if (!usesCommonDenominator && !usesCommonNumerator) {
            throw new GeneratorValidationError(
                'fraction-comparison',
                'CommonDenominator requires FractionNumeratorInterpretation, while CommonNumerator requires FractionDenominatorInterpretation.'
            );
        }
        if (relationLabel !== Scope.Greater && relationLabel !== Scope.Less) {
            throw new GeneratorValidationError(
                'fraction-comparison',
                'The relation must be Greater or Less.'
            );
        }

        const relation = relationLabel === Scope.Greater ? 'greater' as const : 'less' as const;
        const symbol = relation === 'greater' ? '>' as const : '<' as const;
        let first: FractionValue;
        let second: FractionValue;
        let family: FractionComparisonProblem['family'];
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
