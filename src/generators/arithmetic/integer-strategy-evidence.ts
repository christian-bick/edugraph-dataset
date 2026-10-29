import {random} from '../../lib/random.ts';
import {AdditionCountingOnProblem, SubtractionCountingBackProblem, AdditionMakeTenProblem, AdditionNearDoublesProblem, AdditionCompensationProblem, SubtractionCompensationProblem, SubtractionMakeTenProblem, SubtractionThinkAdditionProblem, IntegerAddSubtractStrategyStep} from '../../types/problems.ts';

type Bounds = {minimum: number; maximum: number};
type CompensationBounds = Bounds & {largestOperandWidth?: 'single' | 'multiple'};

const compensationLeftBounds = (minimum: number, maximum: number, right: number,
    width: CompensationBounds['largestOperandWidth']): Bounds => ({
    minimum: width === 'multiple' && right < 10 ? Math.max(10, minimum) : minimum,
    maximum: width === 'single' ? right < 10 ? Math.min(9, maximum) : -1 : maximum
});

const integerBetween = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const nextTenAdjustment = (value: number): number => 10 - value % 10;

const eligibleValues = (
    minimum: number,
    maximum: number,
    predicate: (value: number) => boolean
): number[] => {
    const values: number[] = [];
    for (let value = minimum; value <= maximum; value++) {
        if (predicate(value)) values.push(value);
    }
    return values;
};

const choose = (values: readonly number[]): number | null =>
    values.length === 0 ? null : values[Math.floor(random() * values.length)];

// The old sampler chooses the right operand uniformly, then the left uniformly.
// Weight each surviving row by its retained fraction to preserve that law conditional on width.
const chooseCompensationRight = (values: readonly number[], retainedFraction: (right: number) => number): number | null => {
    if (values.length === 0) return null;
    const weights = values.map(retainedFraction);
    let position = random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index < values.length; index++) {
        if (position < weights[index]!) return values[index]!;
        position -= weights[index]!;
    }
    return values.at(-1)!;
};

const operationStep = (
    operation: 'addition' | 'subtraction',
    leftOperand: number,
    rightOperand: number,
    result: number
): IntegerAddSubtractStrategyStep => ({
    kind: 'operation',
    operation,
    leftOperand,
    rightOperand,
    result
});

const decompositionStep = (
    whole: number,
    firstPart: number,
    secondPart: number
): IntegerAddSubtractStrategyStep => ({
    kind: 'decomposition',
    whole,
    parts: [firstPart, secondPart]
});

export const additionCountingOn = ({minimum, maximum}: Bounds): AdditionCountingOnProblem | null => {
    const rightOperand = choose(eligibleValues(1, 3, candidate =>
        candidate >= minimum && minimum + candidate <= maximum
    ));
    if (rightOperand === null) return null;

    const leftOperand = integerBetween(minimum, maximum - rightOperand);
    const answer = leftOperand + rightOperand;
    const steps = Array.from(
        {length: rightOperand},
        (_, index) => operationStep(
            'addition',
            leftOperand + index,
            1,
            leftOperand + index + 1
        )
    );

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'addition-counting-on',
        operation: 'addition',
        leftOperand,
        rightOperand,
        answer,
        adjustment: rightOperand,
        steps
    };
};

export const subtractionCountingBack = ({minimum, maximum}: Bounds): SubtractionCountingBackProblem | null => {
    const rightOperand = choose(eligibleValues(1, 3, candidate =>
        candidate >= minimum && minimum + candidate <= maximum
    ));
    if (rightOperand === null) return null;

    const leftOperand = integerBetween(minimum + rightOperand, maximum);
    const answer = leftOperand - rightOperand;
    const steps = Array.from(
        {length: rightOperand},
        (_, index) => operationStep(
            'subtraction',
            leftOperand - index,
            1,
            leftOperand - index - 1
        )
    );

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'subtraction-counting-back',
        operation: 'subtraction',
        leftOperand,
        rightOperand,
        answer,
        adjustment: rightOperand,
        steps
    };
};

export const additionMakeTen = ({minimum, maximum}: Bounds): AdditionMakeTenProblem | null => {
    const leftOperand = choose(eligibleValues(Math.max(6, minimum), Math.min(9, maximum), candidate => {
        const adjustment = 10 - candidate;
        return Math.max(adjustment + 1, minimum) <= maximum - candidate;
    }));
    if (leftOperand === null) return null;

    const adjustment = 10 - leftOperand;
    const rightOperand = integerBetween(
        Math.max(adjustment + 1, minimum),
        maximum - leftOperand
    );
    const remainder = rightOperand - adjustment;
    const answer = leftOperand + rightOperand;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'addition-make-ten',
        operation: 'addition',
        leftOperand,
        rightOperand,
        answer,
        adjustment,
        steps: [
            decompositionStep(rightOperand, adjustment, remainder),
            operationStep('addition', leftOperand, adjustment, 10),
            operationStep('addition', 10, remainder, answer)
        ]
    };
};

export const additionNearDoubles = ({minimum, maximum}: Bounds): AdditionNearDoublesProblem | null => {
    const base = choose(eligibleValues(minimum, maximum, candidate =>
        candidate + 1 <= maximum && 2 * candidate + 1 <= maximum
    ));
    if (base === null) return null;

    const ascending = random() < 0.5;
    const leftOperand = ascending ? base : base + 1;
    const rightOperand = ascending ? base + 1 : base;
    const knownDouble = 2 * base;
    const answer = knownDouble + 1;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'addition-near-doubles',
        operation: 'addition',
        leftOperand,
        rightOperand,
        answer,
        adjustment: 1,
        steps: [
            operationStep('addition', base, base, knownDouble),
            operationStep('addition', knownDouble, 1, answer)
        ]
    };
};

