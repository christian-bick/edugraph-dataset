import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    DecimalMultiplicationOperand,
    DecimalMultiplicationPartition,
    DecimalMultiplicationPlace,
    DecimalMultiplicationProblem,
    DecimalMultiplicationRegion
} from '../../../types/problems.ts';
import {
    DecimalMultiplicationModelGeneratorSchema,
    type DecimalMultiplicationModelGeneratorConfig
} from './spec.ts';

type Pair = readonly [number, number];
type Profile = 'hundredths-by-hundredths' | 'tenths-by-hundredths'
    | 'two-part-axes' | 'zero-placeholder' | 'three-part-axis';

const MAX_SAMPLED_WIDTH = 120;
const MAX_SAMPLED_HEIGHT = 12;
const PROFILES: readonly Profile[] = [
    'hundredths-by-hundredths',
    'tenths-by-hundredths',
    'two-part-axes',
    'zero-placeholder',
    'three-part-axis'
];
const PLACES: readonly (readonly [DecimalMultiplicationPlace, 1 | 10 | 100])[] = [
    ['ones', 100], ['tenths', 10], ['hundredths', 1]
];

const randomItem = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
const digitAt = (value: number, placeValue: 1 | 10 | 100): number =>
    Math.floor(value / placeValue) % 10;

const canonicalNumeral = (value: number, scale: 100 | 10000): string => {
    const fraction = String(value % scale).padStart(scale === 100 ? 2 : 4, '0')
        .replace(/0+$/, '');
    const whole = String(Math.floor(value / scale));
    return fraction === '' ? whole : `${whole}.${fraction}`;
};

const makeOperand = (valueInHundredths: number): DecimalMultiplicationOperand => {
    const alignedDigits: DecimalMultiplicationOperand['alignedDigits'] = [
        digitAt(valueInHundredths, 100),
        digitAt(valueInHundredths, 10),
        digitAt(valueInHundredths, 1)
    ];
    const partitions: DecimalMultiplicationPartition[] = [];
    let startInHundredths = 0;
    for (const [place, placeValue] of PLACES) {
        const digit = digitAt(valueInHundredths, placeValue);
        if (digit === 0) continue;
        const contribution = digit * placeValue;
        partitions.push({
            place,
            digit,
            valueInHundredths: contribution,
            startInHundredths
        });
        startInHundredths += contribution;
    }
    return {
        valueInHundredths,
        canonicalNumeral: canonicalNumeral(valueInHundredths, 100),
        alignedDigits,
        partitions
    };
};

const makeRegions = (
    first: DecimalMultiplicationOperand,
    second: DecimalMultiplicationOperand
): DecimalMultiplicationRegion[] => first.partitions.flatMap((horizontal, firstPartitionIndex) =>
    second.partitions.map((vertical, secondPartitionIndex) => {
        const cellCount = horizontal.valueInHundredths * vertical.valueInHundredths;
        return {
            firstPartitionIndex,
            secondPartitionIndex,
            columnStart: horizontal.startInHundredths,
            rowStart: vertical.startInHundredths,
            columns: horizontal.valueInHundredths,
            rows: vertical.valueInHundredths,
            cellCount,
            productInTenThousandths: cellCount
        };
    })
);

/** Build a complete exact area model from two integer-hundredth operands. */
export function createDecimalMultiplicationProblem(
    firstInHundredths: number,
    secondInHundredths: number
): DecimalMultiplicationProblem | null {
    if (!Number.isSafeInteger(firstInHundredths)
        || !Number.isSafeInteger(secondInHundredths)
        || firstInHundredths < 0 || firstInHundredths > 999
        || secondInHundredths < 0 || secondInHundredths > 999) return null;

    const first = makeOperand(firstInHundredths);
    const second = makeOperand(secondInHundredths);
    const valueInTenThousandths = firstInHundredths * secondInHundredths;
    const regions = makeRegions(first, second);
    return {
        kind: 'decimal-multiplication-model',
        base: 10,
        operandScale: 100,
        productScale: 10000,
        first,
        second,
        product: {
            valueInTenThousandths,
            canonicalNumeral: canonicalNumeral(valueInTenThousandths, 10000)
        },
        areaGrid: {
            widthInHundredths: firstInHundredths,
            heightInHundredths: secondInHundredths,
            cellAreaInTenThousandths: 1,
            cellCount: valueInTenThousandths,
            regions
        }
    };
}

const candidatePools: Record<Profile, Pair[]> = {
    'hundredths-by-hundredths': [],
    'tenths-by-hundredths': [],
    'two-part-axes': [],
    'zero-placeholder': [],
    'three-part-axis': []
};

// A small exhaustive candidate set gives each sampled profile exact four-place
// products while keeping every countable area grid within 1440 cells.
for (let first = 1; first <= MAX_SAMPLED_WIDTH; first++) {
    if (first % 10 === 0) continue;
    for (let second = 1; second <= MAX_SAMPLED_HEIGHT; second++) {
        if (second % 10 === 0 || first * second % 10 === 0) continue;
        const pair: Pair = [first, second];
        if (first < 10 && second < 10) {
            candidatePools['hundredths-by-hundredths'].push(pair);
        } else if (first >= 11 && first < 100 && second < 10) {
            candidatePools['tenths-by-hundredths'].push(pair);
        } else if (first >= 11 && first < 100 && second >= 11) {
            candidatePools['two-part-axes'].push(pair);
        } else if (first >= 101 && first <= 109 && second < 10) {
            candidatePools['zero-placeholder'].push(pair);
        } else if (first >= 111 && first <= 119 && second >= 11) {
            candidatePools['three-part-axis'].push(pair);
        }
    }
}

export class DecimalMultiplicationModelGenerator implements ProblemGenerator<
    DecimalMultiplicationProblem,
    DecimalMultiplicationModelGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = DecimalMultiplicationModelGeneratorSchema;

    generate(
        config: DecimalMultiplicationModelGeneratorConfig
    ): ProblemStub<DecimalMultiplicationProblem> | null {
        validateConfigFields('decimal-multiplication-model', config, []);
        if (Object.keys(config).length !== 0) {
            throw new GeneratorValidationError(
                'decimal-multiplication-model', 'The configuration contains an unexpected field.'
            );
        }
        const [first, second] = randomItem(candidatePools[randomItem(PROFILES)]);
        const data = createDecimalMultiplicationProblem(first, second);
        return data === null ? null : {data};
    }
}
