import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionParts,
    FractionUnitMultiplier,
    FractionValue,
    ProperFractionUnitScalingProblem
} from '../../../types/problems.ts';
import {
    FractionEquivalenceGeneratorConfig,
    FractionEquivalenceGeneratorSchema
} from './spec.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
const SCALE_FACTORS = [2, 3, 4] as const;
const UNIT_MULTIPLIERS = {
    2: {numerator: 2, denominator: 2, value: 1},
    3: {numerator: 3, denominator: 3, value: 1},
    4: {numerator: 4, denominator: 4, value: 1}
} as const satisfies Record<(typeof SCALE_FACTORS)[number], FractionUnitMultiplier>;
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

const generateProperEquivalence = (): ProperFractionUnitScalingProblem => {
    const pair = randomItem(EQUIVALENT_PAIRS);
    const secondNumerator = pair.firstNumerator * pair.scaleFactor;
    const secondDenominator = pair.firstDenominator * pair.scaleFactor as FractionParts;
    const first = toFractionValue(pair.firstNumerator, pair.firstDenominator);
    const second = toFractionValue(secondNumerator, secondDenominator);
    const unitMultiplier = UNIT_MULTIPLIERS[pair.scaleFactor];

    return {
        task: 'relate-equivalent-fractions',
        first,
        second,
        scaleFactor: pair.scaleFactor,
        unitMultiplier,
        relation: 'equal'
    };
};

export class FractionEquivalenceGenerator implements ProblemGenerator<
    ProperFractionUnitScalingProblem,
    FractionEquivalenceGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionEquivalenceGeneratorSchema;

    generate(config: FractionEquivalenceGeneratorConfig): ProblemStub<ProperFractionUnitScalingProblem> {
        validateConfigFields('fraction-equivalence', config, ['usesMultiplication', 'usesProportionalScaling']);
        if (typeof config.usesMultiplication !== 'boolean') {
            throw new GeneratorValidationError('fraction-equivalence', 'Expected a multiplication constraint.');
        }
        if (typeof config.usesProportionalScaling !== 'boolean') {
            throw new GeneratorValidationError('fraction-equivalence', 'Expected a proportional scaling constraint.');
        }
        return {data: generateProperEquivalence()};
    }
}
