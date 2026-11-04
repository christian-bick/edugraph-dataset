import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    DecimalPlaceComparisonOperand,
    DecimalPlaceComparisonPlace,
    DecimalPlaceComparisonProblem
} from '../../../types/problems.ts';
import {
    DecimalPlaceComparisonGeneratorSchema,
    type DecimalPlaceComparisonGeneratorConfig
} from './spec.ts';
import {decimalComparisonRangeCases, decimalEqualityRangeBlocks} from './domain.ts';

type OperandInput = Readonly<Pick<
    DecimalPlaceComparisonOperand,
    'wholePart' | 'fractionalDigits' | 'displayPrecision'
>>;

const PLACES: readonly DecimalPlaceComparisonPlace[] = [
    'hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'
];

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));
const wholeDigits = (wholePart: number): readonly [number, number, number] => [
    Math.floor(wholePart / 100),
    Math.floor(wholePart / 10) % 10,
    wholePart % 10
];
const wholePartOf = (digits: readonly number[]): number =>
    digits[0]! * 100 + digits[1]! * 10 + digits[2]!;

const validInput = (input: OperandInput): boolean =>
    Number.isInteger(input.wholePart)
    && input.wholePart >= 0
    && input.wholePart <= 999
    && (input.displayPrecision === 1 || input.displayPrecision === 2
        || input.displayPrecision === 3)
    && Array.isArray(input.fractionalDigits)
    && input.fractionalDigits.length === 3
    && input.fractionalDigits.every(digit => Number.isInteger(digit)
        && digit >= 0 && digit <= 9)
    && input.fractionalDigits.slice(input.displayPrecision).every(digit => digit === 0);

const makeOperand = (input: OperandInput): DecimalPlaceComparisonOperand => {
    const [tenths, hundredths, thousandths] = input.fractionalDigits;
    return {
        ...input,
        wholeDigits: wholeDigits(input.wholePart),
        displayNumeral: `${input.wholePart}.${input.fractionalDigits
            .slice(0, input.displayPrecision).join('')}`,
        valueInThousandths: input.wholePart * 1000
            + tenths * 100 + hundredths * 10 + thousandths
    };
};

/** Build the exact relation and its first unequal place from aligned base-ten digits. */
export function createDecimalPlaceComparison(
    leftInput: OperandInput,
    rightInput: OperandInput
): DecimalPlaceComparisonProblem | null {
    if (!validInput(leftInput) || !validInput(rightInput)) return null;
    const left = makeOperand(leftInput);
    const right = makeOperand(rightInput);
    const leftDigits = [...left.wholeDigits, ...left.fractionalDigits];
    const rightDigits = [...right.wholeDigits, ...right.fractionalDigits];
    const decidingIndex = leftDigits.findIndex((digit, index) => digit !== rightDigits[index]);

    if (decidingIndex === -1) {
        return {
            kind: 'decimal-place-comparison', base: 10, left, right,
            relation: 'equal',
            witness: {kind: 'all-places-equal', equalPlaces: PLACES}
        };
    }

    return {
        kind: 'decimal-place-comparison', base: 10, left, right,
        relation: left.valueInThousandths > right.valueInThousandths ? 'greater' : 'less',
        witness: {
            kind: 'first-difference',
            decidingPlace: PLACES[decidingIndex]!,
            higherEqualPlaces: PLACES.slice(0, decidingIndex),
            leftDigit: leftDigits[decidingIndex]!,
            rightDigit: rightDigits[decidingIndex]!
        }
    };
}

const sampleDisplayPrecision = (fractionalDigits: readonly number[]): 1 | 2 | 3 => {
    const minimum = fractionalDigits[2] !== 0 ? 3 : fractionalDigits[1] !== 0 ? 2 : 1;
    return randomInteger(minimum, 3) as 1 | 2 | 3;
};

const weightedChoice = <T extends {weight: number}>(choices: readonly T[]): T => {
    if (!choices.length) throw new GeneratorValidationError('decimal-place-comparison', 'No operand pairs support this range and zero profile.');
    let remaining = random() * choices.reduce((sum, choice) => sum + choice.weight, 0);
    return choices.find(choice => (remaining -= choice.weight) < 0) ?? choices[choices.length - 1]!;
};
const uniformChoice = (values: readonly number[]): number => values[Math.floor(random() * values.length)]!;
const sampleEqualityPair = (config: DecimalPlaceComparisonGeneratorConfig): readonly [OperandInput, OperandInput] => {
    const block = weightedChoice(decimalEqualityRangeBlocks(config.range!));
    const wholePart = uniformChoice(block.wholes);
    const fraction = [uniformChoice(block.tenths), uniformChoice(block.hundredths), 0] as const;
    const shorterPrecision = fraction[1] === 0 ? 1 : 2;
    const shorter: OperandInput = {
        wholePart, fractionalDigits: fraction, displayPrecision: shorterPrecision
    };
    const longer: OperandInput = {
        wholePart, fractionalDigits: fraction, displayPrecision: 3
    };
    return random() < 0.5 ? [shorter, longer] : [longer, shorter];
};

const inputFromDigits = (digits: readonly number[]): OperandInput => {
    const fractionalDigits = [digits[3]!, digits[4]!, digits[5]!] as const;
    return {
        wholePart: wholePartOf(digits),
        fractionalDigits,
        displayPrecision: sampleDisplayPrecision(fractionalDigits)
    };
};

const sampleInequalityPair = (config: DecimalPlaceComparisonGeneratorConfig): readonly [OperandInput, OperandInput] => {
    const block = weightedChoice(decimalComparisonRangeCases(config.range!));
    const [lowDigits, highDigits] = block.sample(random);
    const low = inputFromDigits(lowDigits);
    const high = inputFromDigits(highDigits);
    return config.relation!.startsWith('less') ? [low, high] : [high, low];
};

export class DecimalPlaceComparisonGenerator implements ProblemGenerator<
    DecimalPlaceComparisonProblem,
    DecimalPlaceComparisonGeneratorConfig
> {
    type: AbstractProblem['type'] = 'comparison';
    schema = DecimalPlaceComparisonGeneratorSchema;

    generate(
        config: DecimalPlaceComparisonGeneratorConfig
    ): ProblemStub<DecimalPlaceComparisonProblem> | null {
        validateConfigFields('decimal-place-comparison', config, ['comparisonKind', 'relation', 'range']);
        if (Object.keys(config).some(key => !['comparisonKind', 'relation', 'range'].includes(key))) {
            throw new GeneratorValidationError(
                'decimal-place-comparison', 'The configuration contains an unexpected field.'
            );
        }
        if (!['greater', 'equal', 'less'].includes(config.relation!)) {
            throw new GeneratorValidationError(
                'decimal-place-comparison', 'The relation must be Greater, Equal, or Less.'
            );
        }
        const expectedKind = config.relation === 'equal' ? 'equality' : 'inequality';
        if (config.comparisonKind !== expectedKind) {
            throw new GeneratorValidationError(
                'decimal-place-comparison',
                'Equal requires NumericEquality; Greater and Less require NumericInequality.'
            );
        }

        const pair = config.relation === 'equal'
            ? sampleEqualityPair(config)
            : sampleInequalityPair(config);
        const [left, right] = pair;
        const data = createDecimalPlaceComparison(left, right);
        return data === null ? null : {data};
    }
}
