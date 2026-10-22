import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalStandardDivisionProblem, DecimalStandardDivisionStep} from '../../../types/problems.ts';
import {alignedDecimalCoefficient, decimalPowerOfTen, exactDecimal, parseExactDecimal, validateMagnitudeRange} from '../standard-decimal-helpers.ts';
import {StandardAlgorithmDecimalDivisionGeneratorSchema, type StandardAlgorithmDecimalDivisionGeneratorConfig} from './spec.ts';

const generatorId = 'standard-algorithm-decimal-division';
const randomInteger = (min: number, max: number): number => min + Math.floor(random() * (max - min + 1));
const safeNumber = (value: bigint): number => {
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new GeneratorValidationError(generatorId, 'Every coefficient and working integer must be safe.');
    }
    return Number(value);
};
const gcd = (first: bigint, second: bigint): bigint => {
    while (second !== 0n) [first, second] = [second, first % second];
    return first;
};

/** Prove termination before tracing; the exact reduced denominator supplies the required precision. */
export function buildDecimalStandardDivisionProblem(dividendNumeral: string, divisorNumeral: string): DecimalStandardDivisionProblem {
    const dividend = parseExactDecimal(dividendNumeral, generatorId);
    const divisor = parseExactDecimal(divisorNumeral, generatorId);
    if (divisor.coefficient === 0) throw new GeneratorValidationError(generatorId, 'The divisor must be positive.');
    const shiftPlaces = divisor.scale;
    const powerOfTen = decimalPowerOfTen(shiftPlaces, generatorId);
    const normalized = exactDecimal(alignedDecimalCoefficient(dividend, Math.max(dividend.scale, divisor.scale), generatorId),
        Math.max(0, dividend.scale - divisor.scale), generatorId);
    const numerator = BigInt(normalized.coefficient);
    const denominator = BigInt(divisor.coefficient) * BigInt(decimalPowerOfTen(normalized.scale, generatorId));
    let reducedDenominator = denominator / gcd(numerator, denominator);
    let twos = 0;
    let fives = 0;
    while (reducedDenominator % 2n === 0n) {reducedDenominator /= 2n; twos++;}
    while (reducedDenominator % 5n === 0n) {reducedDenominator /= 5n; fives++;}
    if (reducedDenominator !== 1n) {
        throw new GeneratorValidationError(generatorId, 'The quotient has a recurring decimal expansion.');
    }
    const quotientScale = Math.max(twos, fives, normalized.scale);
    const quotientPower = decimalPowerOfTen(quotientScale, generatorId);
    const quotient = exactDecimal(safeNumber(numerator * BigInt(quotientPower) / denominator), quotientScale, generatorId);
    const sourceDigits = normalized.numeral.replace('.', '').split('').map(Number);
    const decimalIndex = normalized.numeral.includes('.') ? normalized.numeral.indexOf('.') : sourceDigits.length;
    let firstColumn = 0;
    let prefix = BigInt(sourceDigits[0]!);
    while (prefix < BigInt(divisor.coefficient) && firstColumn < decimalIndex - 1) {
        firstColumn++;
        prefix = 10n * prefix + BigInt(sourceDigits[firstColumn]!);
    }
    const steps: DecimalStandardDivisionStep[] = [];
    let previousRemainder = 0n;
    const finalColumn = decimalIndex - 1 + quotientScale;
    for (let endColumnIndex = firstColumn; endColumnIndex <= finalColumn; endColumnIndex++) {
        const broughtDownDigits = endColumnIndex === firstColumn ? sourceDigits.slice(0, firstColumn + 1)
            : [endColumnIndex < sourceDigits.length ? sourceDigits[endColumnIndex]! : 0];
        const partial = previousRemainder * 10n ** BigInt(broughtDownDigits.length) + BigInt(broughtDownDigits.join(''));
        const quotientDigit = partial / BigInt(divisor.coefficient);
        const product = BigInt(divisor.coefficient) * quotientDigit;
        const remainder = partial - product;
        steps.push({endColumnIndex, quotientPlaceExponent: decimalIndex - 1 - endColumnIndex,
            source: endColumnIndex < sourceDigits.length ? 'original' : 'extension-zero',
            previousRemainder: safeNumber(previousRemainder), broughtDownDigits,
            partialDividend: safeNumber(partial), quotientDigit: Number(quotientDigit),
            product: safeNumber(product), remainder: safeNumber(remainder)});
        previousRemainder = remainder;
    }
    return {kind: 'decimal-standard-division', base: 10, dividend, divisor, quotient,
        normalization: {shiftPlaces, powerOfTen, dividend: normalized, divisor: divisor.coefficient},
        sourceDigits, decimalIndex, quotientStartColumn: firstColumn,
        quotientDigits: steps.map(step => step.quotientDigit), steps};
}

/** Construct finite exact relations, then vary supplied dividend precision without changing value. */
export class StandardAlgorithmDecimalDivisionGenerator implements ProblemGenerator<
    DecimalStandardDivisionProblem, StandardAlgorithmDecimalDivisionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = StandardAlgorithmDecimalDivisionGeneratorSchema;

    generate(config: StandardAlgorithmDecimalDivisionGeneratorConfig): ProblemStub<DecimalStandardDivisionProblem> {
        validateConfigFields(generatorId, config, ['range']);
        const cap = validateMagnitudeRange(config.range, generatorId);
        const profiles = [0, 1, 2, 3].flatMap(divisorScale => [0, 1, 2].flatMap(quotientScale =>
            [2, 3, 4, 5, 8, 12, 15, 16, 25, 40, 125, 250, 1005].map(divisorCoefficient => ({
                divisorScale, quotientScale, divisorCoefficient,
                minimum: divisorCoefficient >= 10 * 10 ** divisorScale ? 0
                    : Math.ceil(10 * 10 ** (divisorScale + quotientScale) / divisorCoefficient),
                maximum: Math.floor(cap / divisorCoefficient)
            })).filter(profile => divisorScale + quotientScale > 0 && profile.minimum <= profile.maximum)));
        const profile = profiles[randomInteger(0, profiles.length - 1)]!;
        const {divisorCoefficient, divisorScale, quotientScale} = profile;
        const scenario = randomInteger(0, 3);
        let quotientCoefficient = randomInteger(profile.minimum, profile.maximum);
        if (scenario === 0 && profile.minimum === 0) quotientCoefficient = 0;
        if (scenario === 1 && Math.floor(quotientCoefficient / 5) * 5 >= profile.minimum) {
            quotientCoefficient = Math.floor(quotientCoefficient / 5) * 5;
        }
        const rawCoefficient = divisorCoefficient * quotientCoefficient;
        const rawScale = divisorScale + quotientScale;
        let maximumTrim = 0;
        while (maximumTrim < rawScale - (divisorScale === 0 ? 1 : 0)
            && rawCoefficient % 10 ** (maximumTrim + 1) === 0) maximumTrim++;
        const trim = randomInteger(0, maximumTrim);
        const dividend = exactDecimal(rawCoefficient / 10 ** trim, rawScale - trim, generatorId);
        const divisor = exactDecimal(divisorCoefficient, divisorScale, generatorId);
        return {data: buildDecimalStandardDivisionProblem(dividend.numeral, divisor.numeral)};
    }
}
