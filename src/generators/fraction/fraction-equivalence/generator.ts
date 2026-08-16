import {Ability} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionEquivalenceProblem,
    FractionParts,
    FractionValue
} from '../../../types/problems.ts';
import {
    FractionEquivalenceGeneratorConfig,
    FractionEquivalenceGeneratorSchema
} from './spec.ts';

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
    denominator,
    notation: `${numerator}/${denominator}`
});

export class FractionEquivalenceGenerator implements ProblemGenerator<
    FractionEquivalenceProblem,
    FractionEquivalenceGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionEquivalenceGeneratorSchema;

    generate(config: FractionEquivalenceGeneratorConfig): ProblemStub<FractionEquivalenceProblem> {
        validateConfigFields('fraction-equivalence', config, [
            'taskAbilities',
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
        const usesProperFractionMode = config.usesEqualShares === true
            && config.usesImproperFractions === false
            && config.usesIntegerNumbers === false;
        const usesWholeNumberMode = config.usesEqualShares === false
            && config.usesImproperFractions === true
            && config.usesIntegerNumbers === true;

        if (usesWholeNumberMode && representsWhole) {
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

        if (!usesProperFractionMode || (!recognizesEquivalence && !generatesEquivalence)) {
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
