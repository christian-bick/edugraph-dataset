import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    PlaceValueName,
    PlaceValueScalingPlace,
    PlaceValueScalingProblem
} from '../../../types/problems.ts';
import {
    PlaceValueScalingGeneratorConfig,
    PlaceValueScalingGeneratorSchema
} from './spec.ts';

const PLACE_NAMES: readonly PlaceValueName[] = [
    'ones',
    'tens',
    'hundreds',
    'thousands',
    'ten-thousands',
    'hundred-thousands'
];

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const randomItem = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)]!;

const createOtherDigit = (repeatedDigit: number, requirePositive: boolean): number => {
    const minimum = requirePositive ? 1 : 0;
    return randomItem(
        Array.from({length: 10 - minimum}, (_, index) => index + minimum)
            .filter(digit => digit !== repeatedDigit)
    );
};

const weightedIndex = (weights: readonly number[]): number => {
    let position = random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index < weights.length; index++) {
        if (position < weights[index]!) return index;
        position -= weights[index]!;
    }
    return weights.length - 1;
};

const otherNonleadingPlaces = (leftDigitIndex: number): number[] =>
    [1, 2, 3, 4, 5].filter(index => index !== leftDigitIndex && index !== leftDigitIndex + 1);

const createPlace = (
    repeatedDigit: number,
    exponent: 0 | 1 | 2 | 3 | 4 | 5
): PlaceValueScalingPlace => ({
    name: PLACE_NAMES[exponent]!,
    exponent,
    digitIndex: 5 - exponent,
    value: repeatedDigit * 10 ** exponent
});

export class PlaceValueScalingGenerator implements ProblemGenerator<
    PlaceValueScalingProblem,
    PlaceValueScalingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueScalingGeneratorSchema;

    generate(config: PlaceValueScalingGeneratorConfig): ProblemStub<PlaceValueScalingProblem> {
        validateConfigFields('place-value-scaling', config, ['hasZeroCoefficient']);
        if (typeof config.hasZeroCoefficient !== 'boolean') {
            throw new GeneratorValidationError('place-value-scaling', 'Expected a boolean zero-coefficient profile.');
        }

        const repeatedDigit = randomInteger(1, 9);
        // Preserve the old distribution conditional on coefficient presence: the old
        // adjacent position is uniform, and each other nonleading digit has nine choices.
        const leftDigitIndex = weightedIndex([0, 1, 2, 3, 4].map(left => {
            const absence = (8 / 9) ** otherNonleadingPlaces(left).length;
            return config.hasZeroCoefficient ? 1 - absence : absence;
        }));
        const otherPlaces = otherNonleadingPlaces(leftDigitIndex);
        // Choose the first zero, then positive prefix digits and unrestricted suffix
        // digits. These disjoint blocks retain every zero pattern without double counting.
        const firstZero = config.hasZeroCoefficient ? otherPlaces[weightedIndex(otherPlaces.map((_, index) =>
            8 ** index * 9 ** (otherPlaces.length - index - 1)))]! : -1;
        const digitAt = (index: number): number =>
            index === leftDigitIndex || index === leftDigitIndex + 1
                ? repeatedDigit
                : index === firstZero ? 0
                    : createOtherDigit(repeatedDigit, index === 0 || !config.hasZeroCoefficient || index < firstZero);
        const digits: PlaceValueScalingProblem['digits'] = [
            digitAt(0),
            digitAt(1),
            digitAt(2),
            digitAt(3),
            digitAt(4),
            digitAt(5)
        ];
        const number = digits.reduce((value, digit) => value * 10 + digit, 0);
        const leftExponent = (5 - leftDigitIndex) as PlaceValueScalingPlace['exponent'];
        const rightExponent = (leftExponent - 1) as PlaceValueScalingPlace['exponent'];
        const leftPlace = createPlace(repeatedDigit, leftExponent);
        const rightPlace = createPlace(repeatedDigit, rightExponent);

        return {
            data: {
                task: 'adjacent-place-scaling',
                number,
                digits,
                repeatedDigit,
                leftPlace,
                rightPlace,
                scaleFactor: 10
            }
        };
    }
}
