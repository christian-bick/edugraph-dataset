import {Area} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    PlaceValueArithmeticOperandProfile,
    PlaceValueArithmeticProblem,
    PlaceValueArithmeticStep,
    PlaceValueDigits,
    PlaceValueRegroupingEvidence
} from '../../../types/problems.ts';
import {PlaceValueArithmeticGeneratorConfig, PlaceValueArithmeticGeneratorSchema} from './spec.ts';

type OperandPair = readonly [number, number];
type Operation = PlaceValueArithmeticProblem['operation'];

const randomInteger = (min: number, max: number): number =>
    min + Math.floor(random() * (max - min + 1));

const choose = <T>(values: readonly T[]): T | null =>
    values.length === 0 ? null : values[Math.floor(random() * values.length)];

const digits = (number: number): PlaceValueDigits => ({
    hundreds: Math.floor(number / 100),
    tens: Math.floor((number % 100) / 10),
    ones: number % 10
});

const equationSymbol = (operation: Operation): '+' | '−' =>
    operation === 'addition' ? '+' : '−';

const operandProfile = (
    config: PlaceValueArithmeticGeneratorConfig
): PlaceValueArithmeticOperandProfile | null => {
    if (config.requireSingleDigitSmallest && config.requireMultipleOf10) return null;
    if (config.requireSingleDigitSmallest) {
        return config.requireTwoDigitLargest ? 'two-digit-single-digit' : null;
    }
    if (config.requireMultipleOf10) {
        return config.requireTwoDigitLargest
            ? 'two-digit-multiple-of-ten'
            : 'multiples-of-ten';
    }
    return config.requireTwoDigitLargest ? null : 'general';
};

const grade1AdditionPairs = (
    profile: PlaceValueArithmeticOperandProfile,
    minimum: number,
    maximum: number,
    requireRegrouping: boolean
): OperandPair[] => {
    const pairs: OperandPair[] = [];
    if (profile === 'two-digit-single-digit') {
        for (let twoDigit = Math.max(10, minimum); twoDigit <= Math.min(99, maximum); twoDigit++) {
            for (let singleDigit = Math.max(1, minimum); singleDigit <= 9; singleDigit++) {
                const answer = twoDigit + singleDigit;
                const composesTen = twoDigit % 10 + singleDigit >= 10;
                if (answer <= maximum && composesTen === requireRegrouping) {
                    pairs.push([twoDigit, singleDigit]);
                }
            }
        }
    } else if (profile === 'two-digit-multiple-of-ten' && !requireRegrouping) {
        for (let twoDigit = Math.max(10, minimum); twoDigit <= Math.min(99, maximum); twoDigit++) {
            for (let multiple = 10; multiple <= Math.min(90, maximum); multiple += 10) {
                if (twoDigit + multiple <= maximum) pairs.push([twoDigit, multiple]);
            }
        }
    }
    return pairs;
};

const grade1SubtractionPairs = (
    minimum: number,
    maximum: number,
    requireZero: boolean
): OperandPair[] => {
    const pairs: OperandPair[] = [];
    for (let minuend = 10; minuend <= Math.min(90, maximum); minuend += 10) {
        if (minuend < minimum) continue;
        for (let subtrahend = 10; subtrahend <= minuend; subtrahend += 10) {
            if (subtrahend < minimum) continue;
            const isZero = minuend === subtrahend;
            if (isZero === requireZero) pairs.push([minuend, subtrahend]);
        }
    }
    return pairs;
};

const generalAdditionPair = (
    minimum: number,
    maximum: number,
    requireRegrouping: boolean
): OperandPair | null => {
    if (maximum < 2 * minimum) return null;
    for (let attempt = 0; attempt < 500; attempt++) {
        const num1 = randomInteger(minimum, maximum - minimum);
        const num2 = randomInteger(minimum, maximum - num1);
        if ((num1 % 10 + num2 % 10 >= 10) === requireRegrouping) return [num1, num2];
    }
    return null;
};

