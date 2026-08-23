import {
    PlaceValueArithmeticOperandProfile,
    PlaceValueArithmeticProblem,
    PlaceValueArithmeticStep,
    PlaceValueDigits,
    PlaceValueRegroupingEvidence
} from '../../../types/problems.ts';

const OPERAND_PROFILES: readonly PlaceValueArithmeticOperandProfile[] = [
    'general',
    'two-digit-single-digit',
    'two-digit-multiple-of-ten',
    'multiples-of-ten'
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isNonNegativeSafeInteger = (value: unknown): value is number =>
    Number.isSafeInteger(value) && (value as number) >= 0;

const isPositiveSafeInteger = (value: unknown): value is number =>
    Number.isSafeInteger(value) && (value as number) > 0;

const digitsFor = (value: number): PlaceValueDigits => ({
    hundreds: Math.floor(value / 100),
    tens: Math.floor((value % 100) / 10),
    ones: value % 10
});

const isDigits = (value: unknown, expected: PlaceValueDigits): value is PlaceValueDigits =>
    isRecord(value)
    && value.hundreds === expected.hundreds
    && value.tens === expected.tens
    && value.ones === expected.ones;

const validOperandProfile = (
    profile: PlaceValueArithmeticOperandProfile,
    operation: PlaceValueArithmeticProblem['operation'],
    num1: number,
    num2: number
): boolean => {
    if (profile === 'general') return true;
    if (profile === 'two-digit-single-digit') {
        const values = [num1, num2].sort((left, right) => left - right);
        return operation === 'addition'
            && values[0]! >= 1
            && values[0]! <= 9
            && values[1]! >= 10
            && values[1]! <= 99;
    }
    if (profile === 'two-digit-multiple-of-ten') {
        return operation === 'addition'
            && [num1, num2].some(value => value >= 10 && value <= 99)
            && [num1, num2].some(value => value >= 10 && value <= 90 && value % 10 === 0);
    }
    return operation === 'subtraction'
        && num1 >= 10
        && num1 <= 90
        && num2 >= 10
        && num2 <= 90
        && num1 % 10 === 0
        && num2 % 10 === 0;
};

const expectedRegrouping = (
    operation: PlaceValueArithmeticProblem['operation'],
    left: PlaceValueDigits,
    right: PlaceValueDigits
): PlaceValueRegroupingEvidence => {
    if (operation === 'addition') {
        const onesTotal = left.ones + right.ones;
        const composed = onesTotal >= 10;
        const remainingOnes = composed ? onesTotal - 10 : onesTotal;
        return {
            kind: composed ? 'compose-ten' : 'none',
            onesBefore: onesTotal,
            onesAfter: remainingOnes,
            tensExchanged: composed ? 1 : 0
        };
    }

    const decomposed = left.ones < right.ones;
    const availableOnes = left.ones + (decomposed ? 10 : 0);
    return {
        kind: decomposed ? 'decompose-ten' : 'none',
        onesBefore: left.ones,
        onesAfter: decomposed ? availableOnes : left.ones - right.ones,
        tensExchanged: decomposed ? 1 : 0
    };
};

const matchesRegrouping = (value: unknown, expected: PlaceValueRegroupingEvidence): boolean =>
    isRecord(value)
    && value.kind === expected.kind
    && value.onesBefore === expected.onesBefore
    && value.onesAfter === expected.onesAfter
    && value.tensExchanged === expected.tensExchanged;

const expectedStrategySteps = (
    operation: PlaceValueArithmeticProblem['operation'],
    regrouping: PlaceValueRegroupingEvidence
): PlaceValueArithmeticProblem['strategySteps'] => {
    if (operation === 'addition') {
        const combineOnes: PlaceValueArithmeticStep = {
            kind: 'combine-ones',
            place: 'ones'
        };
        if (regrouping.kind === 'compose-ten') {
            return [
                combineOnes,
                {
                    kind: 'compose-ten',
                    place: 'ones'
                },
                {
                    kind: 'result',
                    place: 'result'
                }
            ];
        }
        return [
            combineOnes,
            {
                kind: 'combine-tens',
                place: 'tens'
            },
            {
                kind: 'result',
                place: 'result'
            }
        ];
    }

    if (regrouping.kind === 'decompose-ten') {
        return [
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
        ];
    }
    return [
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
    ];
};

const matchesStrategyStep = (value: unknown, expected: PlaceValueArithmeticStep): boolean =>
    isRecord(value)
    && value.kind === expected.kind
    && value.place === expected.place;

export const isValidPlaceValueArithmeticProblem = (
    value: unknown
): value is PlaceValueArithmeticProblem => {
    if (!isRecord(value)
        || !isPositiveSafeInteger(value.num1)
        || !isPositiveSafeInteger(value.num2)
        || !isNonNegativeSafeInteger(value.answer)
        || (value.operation !== 'addition' && value.operation !== 'subtraction')
        || !OPERAND_PROFILES.includes(value.operandProfile as PlaceValueArithmeticOperandProfile)
        || !Array.isArray(value.operands)
        || value.operands.length !== 2
        || !Array.isArray(value.strategySteps)
        || value.strategySteps.length !== 3) {
        return false;
    }

    const operation = value.operation;
    if (value.num1 > 999 || value.num2 > 999) return false;
    const expectedAnswer = operation === 'addition'
        ? value.num1 + value.num2
        : value.num1 - value.num2;
    if (value.answer !== expectedAnswer || expectedAnswer < 0 || expectedAnswer > 999) return false;

    const left = digitsFor(value.num1);
    const right = digitsFor(value.num2);
    if (operation === 'subtraction' && left.ones < right.ones && left.tens === 0) return false;
    if (!isDigits(value.operands[0], left)
        || !isDigits(value.operands[1], right)
        || !isDigits(value.result, digitsFor(value.answer))
        || !validOperandProfile(
            value.operandProfile as PlaceValueArithmeticOperandProfile,
            operation,
            value.num1,
            value.num2
        )) {
        return false;
    }

    const expectedRegroupingEvidence = expectedRegrouping(operation, left, right);
    if (!matchesRegrouping(value.regrouping, expectedRegroupingEvidence)) {
        return false;
    }

    const expectedSteps = expectedStrategySteps(
        operation,
        expectedRegroupingEvidence
    );
    return value.strategySteps.every((step, index) =>
        matchesStrategyStep(step, expectedSteps[index]!)
    );
};
