import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    IntegerAddSubtractStrategy,
    IntegerAddSubtractStrategyProblem
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

const additionCountingOn = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
    const rightOperand = choose(eligibleValues(1, 3, candidate =>
        candidate >= minimum && minimum + candidate <= maximum
    ));
    if (rightOperand === null) return null;

    const leftOperand = integerBetween(minimum, maximum - rightOperand);
    const answer = leftOperand + rightOperand;
    const questionEquation = `${leftOperand} + ${rightOperand} = ?`;
    const solutionEquation = `${leftOperand} + ${rightOperand} = ${answer}`;
    const unitAddends = Array.from({length: rightOperand}, () => '1').join(' + ');
    const steps = Array.from(
        {length: rightOperand},
        (_, index) => `${leftOperand + index} + 1 = ${leftOperand + index + 1}`
    );

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'addition-counting-on',
        operation: 'addition',
        leftOperand,
        rightOperand,
        answer,
        adjustment: rightOperand,
        prompt: `Count on to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        transformedEquation: `${leftOperand} + ${rightOperand} = ${leftOperand} + (${unitAddends})`,
        steps,
        explanation: `Start at ${leftOperand} and count forward ${rightOperand} ${rightOperand === 1 ? 'step' : 'steps'} to reach ${answer}.`
    };
};

const subtractionCountingBack = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
    const rightOperand = choose(eligibleValues(1, 3, candidate =>
        candidate >= minimum && minimum + candidate <= maximum
    ));
    if (rightOperand === null) return null;

    const leftOperand = integerBetween(minimum + rightOperand, maximum);
    const answer = leftOperand - rightOperand;
    const questionEquation = `${leftOperand} − ${rightOperand} = ?`;
    const solutionEquation = `${leftOperand} − ${rightOperand} = ${answer}`;
    const unitSubtrahends = Array.from({length: rightOperand}, () => '1').join(' − ');
    const steps = Array.from(
        {length: rightOperand},
        (_, index) => `${leftOperand - index} − 1 = ${leftOperand - index - 1}`
    );

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'subtraction-counting-back',
        operation: 'subtraction',
        leftOperand,
        rightOperand,
        answer,
        adjustment: rightOperand,
        prompt: `Count back to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        transformedEquation: `${leftOperand} − ${rightOperand} = ${leftOperand} − ${unitSubtrahends}`,
        steps,
        explanation: `Start at ${leftOperand} and count backward ${rightOperand} ${rightOperand === 1 ? 'step' : 'steps'} to reach ${answer}.`
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
    const questionEquation = `${leftOperand} + ${rightOperand} = ?`;
    const solutionEquation = `${leftOperand} + ${rightOperand} = ${answer}`;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'addition-make-ten',
        operation: 'addition',
        leftOperand,
        rightOperand,
        answer,
        adjustment,
        prompt: `Make ten to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        transformedEquation: `${leftOperand} + ${rightOperand} = ${leftOperand} + (${adjustment} + ${remainder})`,
        steps: [
            `${rightOperand} = ${adjustment} + ${remainder}`,
            `${leftOperand} + ${adjustment} = 10`,
            `10 + ${remainder} = ${answer}`
        ],
        explanation: `Decompose ${rightOperand} as ${adjustment} + ${remainder}. Add ${adjustment} to ${leftOperand} to make 10, then add the remaining ${remainder} to get ${answer}.`
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
    const questionEquation = `${leftOperand} + ${rightOperand} = ?`;
    const solutionEquation = `${leftOperand} + ${rightOperand} = ${answer}`;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'addition-near-doubles',
        operation: 'addition',
        leftOperand,
        rightOperand,
        answer,
        adjustment: 1,
        prompt: `Use a near double to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        transformedEquation: `${leftOperand} + ${rightOperand} = ${base} + ${base} + 1`,
        steps: [
            `${base} + ${base} = ${knownDouble}`,
            `${knownDouble} + 1 = ${answer}`
        ],
        explanation: `${leftOperand} and ${rightOperand} differ by 1. Use the known double ${base} + ${base} = ${knownDouble}, then add 1 to get ${answer}.`
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
    const questionEquation = `${leftOperand} + ${rightOperand} = ?`;
    const solutionEquation = `${leftOperand} + ${rightOperand} = ${answer}`;
    const transformedEquation = `${leftOperand} + ${rightOperand} = ${adjustedLeft} + ${friendlyRight}`;
    const steps = [
        `${leftOperand} − ${adjustment} = ${adjustedLeft}`,
        `${rightOperand} + ${adjustment} = ${friendlyRight}`,
        `${adjustedLeft} + ${friendlyRight} = ${answer}`
    ] as const;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'addition-compensation',
        operation: 'addition',
        leftOperand,
        rightOperand,
        answer,
        adjustment,
        prompt: `Use compensation to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        transformedEquation,
        steps,
        explanation: `Move ${adjustment} from ${leftOperand} to ${rightOperand}. This keeps the sum unchanged and creates the friendly addend ${friendlyRight}.`
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
    const questionEquation = `${leftOperand} − ${rightOperand} = ?`;
    const solutionEquation = `${leftOperand} − ${rightOperand} = ${answer}`;
    const transformedEquation = `${leftOperand} − ${rightOperand} = ${adjustedLeft} − ${friendlyRight}`;
    const steps = [
        `${rightOperand} + ${adjustment} = ${friendlyRight}`,
        `${leftOperand} + ${adjustment} = ${adjustedLeft}`,
        `${adjustedLeft} − ${friendlyRight} = ${answer}`
    ] as const;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'subtraction-compensation',
        operation: 'subtraction',
        leftOperand,
        rightOperand,
        answer,
        adjustment,
        prompt: `Use compensation to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        transformedEquation,
        steps,
        explanation: `Add ${adjustment} to both numbers. Their difference stays unchanged, and the new subtrahend ${friendlyRight} is a multiple of ten.`
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
    const questionEquation = `${leftOperand} − ${rightOperand} = ?`;
    const solutionEquation = `${leftOperand} − ${rightOperand} = ${answer}`;
    const transformedEquation = `${leftOperand} − ${rightOperand} = ${leftOperand} − (${adjustment} + ${remainder})`;
    const steps = [
        `${rightOperand} = ${adjustment} + ${remainder}`,
        `${leftOperand} − ${adjustment} = 10`,
        `10 − ${remainder} = ${answer}`
    ] as const;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'subtraction-make-ten',
        operation: 'subtraction',
        leftOperand,
        rightOperand,
        answer,
        adjustment,
        prompt: `Make ten to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        transformedEquation,
        steps,
        explanation: `Decompose ${rightOperand} as ${adjustment} + ${remainder}. Subtract ${adjustment} from ${leftOperand} to reach 10, then subtract the remaining ${remainder} to get ${answer}.`
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
    const questionEquation = `${leftOperand} − ${rightOperand} = ?`;
    const solutionEquation = `${leftOperand} − ${rightOperand} = ${answer}`;
    const transformedEquation = `${rightOperand} + ? = ${leftOperand}`;
    const steps = [
        `${rightOperand} + ${adjustment} = ${friendlyTen}`,
        `${friendlyTen} + ${remainingDifference} = ${leftOperand}`,
        `${adjustment} + ${remainingDifference} = ${answer}`
    ] as const;

    return {
        task: 'integer-add-subtract-strategy',
        strategy: 'subtraction-think-addition',
        operation: 'subtraction',
        leftOperand,
        rightOperand,
        answer,
        adjustment,
        prompt: `Think addition to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        transformedEquation,
        steps,
        explanation: `Count up from ${rightOperand} to ${leftOperand}: first ${adjustment} to reach ${friendlyTen}, then ${remainingDifference} more. The total increase is ${answer}.`
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