const generalSubtractionPair = (
    minimum: number,
    maximum: number,
    requireRegrouping: boolean,
    requireZero: boolean
): OperandPair | null => {
    if (requireZero) {
        const operand = randomInteger(minimum, maximum);
        return [operand, operand];
    }
    if (maximum <= minimum) return null;
    for (let attempt = 0; attempt < 500; attempt++) {
        const num1 = randomInteger(minimum + 1, maximum);
        const num2 = randomInteger(minimum, num1 - 1);
        const decomposesTen = num1 % 10 < num2 % 10;
        const left = digits(num1);
        const right = digits(num2);
        const adjustedLeftTens = left.tens - (decomposesTen ? 1 : 0);
        const needsNoHigherBorrow = adjustedLeftTens >= right.tens
            && left.hundreds >= right.hundreds;
        if (decomposesTen === requireRegrouping && needsNoHigherBorrow) {
            return [num1, num2];
        }
    }
    return null;
};

const additionEvidence = (
    num1: number,
    num2: number,
    answer: number,
    requireRegrouping: boolean
): {regrouping: PlaceValueRegroupingEvidence; steps: PlaceValueArithmeticProblem['strategySteps']} => {
    const left = digits(num1);
    const right = digits(num2);
    const result = digits(answer);
    const onesTotal = left.ones + right.ones;
    const upperLeft = num1 - left.ones;
    const upperRight = num2 - right.ones;

    const combineOnes: PlaceValueArithmeticStep = {
        kind: 'combine-ones',
        place: 'ones',
        equation: `${left.ones} + ${right.ones} = ${onesTotal}`,
        explanation: `Combine the ones: ${left.ones} + ${right.ones} = ${onesTotal}.`
    };

    if (requireRegrouping) {
        const remainingOnes = onesTotal - 10;
        return {
            regrouping: {
                kind: 'compose-ten',
                onesBefore: onesTotal,
                onesAfter: remainingOnes,
                tensExchanged: 1,
                statement: `Compose 10 of the ${onesTotal} ones as 1 ten, leaving ${remainingOnes} ones.`
            },
            steps: [
                combineOnes,
                {
                    kind: 'compose-ten',
                    place: 'ones',
                    equation: `${onesTotal} = 10 + ${remainingOnes}`,
                    explanation: `Compose a ten: ${onesTotal} ones = 1 ten and ${remainingOnes} ones.`
                },
                {
                    kind: 'result',
                    place: 'result',
                    equation: `${upperLeft} + ${upperRight} + 10 + ${remainingOnes} = ${answer}`,
                    explanation: `Combine the tens, the composed ten, and ${remainingOnes} ones to get ${answer}.`
                }
            ]
        };
    }

    return {
        regrouping: {
            kind: 'none',
            onesBefore: onesTotal,
            onesAfter: result.ones,
            tensExchanged: 0,
            statement: `${onesTotal} ones stay in the ones place; no ten is composed.`
        },
        steps: [
            combineOnes,
            {
                kind: 'combine-tens',
                place: 'tens',
                equation: `${upperLeft} + ${upperRight} = ${answer - result.ones}`,
                explanation: `Combine the tens and hundreds: ${upperLeft} + ${upperRight} = ${answer - result.ones}.`
            },
            {
                kind: 'result',
                place: 'result',
                equation: `${upperLeft} + ${upperRight} + ${onesTotal} = ${answer}`,
                explanation: `Combine the place-value parts: ${upperLeft} + ${upperRight} + ${onesTotal} = ${answer}.`
            }
        ]
    };
};

