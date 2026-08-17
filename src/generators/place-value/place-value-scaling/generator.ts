import {validateConfigFields} from '../../../lib/errors.ts';
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

const createOtherDigit = (repeatedDigit: number, isLeading: boolean): number => {
    const minimum = isLeading ? 1 : 0;
    return randomItem(
        Array.from({length: 10 - minimum}, (_, index) => index + minimum)
            .filter(digit => digit !== repeatedDigit)
    );
};

const displayPlaceName = (name: PlaceValueName): string => name.replaceAll('-', ' ');

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
        validateConfigFields('place-value-scaling', config, []);

        const repeatedDigit = randomInteger(1, 9);
        const leftDigitIndex = randomInteger(0, 4);
        const digitAt = (index: number): number =>
            index === leftDigitIndex || index === leftDigitIndex + 1
                ? repeatedDigit
                : createOtherDigit(repeatedDigit, index === 0);
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
                scaleFactor: 10,
                prompt: `The ${repeatedDigit} in the ${displayPlaceName(rightPlace.name)} place represents ${rightPlace.value}. What value does the same digit represent in the adjacent ${displayPlaceName(leftPlace.name)} place?`,
                questionMultiplicationEquation: `${rightPlace.value} × 10 = ?`,
                questionDivisionEquation: `? ÷ 10 = ${rightPlace.value}`,
                multiplicationEquation: `${rightPlace.value} × 10 = ${leftPlace.value}`,
                divisionEquation: `${leftPlace.value} ÷ 10 = ${rightPlace.value}`,
                comparisonStatement: `The ${repeatedDigit} in the ${displayPlaceName(leftPlace.name)} place represents 10 times as much as the ${repeatedDigit} in the ${displayPlaceName(rightPlace.name)} place.`,
                answer: leftPlace.value
            }
        };
    }
}
