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

type OperandInput = Readonly<Pick<
    DecimalPlaceComparisonOperand,
    'wholePart' | 'fractionalDigits' | 'displayPrecision'
>>;

const PLACES: readonly DecimalPlaceComparisonPlace[] = [
    'hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'
];
const DECIDING_PLACE_SAMPLE = [0, 1, 2, 3, 4, 5, 5, 5, 5, 5] as const;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));
const nonzeroDigit = (): number => randomInteger(1, 9);
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

const sampleEqualityPair = (): readonly [OperandInput, OperandInput] => {
    const wholePart = randomInteger(1, 999);
    const fraction = random() < 0.6
        ? [nonzeroDigit(), 0, 0] as const
        : [randomInteger(0, 9), nonzeroDigit(), 0] as const;
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

const sampleInequalityPair = (
    relation: 'greater' | 'less'
): readonly [OperandInput, OperandInput] => {
    const decidingIndex = DECIDING_PLACE_SAMPLE[randomInteger(0, DECIDING_PLACE_SAMPLE.length - 1)]!;
    const sharedWhole = wholeDigits(randomInteger(1, 999));
    const lowDigits = [...sharedWhole, randomInteger(0, 9), randomInteger(0, 9), randomInteger(0, 9)];
    const highDigits = [...lowDigits];
    const noHigherWholeDigit = decidingIndex < 3
        && lowDigits.slice(0, decidingIndex).every(digit => digit === 0);
    const lowerDigit = randomInteger(noHigherWholeDigit ? 1 : 0, 8);
    const higherDigit = randomInteger(lowerDigit + 1, 9);
    lowDigits[decidingIndex] = lowerDigit;
    highDigits[decidingIndex] = higherDigit;
    for (let index = decidingIndex + 1; index < PLACES.length; index++) {
        lowDigits[index] = randomInteger(0, 9);
        highDigits[index] = randomInteger(0, 9);
    }

    // The shorter numeral can end before the thousandths place. The opposite
    // operand still exposes a genuine thousandths contribution in every pair.
    if (decidingIndex < 5 && random() < 0.5) {
        if (decidingIndex < 4) lowDigits[4] = 0;
        lowDigits[5] = 0;
        highDigits[5] = nonzeroDigit();
    } else if (lowDigits[5] === 0 && highDigits[5] === 0) {
        highDigits[5] = nonzeroDigit();
    }

    const low = inputFromDigits(lowDigits);
    const high = inputFromDigits(highDigits);
    return relation === 'less' ? [low, high] : [high, low];
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
        validateConfigFields('decimal-place-comparison', config, ['comparisonKind', 'relation']);
        if (Object.keys(config).some(key => key !== 'comparisonKind' && key !== 'relation')) {
            throw new GeneratorValidationError(
                'decimal-place-comparison', 'The configuration contains an unexpected field.'
            );
        }
        if (config.relation !== 'greater' && config.relation !== 'equal'
            && config.relation !== 'less') {
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

        const [left, right] = config.relation === 'equal'
            ? sampleEqualityPair()
            : sampleInequalityPair(config.relation);
        const data = createDecimalPlaceComparison(left, right);
        return data === null ? null : {data};
    }
}
