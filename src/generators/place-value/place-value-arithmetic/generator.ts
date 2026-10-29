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
import {PlaceValueArithmeticGeneratorConfig, PlaceValueArithmeticGeneratorSchema, spec} from './spec.ts';
import {samplePrimaryWidth} from './width-domain.ts';

type OperandPair = readonly [number, number];
type Operation = PlaceValueArithmeticProblem['operation'];

const choose = <T>(values: readonly T[]): T | null =>
    values.length === 0 ? null : values[Math.floor(random() * values.length)];

const digits = (number: number): PlaceValueDigits => ({
    hundreds: Math.floor(number / 100),
    tens: Math.floor((number % 100) / 10),
    ones: number % 10
});

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
    const combineOnes: PlaceValueArithmeticStep = {
        kind: 'combine-ones',
        place: 'ones'
    };

    if (requireRegrouping) {
        const remainingOnes = onesTotal - 10;
        return {
            regrouping: {
                kind: 'compose-ten',
                onesBefore: onesTotal,
                onesAfter: remainingOnes,
                tensExchanged: 1
            },
            steps: [
                combineOnes,
                {
                    kind: 'compose-ten',
                    place: 'ones'
                },
                {
                    kind: 'result',
                    place: 'result'
                }
            ]
        };
    }

    return {
        regrouping: {
            kind: 'none',
            onesBefore: onesTotal,
            onesAfter: result.ones,
            tensExchanged: 0
        },
        steps: [
            combineOnes,
            {
                kind: 'combine-tens',
                place: 'tens'
            },
            {
                kind: 'result',
                place: 'result'
            }
        ]
    };
};

const subtractionEvidence = (
    num1: number,
    _num2: number,
    answer: number,
    requireRegrouping: boolean
): {regrouping: PlaceValueRegroupingEvidence; steps: PlaceValueArithmeticProblem['strategySteps']} => {
    const left = digits(num1);
    const result = digits(answer);
    if (requireRegrouping) {
        const availableOnes = left.ones + 10;
        return {
            regrouping: {
                kind: 'decompose-ten',
                onesBefore: left.ones,
                onesAfter: availableOnes,
                tensExchanged: 1
            },
            steps: [
                {
                    kind: 'decompose-ten',
                    place: 'tens'
                },
                {
                    kind: 'subtract-ones',
                    place: 'ones'
                },
                {
                    kind: 'result',
                    place: 'result'
                }
            ]
        };
    }

    return {
        regrouping: {
            kind: 'none',
            onesBefore: left.ones,
            onesAfter: result.ones,
            tensExchanged: 0
        },
        steps: [
            {
                kind: 'subtract-ones',
                place: 'ones'
            },
            {
                kind: 'subtract-tens',
                place: 'tens'
            },
            {
                kind: 'result',
                place: 'result'
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
        strategySteps: evidence.steps
    };
};

export class PlaceValueArithmeticGenerator implements ProblemGenerator<
    PlaceValueArithmeticProblem,
    PlaceValueArithmeticGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueArithmeticGeneratorSchema;
    readonly spec = spec;

    generate(config: PlaceValueArithmeticGeneratorConfig): ProblemStub<PlaceValueArithmeticProblem> | null {
        validateConfigFields('place-value-arithmetic', config, [
            'operation',
            'requireRegrouping',
            'requireSingleDigitSmallest',
            'requireTwoDigitLargest',
            'requireMultipleOf10',
            'requireZero',
            'range',
            'largestOperandProfile',
            'coefficientPresence'
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
        const coefficientPresence = config.coefficientPresence!;
        if (typeof coefficientPresence !== 'boolean') {
            throw new GeneratorValidationError('place-value-arithmetic', 'Expected a boolean coefficient presence profile.');
        }
        const primaryWidth = config.largestOperandProfile!;
        if (!['legacy', 'single', 'multiple'].includes(primaryWidth)) {
            throw new GeneratorValidationError('place-value-arithmetic', 'Unsupported primary operand width profile.');
        }
        if (primaryWidth !== 'legacy' && (profile !== 'general'
            || primaryWidth === 'single' && config.operation === Area.Subtraction && requireRegrouping)) return null;
        let pair: OperandPair | null = null;
        if (config.operation === Area.Addition) {
            if (requireZero || profile === 'multiples-of-ten') return null;
            pair = profile === 'general'
                ? samplePrimaryWidth({operation: 'addition', minimum, maximum, regrouping: requireRegrouping,
                    coefficientZero: coefficientPresence}, primaryWidth)
                : coefficientPresence ? choose(grade1AdditionPairs(profile, minimum, maximum, requireRegrouping)) : null;
        } else if (profile === 'multiples-of-ten') {
            if (requireRegrouping) return null;
            if (coefficientPresence !== requireZero) return null;
            pair = choose(grade1SubtractionPairs(minimum, maximum, requireZero));
        } else if (profile === 'general') {
            if (requireZero && requireRegrouping) return null;
            pair = samplePrimaryWidth({operation: 'subtraction', minimum, maximum, regrouping: requireRegrouping,
                zeroResult: requireZero, coefficientZero: coefficientPresence}, primaryWidth);
        }

        if (pair === null) return null;
        const operation: Operation = config.operation === Area.Addition ? 'addition' : 'subtraction';
        return {data: buildProblem(pair[0], pair[1], operation, profile, requireRegrouping)};
    }
}
