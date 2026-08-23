import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    IntegerAddSubtractStrategy,
    IntegerAddSubtractStrategyProblem,
    IntegerAddSubtractStrategyStep
} from '../../../types/problems.ts';
import {
    IntegerAddSubtractStrategiesGeneratorConfig,
    IntegerAddSubtractStrategiesGeneratorSchema
} from './spec.ts';

type Bounds = {minimum: number; maximum: number};

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

const additionCountingOn = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
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

const subtractionCountingBack = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
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

const additionMakeTen = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
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

const additionNearDoubles = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
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

const additionCompensation = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
    const rightOperand = choose(eligibleValues(minimum, maximum, candidate => {
        if (candidate % 10 === 0) return false;
        const adjustment = nextTenAdjustment(candidate);
        const minimumLeft = Math.max(minimum, adjustment + 1);
        return candidate + adjustment <= maximum && minimumLeft <= maximum - candidate;
    }));
    if (rightOperand === null) return null;

    const adjustment = nextTenAdjustment(rightOperand);
    const leftOperand = integerBetween(
        Math.max(minimum, adjustment + 1),
        maximum - rightOperand
    );
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

const subtractionCompensation = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
    const rightOperand = choose(eligibleValues(minimum, maximum, candidate => {
        if (candidate % 10 === 0) return false;
        const adjustment = nextTenAdjustment(candidate);
        const minimumLeft = Math.max(candidate + minimum, minimum);
        return candidate + adjustment <= maximum && minimumLeft <= maximum - adjustment;
    }));
    if (rightOperand === null) return null;

    const adjustment = nextTenAdjustment(rightOperand);
    const leftOperand = integerBetween(
        Math.max(rightOperand + minimum, minimum),
        maximum - adjustment
    );
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

const subtractionMakeTen = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
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

const subtractionThinkAddition = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
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

const builders: Record<
    IntegerAddSubtractStrategy,
    (bounds: Bounds) => IntegerAddSubtractStrategyProblem | null
> = {
    'addition-counting-on': additionCountingOn,
    'subtraction-counting-back': subtractionCountingBack,
    'addition-make-ten': additionMakeTen,
    'addition-near-doubles': additionNearDoubles,
    'addition-compensation': additionCompensation,
    'subtraction-compensation': subtractionCompensation,
    'subtraction-make-ten': subtractionMakeTen,
    'subtraction-think-addition': subtractionThinkAddition
};

export class IntegerAddSubtractStrategiesGenerator implements ProblemGenerator<
    IntegerAddSubtractStrategyProblem,
    IntegerAddSubtractStrategiesGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = IntegerAddSubtractStrategiesGeneratorSchema;

    generate(
        config: IntegerAddSubtractStrategiesGeneratorConfig
    ): ProblemStub<IntegerAddSubtractStrategyProblem> | null {
        validateConfigFields('integer-add-subtract-strategies', config, ['strategy', 'range']);

        const strategy = config.strategy!;
        if (!Object.hasOwn(builders, strategy)) {
            throw new GeneratorValidationError(
                'integer-add-subtract-strategies',
                `Unsupported strategy "${strategy}".`
            );
        }

        const minimum = Math.max(1, Math.ceil(config.range!.min));
        const maximum = Math.min(999, Math.floor(config.range!.max) - 1);
        if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum > maximum) {
            return null;
        }

        const problem = builders[strategy]({minimum, maximum});
        return problem ? {data: problem} : null;
    }
}
