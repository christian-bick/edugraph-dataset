import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalStandardMultiplicationProblem, StandardMultiplicationPartialRow, StandardMultiplicationSumColumn} from '../../../types/problems.ts';
import {decimalDigits, exactDecimal, parseExactDecimal, validateMagnitudeRange} from '../standard-decimal-helpers.ts';
import {StandardAlgorithmDecimalMultiplicationGeneratorSchema, type StandardAlgorithmDecimalMultiplicationGeneratorConfig} from './spec.ts';

const generatorId = 'standard-algorithm-decimal-multiplication';
const randomInteger = (min: number, max: number): number => min + Math.floor(random() * (max - min + 1));
const digitAt = (value: number, place: number): number => Math.floor(value / 10 ** place) % 10;

/** Exact coefficient arithmetic; supplied decimal places are restored only after all rows. */
export function buildDecimalStandardMultiplicationProblem(
    multiplicandNumeral: string, multiplierNumeral: string
): DecimalStandardMultiplicationProblem {
    const multiplicand = parseExactDecimal(multiplicandNumeral, generatorId);
    const multiplier = parseExactDecimal(multiplierNumeral, generatorId);
    const rawProduct = BigInt(multiplicand.coefficient) * BigInt(multiplier.coefficient);
    if (rawProduct > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new GeneratorValidationError(generatorId, 'The unscaled product must be a safe integer.');
    }
    const unscaledProduct = Number(rawProduct);
    const product = exactDecimal(unscaledProduct, multiplicand.scale + multiplier.scale, generatorId);
    const multiplicandDigits = decimalDigits(multiplicand.coefficient, generatorId);
    const multiplierDigits = decimalDigits(multiplier.coefficient, generatorId);
    const partialRows: StandardMultiplicationPartialRow[] = [...multiplierDigits].reverse().map((multiplierDigit, shiftPlaces) => {
        let carry = 0;
        const columns = [...multiplicandDigits].reverse().map((multiplicandDigit, placeIndex) => {
            const carryIn = carry;
            const workingValue = multiplicandDigit * multiplierDigit + carryIn;
            carry = Math.floor(workingValue / 10);
            return {placeIndex, multiplicandDigit, carryIn, workingValue, resultDigit: workingValue % 10, carryOut: carry};
        });
        const unshiftedProduct = multiplicand.coefficient * multiplierDigit;
        return {shiftPlaces, multiplierDigit, columns, leadingCarry: carry,
            unshiftedProduct, alignedProduct: unshiftedProduct * 10 ** shiftPlaces};
    });
    let carry = 0;
    const coefficientDigits = decimalDigits(unscaledProduct, generatorId);
    const sumColumns: StandardMultiplicationSumColumn[] = coefficientDigits.map((_, placeIndex) => {
        const addendDigits = partialRows.map(row => digitAt(row.alignedProduct, placeIndex));
        const carryIn = carry;
        const workingValue = addendDigits.reduce((sum, digit) => sum + digit, carryIn);
        carry = Math.floor(workingValue / 10);
        return {placeIndex, addendDigits, carryIn, workingValue, resultDigit: workingValue % 10, carryOut: carry};
    });
    const paddedDigits = product.numeral.replace('.', '').split('').map(Number);
    return {kind: 'decimal-standard-multiplication', base: 10, multiplicand, multiplier,
        multiplicandDigits, multiplierDigits, product, unscaledProduct, partialRows, sumColumns,
        decimalPlacement: {totalScale: product.scale, coefficientDigits, paddedDigits,
            decimalIndex: paddedDigits.length - product.scale}};
}

export class StandardAlgorithmDecimalMultiplicationGenerator implements ProblemGenerator<
    DecimalStandardMultiplicationProblem, StandardAlgorithmDecimalMultiplicationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = StandardAlgorithmDecimalMultiplicationGeneratorSchema;

    generate(config: StandardAlgorithmDecimalMultiplicationGeneratorConfig): ProblemStub<DecimalStandardMultiplicationProblem> {
        validateConfigFields(generatorId, config, ['range']);
        const cap = validateMagnitudeRange(config.range, generatorId);
        const firstScale = randomInteger(1, 3);
        const minimumFirst = 10 * 10 ** firstScale;
        const choices = [0, 1, 2, 4, 5, 8, 10, 12, 20, 25, 50, 101, 102, 105, 110]
            .filter(value => value * minimumFirst <= cap);
        const secondCoefficient = choices[randomInteger(0, choices.length - 1)]!;
        const first = exactDecimal(randomInteger(minimumFirst,
            secondCoefficient === 0 ? cap : Math.floor(cap / secondCoefficient)), firstScale, generatorId);
        const second = exactDecimal(secondCoefficient, randomInteger(0, 3), generatorId);
        const factors = random() < 0.5 ? [first, second] : [second, first];
        return {data: buildDecimalStandardMultiplicationProblem(factors[0]!.numeral, factors[1]!.numeral)};
    }
}