const subtractionEvidence = (
    num1: number,
    num2: number,
    answer: number,
    requireRegrouping: boolean
): {regrouping: PlaceValueRegroupingEvidence; steps: PlaceValueArithmeticProblem['strategySteps']} => {
    const left = digits(num1);
    const right = digits(num2);
    const result = digits(answer);
    const upperLeft = num1 - left.ones;
    const upperRight = num2 - right.ones;

    if (requireRegrouping) {
        const availableOnes = left.ones + 10;
        const remainingUpper = upperLeft - 10;
        return {
            regrouping: {
                kind: 'decompose-ten',
                onesBefore: left.ones,
                onesAfter: availableOnes,
                tensExchanged: 1,
                statement: `Decompose 1 ten as 10 ones, changing ${left.ones} ones to ${availableOnes} ones.`
            },
            steps: [
                {
                    kind: 'decompose-ten',
                    place: 'tens',
                    equation: `${upperLeft} = ${remainingUpper} + 10`,
                    explanation: `Decompose one ten: ${upperLeft} = ${remainingUpper} + 10.`
                },
                {
                    kind: 'subtract-ones',
                    place: 'ones',
                    equation: `${availableOnes} − ${right.ones} = ${result.ones}`,
                    explanation: `Subtract the ones: ${availableOnes} − ${right.ones} = ${result.ones}.`
                },
                {
                    kind: 'result',
                    place: 'result',
                    equation: `${remainingUpper} − ${upperRight} + ${result.ones} = ${answer}`,
                    explanation: `Subtract the remaining place-value parts and combine them to get ${answer}.`
                }
            ]
        };
    }

    return {
        regrouping: {
            kind: 'none',
            onesBefore: left.ones,
            onesAfter: result.ones,
            tensExchanged: 0,
            statement: `${left.ones} ones can subtract ${right.ones} ones directly; no ten is decomposed.`
        },
        steps: [
            {
                kind: 'subtract-ones',
                place: 'ones',
                equation: `${left.ones} − ${right.ones} = ${result.ones}`,
                explanation: `Subtract the ones: ${left.ones} − ${right.ones} = ${result.ones}.`
            },
            {
                kind: 'subtract-tens',
                place: 'tens',
                equation: `${upperLeft} − ${upperRight} = ${answer - result.ones}`,
                explanation: `Subtract the tens and hundreds: ${upperLeft} − ${upperRight} = ${answer - result.ones}.`
            },
            {
                kind: 'result',
                place: 'result',
                equation: `${answer - result.ones} + ${result.ones} = ${answer}`,
                explanation: `Combine the remaining place-value parts to get ${answer}.`
            }
        ]
    };
};

const buildProblem = (
    num1: number,
    num2: number,
    operation: Operation,
    profile: PlaceValueArithmeticOperandProfile,
    requireRegrouping: boolean
): PlaceValueArithmeticProblem => {
    const answer = operation === 'addition' ? num1 + num2 : num1 - num2;
    const evidence = operation === 'addition'
        ? additionEvidence(num1, num2, answer, requireRegrouping)
        : subtractionEvidence(num1, num2, answer, requireRegrouping);
    return {
        num1,
        num2,
        answer,
        operation,
        operandProfile: profile,
        operands: [digits(num1), digits(num2)],
        result: digits(answer),
        regrouping: evidence.regrouping,
        equation: `${num1} ${equationSymbol(operation)} ${num2} = ${answer}`,
        strategySteps: evidence.steps
    };
};

export class PlaceValueArithmeticGenerator implements ProblemGenerator<
    PlaceValueArithmeticProblem,
    PlaceValueArithmeticGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueArithmeticGeneratorSchema;

    generate(config: PlaceValueArithmeticGeneratorConfig): ProblemStub<PlaceValueArithmeticProblem> | null {
        validateConfigFields('place-value-arithmetic', config, [
            'operation',
            'requireRegrouping',
            'requireSingleDigitSmallest',
            'requireTwoDigitLargest',
            'requireMultipleOf10',
            'requireZero',
            'range'
        ]);
        if (config.operation !== Area.Addition && config.operation !== Area.Subtraction) {
            throw new GeneratorValidationError(
                'place-value-arithmetic',
                `Unsupported operation "${config.operation}".`
            );
        }

        const profile = operandProfile(config);
        if (profile === null) return null;
        const minimum = Math.max(1, Math.ceil(config.range!.min));
        const maximum = Math.min(999, Math.floor(config.range!.max) - 1);
        if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum > maximum) {
            return null;
        }

        const requireRegrouping = config.requireRegrouping!;
        const requireZero = config.requireZero!;
        let pair: OperandPair | null = null;
        if (config.operation === Area.Addition) {
            if (requireZero || profile === 'multiples-of-ten') return null;
            pair = profile === 'general'
                ? generalAdditionPair(minimum, maximum, requireRegrouping)
                : choose(grade1AdditionPairs(profile, minimum, maximum, requireRegrouping));
        } else if (profile === 'multiples-of-ten') {
            if (requireRegrouping) return null;
            pair = choose(grade1SubtractionPairs(minimum, maximum, requireZero));
        } else if (profile === 'general') {
            if (requireZero && requireRegrouping) return null;
            pair = generalSubtractionPair(minimum, maximum, requireRegrouping, requireZero);
        }

        if (pair === null) return null;
        const operation: Operation = config.operation === Area.Addition ? 'addition' : 'subtraction';
        return {data: buildProblem(pair[0], pair[1], operation, profile, requireRegrouping)};
    }
}
