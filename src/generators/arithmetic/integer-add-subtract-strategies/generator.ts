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

const nextMultipleOfTen = (value: number): number => Math.ceil(value / 10) * 10;

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

const subtractionThinkAddition = ({minimum, maximum}: Bounds): IntegerAddSubtractStrategyProblem | null => {
    const rightOperand = choose(eligibleValues(minimum, maximum, candidate => {
        if (candidate % 10 === 0) return false;
        const adjustment = nextTenAdjustment(candidate);
        const minimumRemaining = nextMultipleOfTen(Math.max(10, minimum - adjustment));
        return candidate + adjustment + minimumRemaining <= maximum;
    }));
    if (rightOperand === null) return null;

    const adjustment = nextTenAdjustment(rightOperand);
    const friendlyTen = rightOperand + adjustment;
    const minimumRemaining = nextMultipleOfTen(Math.max(10, minimum - adjustment));
    const maximumRemaining = Math.floor((maximum - friendlyTen) / 10) * 10;
    const remainingDifference = 10 * integerBetween(
        minimumRemaining / 10,
        maximumRemaining / 10
    );
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
    'addition-compensation': additionCompensation,
    'subtraction-compensation': subtractionCompensation,
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
