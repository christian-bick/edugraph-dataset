import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalStandardAddSubtractColumn, DecimalStandardAddSubtractProblem} from '../../../types/problems.ts';
import {alignedDecimalCoefficient, decimalPowerOfTen, exactDecimal, parseExactDecimal, validateMagnitudeRange} from '../standard-decimal-helpers.ts';
import {StandardAlgorithmDecimalAddSubtractGeneratorSchema, type StandardAlgorithmDecimalAddSubtractGeneratorConfig} from './spec.ts';

const generatorId = 'standard-algorithm-decimal-add-subtract';
type Operation = DecimalStandardAddSubtractProblem['operation'];
const randomInteger = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));

/** Exact original numeral forms and every aligned carry/borrow column. */
export function buildDecimalStandardAddSubtractProblem(operation: Operation, topNumeral: string, bottomNumeral: string): DecimalStandardAddSubtractProblem {
    if (operation !== 'addition' && operation !== 'subtraction') {
        throw new GeneratorValidationError(generatorId, 'Operation must be addition or subtraction.');
    }
    const top = parseExactDecimal(topNumeral, generatorId);
    const bottom = parseExactDecimal(bottomNumeral, generatorId);
    const scale = Math.max(top.scale, bottom.scale);
    const topCoefficient = alignedDecimalCoefficient(top, scale, generatorId);
    const bottomCoefficient = alignedDecimalCoefficient(bottom, scale, generatorId);
    const resultCoefficient = Number(operation === 'addition'
        ? BigInt(topCoefficient) + BigInt(bottomCoefficient)
        : BigInt(topCoefficient) - BigInt(bottomCoefficient));
    const result = exactDecimal(resultCoefficient, scale, generatorId);
    const width = Math.max(scale + 1, String(topCoefficient).length, String(bottomCoefficient).length, String(resultCoefficient).length);
    const topDigits = [...String(topCoefficient).padStart(width, '0')].reverse().map(Number);
    const bottomDigits = [...String(bottomCoefficient).padStart(width, '0')].reverse().map(Number);
    let regroupIn: 0 | 1 = 0;
    const columns: DecimalStandardAddSubtractColumn[] = topDigits.map((topDigit, index) => {
        const bottomDigit = bottomDigits[index]!;
        const regroupOut = (operation === 'addition'
            ? topDigit + bottomDigit + regroupIn >= 10
            : topDigit - regroupIn < bottomDigit) ? 1 : 0;
        const workingValue = operation === 'addition'
            ? topDigit + bottomDigit + regroupIn
            : topDigit - regroupIn + 10 * regroupOut;
        const resultDigit = operation === 'addition' ? workingValue % 10 : workingValue - bottomDigit;
        const column: DecimalStandardAddSubtractColumn = {
            placeExponent: index - scale, topDigit, bottomDigit, regroupIn, regroupOut, workingValue, resultDigit
        };
        regroupIn = regroupOut;
        return column;
    });
    return {
        kind: 'decimal-standard-add-subtract', base: 10, operation, top, bottom, result,
        alignment: {scale, topCoefficient, bottomCoefficient,
            topNumeral: exactDecimal(topCoefficient, scale, generatorId).numeral,
            bottomNumeral: exactDecimal(bottomCoefficient, scale, generatorId).numeral},
        columns
    };
}

/** Concrete precision and regrouping variation stays inside the resolved math domain. */
function sampleNumerals(operation: Operation, ceiling: number): readonly [string, string] {
    const variant = randomInteger(0, 3);
    if (variant === 2) {
        if (operation === 'addition') {
            const overflowWholes = [99, 999].filter(whole => (whole + 1) * 1000 <= ceiling);
            const whole = overflowWholes[randomInteger(0, overflowWholes.length - 1)]!;
            const fractional = randomInteger(991, 999);
            return [exactDecimal(whole * 1000 + fractional, 3).numeral, exactDecimal(1000 - fractional, 3).numeral];
        }
        const whole = randomInteger(1, Math.floor((ceiling - 5) / 10000)) * 10;
        return [exactDecimal(whole * 1000 + 5, 3).numeral, exactDecimal(randomInteger(17, 95), 3).numeral];
    }
    if (variant === 3) {
        const whole = randomInteger(10, Math.floor(ceiling / 1000));
        return operation === 'addition'
            ? [exactDecimal(whole * 1000 + randomInteger(0, Math.min(999, ceiling - whole * 1000)), 3).numeral,
                exactDecimal(0, randomInteger(0, 3)).numeral]
            : [exactDecimal(whole * 1000, 3).numeral, exactDecimal(whole * 100, 2).numeral];
    }
    const scale = randomInteger(1, 3);
    const bottomScale = randomInteger(0, variant === 1 ? scale - 1 : scale);
    const topCoefficient = randomInteger(10 * decimalPowerOfTen(scale), operation === 'addition' ? Math.floor(ceiling / 2) : ceiling);
    const remaining = operation === 'addition' ? ceiling - topCoefficient : topCoefficient;
    const bottomCoefficient = randomInteger(0, Math.floor(remaining / decimalPowerOfTen(scale - bottomScale)));
    return [exactDecimal(topCoefficient, scale).numeral, exactDecimal(bottomCoefficient, bottomScale).numeral];
}

export class StandardAlgorithmDecimalAddSubtractGenerator implements ProblemGenerator<
    DecimalStandardAddSubtractProblem, StandardAlgorithmDecimalAddSubtractGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = StandardAlgorithmDecimalAddSubtractGeneratorSchema;

    generate(config: StandardAlgorithmDecimalAddSubtractGeneratorConfig): ProblemStub<DecimalStandardAddSubtractProblem> {
        validateConfigFields(generatorId, config, ['operation', 'range']);
        if (config.operation !== 'addition' && config.operation !== 'subtraction') {
            throw new GeneratorValidationError(generatorId, 'Operation must be addition or subtraction.');
        }
        const ceiling = validateMagnitudeRange(config.range, generatorId);
        const [top, bottom] = sampleNumerals(config.operation, ceiling);
        return {data: buildDecimalStandardAddSubtractProblem(config.operation, top, bottom)};
    }
}
