import {validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    StandardMultiplicationPartialRow,
    StandardMultiplicationProblem,
    StandardMultiplicationSumColumn
} from '../../../types/problems.ts';
import {
    StandardAlgorithmMultiplicationGeneratorConfig,
    StandardAlgorithmMultiplicationGeneratorSchema
} from './spec.ts';
import {sampleStandardMultiplicationFactors} from './domain.ts';

const digitsFromOnes = (value: number): number[] =>
    String(value).split('').reverse().map(Number);

const digitAt = (value: number, placeIndex: number): number =>
    Math.floor(value / 10 ** placeIndex) % 10;

function buildPartialRow(
    multiplicand: number,
    multiplierDigit: number,
    shiftPlaces: number
): StandardMultiplicationPartialRow {
    let carry = 0;
    const columns = digitsFromOnes(multiplicand).map((multiplicandDigit, placeIndex) => {
        const carryIn = carry;
        const workingValue = multiplicandDigit * multiplierDigit + carryIn;
        const resultDigit = workingValue % 10;
        const carryOut = Math.floor(workingValue / 10);
        carry = carryOut;
        return {placeIndex, multiplicandDigit, carryIn, workingValue, resultDigit, carryOut};
    });
    const unshiftedProduct = multiplicand * multiplierDigit;
    return {
        shiftPlaces,
        multiplierDigit,
        columns,
        leadingCarry: carry,
        unshiftedProduct,
        alignedProduct: unshiftedProduct * 10 ** shiftPlaces
    };
}

function buildSumColumns(
    partialRows: readonly StandardMultiplicationPartialRow[],
    product: number
): StandardMultiplicationSumColumn[] {
    let carry = 0;
    return Array.from({length: String(product).length}, (_, placeIndex) => {
        const addendDigits = partialRows.map(row => digitAt(row.alignedProduct, placeIndex));
        const carryIn = carry;
        const workingValue = addendDigits.reduce((sum, digit) => sum + digit, carryIn);
        const resultDigit = workingValue % 10;
        const carryOut = Math.floor(workingValue / 10);
        carry = carryOut;
        return {placeIndex, addendDigits, carryIn, workingValue, resultDigit, carryOut};
    });
}

/** Builds every conventional row and carry before a view chooses what to leave blank. */
export function buildStandardMultiplicationProblem(
    multiplicand: number,
    multiplier: number
): StandardMultiplicationProblem {
    if (!Number.isSafeInteger(multiplicand) || multiplicand < 10 || multiplicand > 9999
        || !Number.isSafeInteger(multiplier) || multiplier < 10 || multiplier > 999) {
        throw new RangeError('Standard multiplication requires a 2–4-digit multiplicand and a 2–3-digit multiplier.');
    }
    const product = multiplicand * multiplier;
    const partialRows = digitsFromOnes(multiplier).map((multiplierDigit, shiftPlaces) =>
        buildPartialRow(multiplicand, multiplierDigit, shiftPlaces)
    );
    return {
        kind: 'whole-number-standard-multiplication',
        multiplicand,
        multiplier,
        product,
        partialRows,
        sumColumns: buildSumColumns(partialRows, product)
    };
}

export class StandardAlgorithmMultiplicationGenerator implements ProblemGenerator<
    StandardMultiplicationProblem,
    StandardAlgorithmMultiplicationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = StandardAlgorithmMultiplicationGeneratorSchema;

    generate(
        config: StandardAlgorithmMultiplicationGeneratorConfig
    ): ProblemStub<StandardMultiplicationProblem> {
        validateConfigFields('standard-algorithm-multiplication', config, ['range']);
        const [multiplicand, multiplier] = sampleStandardMultiplicationFactors(config.range!);
        return {data: buildStandardMultiplicationProblem(multiplicand, multiplier)};
    }
}
