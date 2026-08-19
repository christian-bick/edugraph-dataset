import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FactorMultipleRelationsProblem,
    PositiveFactorEvidence,
    PositiveFactorPair
} from '../../../types/problems.ts';
import {
    FactorMultipleRelationsGeneratorConfig,
    FactorMultipleRelationsGeneratorSchema
} from './spec.ts';

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
            upperFactor,
            equation: `${lowerFactor} × ${upperFactor} = ${number}`
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

const generateFactorPairs = (): FactorMultipleRelationsProblem => {
    const number = randomInteger(MINIMUM_FACTOR_PAIR_NUMBER, MAXIMUM_NUMBER);
    const evidence = buildFactorEvidence(number);
    return {
        kind: 'factor-pairs',
        ...evidence
    };
};

const generateMultipleTest = (): FactorMultipleRelationsProblem => {
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

const generateClassification = (
    classification: 'prime' | 'composite'
): FactorMultipleRelationsProblem => {
    const number = randomItem(classification === 'prime' ? primeNumbers : compositeNumbers);
    const evidence = buildFactorEvidence(number);
    if (classification === 'prime') {
        return {
            kind: 'prime-classification',
            classification,
            ...evidence
        };
    }

    return {
        kind: 'composite-classification',
        classification,
        ...evidence
    };
};

export class FactorMultipleRelationsGenerator implements ProblemGenerator<
    FactorMultipleRelationsProblem,
    FactorMultipleRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = FactorMultipleRelationsGeneratorSchema;

    generate(
        config: FactorMultipleRelationsGeneratorConfig
    ): ProblemStub<FactorMultipleRelationsProblem> {
        validateConfigFields('factor-multiple-relations', config, ['task']);

        switch (config.task) {
            case 'factor-pairs':
                return {data: generateFactorPairs()};
            case 'one-digit-multiple-test':
                return {data: generateMultipleTest()};
            case 'prime-classification':
                return {data: generateClassification('prime')};
            case 'composite-classification':
                return {data: generateClassification('composite')};
            default:
                throw new GeneratorValidationError(
                    'factor-multiple-relations',
                    `Unsupported task "${config.task}".`
                );
        }
    }
}