export const additionCompensation = ({minimum, maximum, largestOperandWidth}: CompensationBounds): AdditionCompensationProblem | null => {
    const leftBounds = (right: number) => compensationLeftBounds(
        Math.max(minimum, nextTenAdjustment(right) + 1), maximum - right, right, largestOperandWidth
    );
    const rightOperand = chooseCompensationRight(eligibleValues(minimum, maximum, candidate => {
        if (candidate % 10 === 0) return false;
        const adjustment = nextTenAdjustment(candidate);
        const left = leftBounds(candidate);
        return candidate + adjustment <= maximum && left.minimum <= left.maximum;
    }), right => {
        const left = leftBounds(right);
        const originalMinimum = Math.max(minimum, nextTenAdjustment(right) + 1);
        return (left.maximum - left.minimum + 1) / (maximum - right - originalMinimum + 1);
    });
    if (rightOperand === null) return null;

    const adjustment = nextTenAdjustment(rightOperand);
    const left = leftBounds(rightOperand);
    const leftOperand = integerBetween(left.minimum, left.maximum);
    const adjustedLeft = leftOperand - adjustment;
    const friendlyRight = rightOperand + adjustment;
    const answer = leftOperand + rightOperand;
    const steps = [
        operationStep('subtraction', leftOperand, adjustment, adjustedLeft),
        operationStep('addition', rightOperand, adjustment, friendlyRight),
        operationStep('addition', adjustedLeft, friendlyRight, answer)
    ] as const;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'addition-compensation',
        operation: 'addition',
        leftOperand,
        rightOperand,
        answer,
        adjustment,
        steps
    };
};

export const subtractionCompensation = ({minimum, maximum, largestOperandWidth}: CompensationBounds): SubtractionCompensationProblem | null => {
    const leftBounds = (right: number) => compensationLeftBounds(
        Math.max(right + minimum, minimum), maximum - nextTenAdjustment(right), right, largestOperandWidth
    );
    const rightOperand = chooseCompensationRight(eligibleValues(minimum, maximum, candidate => {
        if (candidate % 10 === 0) return false;
        const adjustment = nextTenAdjustment(candidate);
        const left = leftBounds(candidate);
        return candidate + adjustment <= maximum && left.minimum <= left.maximum;
    }), right => {
        const left = leftBounds(right);
        const originalMinimum = Math.max(right + minimum, minimum);
        return (left.maximum - left.minimum + 1)
            / (maximum - nextTenAdjustment(right) - originalMinimum + 1);
    });
    if (rightOperand === null) return null;

    const adjustment = nextTenAdjustment(rightOperand);
    const left = leftBounds(rightOperand);
    const leftOperand = integerBetween(left.minimum, left.maximum);
    const adjustedLeft = leftOperand + adjustment;
    const friendlyRight = rightOperand + adjustment;
    const answer = leftOperand - rightOperand;
    const steps = [
        operationStep('addition', rightOperand, adjustment, friendlyRight),
        operationStep('addition', leftOperand, adjustment, adjustedLeft),
        operationStep('subtraction', adjustedLeft, friendlyRight, answer)
    ] as const;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'subtraction-compensation',
        operation: 'subtraction',
        leftOperand,
        rightOperand,
        answer,
        adjustment,
        steps
    };
};

export const subtractionMakeTen = ({minimum, maximum}: Bounds): SubtractionMakeTenProblem | null => {
    const minimumLeft = Math.max(11, minimum);
    const maximumLeft = Math.min(19, maximum);
    if (minimum > 9 || minimumLeft > maximumLeft) return null;

    const leftOperand = integerBetween(minimumLeft, maximumLeft);

    const adjustment = leftOperand - 10;
    const rightOperand = integerBetween(adjustment + 1, leftOperand - minimum);
    const remainder = rightOperand - adjustment;
    const answer = leftOperand - rightOperand;
    const steps = [
        decompositionStep(rightOperand, adjustment, remainder),
        operationStep('subtraction', leftOperand, adjustment, 10),
        operationStep('subtraction', 10, remainder, answer)
    ] as const;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'subtraction-make-ten',
        operation: 'subtraction',
        leftOperand,
        rightOperand,
        answer,
        adjustment,
        steps
    };
};

export const subtractionThinkAddition = ({minimum, maximum}: Bounds): SubtractionThinkAdditionProblem | null => {
    const rightOperand = choose(eligibleValues(minimum, maximum, candidate => {
        if (candidate % 10 === 0) return false;
        const adjustment = nextTenAdjustment(candidate);
        return Math.max(1, minimum - adjustment) <= maximum - (candidate + adjustment);
    }));
    if (rightOperand === null) return null;

    const adjustment = nextTenAdjustment(rightOperand);
    const friendlyTen = rightOperand + adjustment;
    const minimumRemaining = Math.max(1, minimum - adjustment);
    const maximumRemaining = maximum - friendlyTen;
    const remainingDifference = integerBetween(minimumRemaining, maximumRemaining);
    const answer = adjustment + remainingDifference;
    const leftOperand = rightOperand + answer;
    const steps = [
        operationStep('addition', rightOperand, adjustment, friendlyTen),
        operationStep('addition', friendlyTen, remainingDifference, leftOperand),
        operationStep('addition', adjustment, remainingDifference, answer)
    ] as const;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'subtraction-think-addition',
        operation: 'subtraction',
        leftOperand,
        rightOperand,
        answer,
        adjustment,
        steps
    };
};


export function strategyBounds(range: {min: number; max: number}): Bounds | null {
    const minimum = Math.max(1, Math.ceil(range.min));
    const maximum = Math.min(999, Math.floor(range.max) - 1);
    return !Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum > maximum
        ? null : {minimum, maximum};
}
