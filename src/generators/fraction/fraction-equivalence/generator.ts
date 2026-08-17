import {Ability} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionEquivalenceProblem,
    FractionParts,
    FractionScalingNumberLineTick,
    FractionValue,
    TenthsToHundredthsProblem
} from '../../../types/problems.ts';
import {
    FractionEquivalenceGeneratorConfig,
    FractionEquivalenceGeneratorSchema
} from './spec.ts';
import {toDecimalFraction, toTenthsHundredthsGrid} from '../tenths-hundredths.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
const SCALE_FACTORS = [2, 3, 4] as const;
const WHOLE_NUMBERS = [1, 2, 3] as const;
const PART_SIZE_PHRASES = {
    2: 'one-half',
    3: 'one-third',
    4: 'one-fourth'
} as const;

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
    denominator,
    notation: `${numerator}/${denominator}`
});

const toNumberLineTicks = (denominator: FractionParts): FractionScalingNumberLineTick[] =>
    Array.from({length: denominator + 1}, (_, index) => ({
        index,
        xPercent: index / denominator * 100,
        label: index === 0 ? '0' : index === denominator ? '1' : ''
    }));

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
        numeratorScale: {
            from: numerator,
            factor: 10,
            result: scaledNumerator,
            equation: `${numerator} × 10 = ${scaledNumerator}`
        },
        denominatorScale: {
            from: 10,
            factor: 10,
            result: 100,
            equation: '10 × 10 = 100'
        },
        questionPrompt: 'Complete the equivalent fraction by expressing the tenths as hundredths.',
        questionEquation: `${tenths.notation} = ?/100`,
        solutionEquation: `${tenths.notation} = (${numerator} × 10)/(10 × 10) = ${hundredths.notation}`,
        models: {
            tenths: toTenthsHundredthsGrid(numerator, 10),
            hundredths: toTenthsHundredthsGrid(scaledNumerator, 100)
        },
        relation: 'equal',
        answer: String(scaledNumerator),
        answerStatement: `${tenths.notation} is equivalent to ${hundredths.notation}.`,
        explanation: `Multiplying the numerator and denominator of ${tenths.notation} by 10 makes 10 times as many equal parts. Each tenth becomes 10 hundredths, so ${hundredths.notation} shades the same amount.`
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
            'taskAbilities',
            'usesMultiplication',
            'usesEqualShares',
            'usesImproperFractions',
            'usesIntegerNumbers'
        ]);

        const taskAbilities = config.taskAbilities!;
        if (!Array.isArray(taskAbilities)) {
            throw new GeneratorValidationError(
                'fraction-equivalence',
                'The taskAbilities field must be an array.'
            );
        }

        const recognizesEquivalence = taskAbilities.length === 1
            && taskAbilities.includes(Ability.ConceptDerivation);
        const generatesEquivalence = taskAbilities.length === 2
            && taskAbilities.includes(Ability.Formalization)
            && taskAbilities.includes(Ability.ProcedureUnderstanding);
        const representsWhole = taskAbilities.length === 1
            && taskAbilities.includes(Ability.Formalization);
        const usesMultiplication = config.usesMultiplication === true;
        const usesProperFractionMode = config.usesEqualShares === true
            && config.usesImproperFractions === false
            && config.usesIntegerNumbers === false;
        const usesWholeNumberMode = config.usesEqualShares === false
            && config.usesImproperFractions === true
            && config.usesIntegerNumbers === true;

        if (usesProperFractionMode && representsWhole && usesMultiplication) {
            return {data: generateTenthsToHundredths()};
        }

        if (usesWholeNumberMode && representsWhole && !usesMultiplication) {
            const wholeNumber = randomItem(WHOLE_NUMBERS);
            const denominator = randomItem(DENOMINATORS);
            const fraction = toFractionValue(wholeNumber * denominator, denominator);
            const groupWord = wholeNumber === 1 ? 'group' : 'groups';

            return {
                data: {
                    task: 'represent-whole-as-fraction',
                    wholeNumber,
                    fraction,
                    relation: 'equal',
                    equation: `${wholeNumber} = ${fraction.notation}`,
                    explanation: `${fraction.notation} contains ${wholeNumber} ${groupWord} of ${denominator}/${denominator}, so it equals ${wholeNumber}.`,
                    answer: fraction.notation
                }
            };
        }

        if (!usesProperFractionMode
            || (!recognizesEquivalence && !generatesEquivalence)
            || (usesMultiplication && !generatesEquivalence)) {
            throw new GeneratorValidationError(
                'fraction-equivalence',
                'Select EqualShares with ConceptDerivation or Formalization plus ProcedureUnderstanding, or select ImproperFractions and IntegerNumbers with Formalization.'
            );
        }

        const pair = randomItem(EQUIVALENT_PAIRS);
        const secondNumerator = pair.firstNumerator * pair.scaleFactor;
        const secondDenominator = pair.firstDenominator * pair.scaleFactor as FractionParts;
        const first = toFractionValue(pair.firstNumerator, pair.firstDenominator);
        const second = toFractionValue(secondNumerator, secondDenominator);
        if (usesMultiplication) {
            const commonPointXPercent = first.numerator / first.denominator * 100;
            const numeratorEquation = `${first.numerator} × ${pair.scaleFactor} = ${second.numerator}`;
            const denominatorEquation = `${first.denominator} × ${pair.scaleFactor} = ${second.denominator}`;

            return {
                data: {
                    task: 'scale-equivalence',
                    first,
                    second,
                    scaleFactor: pair.scaleFactor,
                    sharedWhole: 1,
                    numeratorScale: {
                        from: first.numerator,
                        factor: pair.scaleFactor,
                        result: second.numerator,
                        equation: numeratorEquation
                    },
                    denominatorScale: {
                        from: first.denominator,
                        factor: pair.scaleFactor,
                        result: second.denominator,
                        equation: denominatorEquation
                    },
                    questionEquation: `${first.notation} = ?/${second.denominator}`,
                    scalingEquation: `${first.notation} = (${first.numerator} × ${pair.scaleFactor})/(${first.denominator} × ${pair.scaleFactor}) = ${second.notation}`,
                    firstUnitPart: `1/${first.denominator}`,
                    secondUnitPart: `1/${second.denominator}`,
                    barModel: {
                        first: {
                            partCount: first.denominator,
                            shadedCount: first.numerator
                        },
                        second: {
                            partCount: second.denominator,
                            shadedCount: second.numerator
                        }
                    },
                    numberLineModel: {
                        firstTicks: toNumberLineTicks(first.denominator),
                        secondTicks: toNumberLineTicks(second.denominator),
                        firstPoint: {
                            tickIndex: first.numerator,
                            xPercent: commonPointXPercent,
                            label: first.notation
                        },
                        secondPoint: {
                            tickIndex: second.numerator,
                            xPercent: commonPointXPercent,
                            label: second.notation
                        },
                        coLocatedXPercent: commonPointXPercent
                    },
                    relation: 'equal',
                    answer: String(second.numerator),
                    answerStatement: `${first.notation} = ${second.notation}.`,
                    explanation: `Multiplying the numerator and denominator of ${first.notation} by ${pair.scaleFactor} makes ${pair.scaleFactor} times as many equal parts. Each new part is ${PART_SIZE_PHRASES[pair.scaleFactor]} as large, so ${second.notation} shades the same amount as ${first.notation}.`
                }
            };
        }

        const task = recognizesEquivalence
            ? 'recognize-equivalence' as const
            : 'generate-equivalence' as const;

        return {
            data: {
                task,
                first,
                second,
                scaleFactor: pair.scaleFactor,
                relation: 'equal',
                equation: `${first.notation} = ${second.notation}`,
                explanation: `${first.notation} is equivalent to ${second.notation} because its numerator and denominator are multiplied by ${pair.scaleFactor}.`,
                answer: task === 'recognize-equivalence' ? 'equivalent' : second.notation
            }
        };
    }
}
