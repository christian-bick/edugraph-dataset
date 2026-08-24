import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionEquivalenceProblem,
    FractionParts,
    FractionValue,
    ProperFractionEquivalenceProblem,
    TenthsToHundredthsProblem
} from '../../../types/problems.ts';
import {
    FractionEquivalenceGeneratorConfig,
    FractionEquivalenceGeneratorSchema
} from './spec.ts';
import {toDecimalFraction} from '../tenths-hundredths.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
const SCALE_FACTORS = [2, 3, 4] as const;
const WHOLE_NUMBERS = [1, 2, 3] as const;
type EquivalentPair = {
    firstNumerator: number;
    firstDenominator: FractionParts;
    scaleFactor: 2 | 3 | 4;
};

const EQUIVALENT_PAIRS: EquivalentPair[] = DENOMINATORS.flatMap(firstDenominator =>
    SCALE_FACTORS.flatMap(scaleFactor => {
        const secondDenominator = firstDenominator * scaleFactor;
        if (!DENOMINATORS.includes(secondDenominator as FractionParts)) return [];

        return Array.from({length: firstDenominator - 1}, (_, index) => ({
            firstNumerator: index + 1,
            firstDenominator,
            scaleFactor
        }));
    })
);

const randomItem = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)];

const toFractionValue = (numerator: number, denominator: FractionParts): FractionValue => ({
    numerator,
    denominator
});

const generateTenthsToHundredths = (): TenthsToHundredthsProblem => {
    const numerator = Math.floor(random() * 10) + 1;
    const scaledNumerator = numerator * 10;
    const tenths = toDecimalFraction(numerator, 10);
    const hundredths = toDecimalFraction(scaledNumerator, 100);

    return {
        task: 'tenths-to-hundredths',
        tenths,
        hundredths,
        scaleFactor: 10,
        sharedWhole: 1,
        relation: 'equal'
    };
};

const generateProperEquivalence = (): ProperFractionEquivalenceProblem => {
    const pair = randomItem(EQUIVALENT_PAIRS);
    const secondNumerator = pair.firstNumerator * pair.scaleFactor;
    const secondDenominator = pair.firstDenominator * pair.scaleFactor as FractionParts;
    const first = toFractionValue(pair.firstNumerator, pair.firstDenominator);
    const second = toFractionValue(secondNumerator, secondDenominator);

    return {
        task: 'relate-equivalent-fractions',
        first,
        second,
        scaleFactor: pair.scaleFactor,
        relation: 'equal'
    };
};

export class FractionEquivalenceGenerator implements ProblemGenerator<
    FractionEquivalenceProblem,
    FractionEquivalenceGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionEquivalenceGeneratorSchema;

    generate(config: FractionEquivalenceGeneratorConfig): ProblemStub<FractionEquivalenceProblem> {
        validateConfigFields('fraction-equivalence', config, [
            'usesMultiplication',
            'usesEqualShares',
            'usesProperFractions',
            'usesImproperFractions',
            'usesIntegerNumbers',
            'usesTenthFractions'
        ]);

        const usesMultiplication = config.usesMultiplication === true;
        const usesProperFractions = config.usesProperFractions === true;
        const usesTenthFractions = config.usesTenthFractions === true;
        const usesEqualShareMode = config.usesEqualShares === true
            && (usesProperFractions !== usesTenthFractions)
            && config.usesImproperFractions === false
            && config.usesIntegerNumbers === false;
        const usesWholeNumberMode = config.usesEqualShares === false
            && config.usesImproperFractions === true
            && config.usesIntegerNumbers === true;

        if (usesEqualShareMode) {
            if (usesTenthFractions && !usesMultiplication) {
                throw new GeneratorValidationError(
                    'fraction-equivalence',
                    'TenthFractions requires Multiplication to express the 10-to-100 denominator relation.'
                );
            }
            const data = usesTenthFractions
                ? generateTenthsToHundredths()
                : generateProperEquivalence();
            return {data};
        }

        if (usesWholeNumberMode
            && !usesMultiplication
            && !usesProperFractions
            && !usesTenthFractions) {
            const wholeNumber = randomItem(WHOLE_NUMBERS);
            const denominator = randomItem(DENOMINATORS);
            const fraction = toFractionValue(wholeNumber * denominator, denominator);

            return {
                data: {
                    task: 'represent-whole-as-fraction',
                    wholeNumber,
                    fraction,
                    relation: 'equal'
                }
            };
        }

        throw new GeneratorValidationError(
            'fraction-equivalence',
            'Select EqualShares with exactly one of ProperFractions or TenthFractions, or select ImproperFractions and IntegerNumbers for whole-number equivalence. TenthFractions is only supported with Multiplication.'
        );
    }
}
