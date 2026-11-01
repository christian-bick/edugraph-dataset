import {random} from '../../lib/random.ts';
import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import {FactorPairsProblem, OneDigitMultipleTestProblem, PrimeClassificationProblem, CompositeClassificationProblem, PositiveFactorEvidence, PositiveFactorPair} from '../../types/problems.ts';

const MINIMUM_FACTOR_PAIR_NUMBER = 1;
const MINIMUM_CLASSIFICATION_NUMBER = 2;
const MAXIMUM_NUMBER = 99;
const MINIMUM_DIVISOR = 2;
const MAXIMUM_DIVISOR = 9;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const randomItem = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)]!;

const findPositiveFactors = (number: number): number[] => {
    const factors: number[] = [];
    for (let candidate = 1; candidate <= number; candidate++) {
        if (number % candidate === 0) factors.push(candidate);
    }
    return factors;
};

const findPositiveFactorPairs = (number: number): PositiveFactorPair[] => {
    const pairs: PositiveFactorPair[] = [];
    for (let lowerFactor = 1; lowerFactor * lowerFactor <= number; lowerFactor++) {
        if (number % lowerFactor !== 0) continue;
        const upperFactor = number / lowerFactor;
        pairs.push({
            lowerFactor,
            upperFactor
        });
    }
    return pairs;
};

const buildFactorEvidence = (number: number): PositiveFactorEvidence => {
    const factors = findPositiveFactors(number);
    return {
        number,
        factors,
        factorCount: factors.length,
        factorPairs: findPositiveFactorPairs(number)
    };
};

const numbersByClassification = (classification: 'prime' | 'composite'): number[] => {
    const numbers: number[] = [];
    for (let number = MINIMUM_CLASSIFICATION_NUMBER; number <= MAXIMUM_NUMBER; number++) {
        const isPrime = findPositiveFactors(number).length === 2;
        if ((classification === 'prime') === isPrime) numbers.push(number);
    }
    return numbers;
};

const primeNumbers = numbersByClassification('prime');
const compositeNumbers = numbersByClassification('composite');

export const generateFactorPairs = (): FactorPairsProblem => {
    const number = randomInteger(MINIMUM_FACTOR_PAIR_NUMBER, MAXIMUM_NUMBER);
    const evidence = buildFactorEvidence(number);
    return {
        kind: 'factor-pairs',
        ...evidence
    };
};

export const generateMultipleTest = (): OneDigitMultipleTestProblem => {
    const divisor = randomInteger(MINIMUM_DIVISOR, MAXIMUM_DIVISOR);
    const quotient = randomInteger(1, Math.floor(MAXIMUM_NUMBER / divisor));
    const candidate = divisor * quotient;
    return {
        kind: 'one-digit-multiple-test',
        candidate,
        divisor,
        quotient,
        remainder: 0,
        isMultiple: true
    };
};

/** The required factor evidence always includes1; only the largest classified number varies by band. */
const classificationCandidates = (numbers: readonly number[], range: CanonicalNumericRange): number[] => {
    if (!range || range.min !== 0 || ![5, 10, 20, 100].includes(range.max)) {
        throw new GeneratorValidationError('factor-classification', 'Expected a reviewed canonical upper band without a positive lower.');
    }
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('factor-classification', 'Invalid canonical range witnesses.');
    }
    return numbers.filter(number => number > range.maximumAbove && number <= range.max);
};

export const generatePrimeClassification = (range: CanonicalNumericRange): PrimeClassificationProblem => ({
    kind: 'prime-classification',
    classification: 'prime',
    ...buildFactorEvidence(randomItem(classificationCandidates(primeNumbers, range)))
});

export const generateCompositeClassification = (range: CanonicalNumericRange): CompositeClassificationProblem => ({
    kind: 'composite-classification',
    classification: 'composite',
    ...buildFactorEvidence(randomItem(classificationCandidates(compositeNumbers, range)))
});
