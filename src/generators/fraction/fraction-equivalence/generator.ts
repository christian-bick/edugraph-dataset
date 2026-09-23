import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionParts,
    FractionValue,
    ProperFractionEquivalenceProblem
} from '../../../types/problems.ts';
import {
    FractionEquivalenceGeneratorConfig,
    FractionEquivalenceGeneratorSchema
} from './spec.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
const SCALE_FACTORS = [2, 3, 4] as const;
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
    ProperFractionEquivalenceProblem,
    FractionEquivalenceGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionEquivalenceGeneratorSchema;

    generate(config: FractionEquivalenceGeneratorConfig): ProblemStub<ProperFractionEquivalenceProblem> {
        validateConfigFields('fraction-equivalence', config, ['usesMultiplication']);
        if (typeof config.usesMultiplication !== 'boolean') {
            throw new GeneratorValidationError('fraction-equivalence', 'Expected a multiplication constraint.');
        }
        return {data: generateProperEquivalence()};
    }
}
