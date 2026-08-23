import {
    IntegerAddSubtractStrategy,
    IntegerAddSubtractStrategyProblem,
    IntegerAddSubtractStrategyStep
} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

export type CountingRelationStrategy = Extract<
    IntegerAddSubtractStrategy,
    'addition-counting-on' | 'subtraction-counting-back'
>;

export type IntegerAddSubtractStrategyPresentation = {
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    transformedEquation: string;
    steps: string[];
    explanation: string;
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

const stepsEqual = (
    actual: readonly IntegerAddSubtractStrategyStep[],
    expected: readonly IntegerAddSubtractStrategyStep[]
): boolean => actual.length === expected.length
    && actual.every((step, index) => JSON.stringify(step) === JSON.stringify(expected[index]));

export const isCountingRelationStrategy = (
    strategy: IntegerAddSubtractStrategy
): strategy is CountingRelationStrategy =>
    strategy === 'addition-counting-on' || strategy === 'subtraction-counting-back';

export const validateCountingRelationStrategy = (
    strategy: IntegerAddSubtractStrategy,
    viewId: string
): CountingRelationStrategy => {
    if (!isCountingRelationStrategy(strategy)) {
        throw new ViewValidationError(
            viewId,
            'Counting-operation derivation supports only counting-on and counting-back relationships.'
        );
    }
    return strategy;
};

const hasExactCommonFields = (data: IntegerAddSubtractStrategyProblem): boolean =>
    typeof data === 'object'
    && data !== null
    && data.task === 'integer-add-subtract-strategy'
    && (data.operation === 'addition' || data.operation === 'subtraction')
    && Number.isInteger(data.leftOperand)
    && Number.isInteger(data.rightOperand)
    && Number.isInteger(data.answer)
    && Number.isInteger(data.adjustment)
    && data.leftOperand > 0
    && data.rightOperand > 0
    && data.answer > 0
    && data.leftOperand < 1000
    && data.rightOperand < 1000
    && data.answer < 1000
    && data.adjustment >= 1
    && data.adjustment <= 9
    && Array.isArray(data.steps)
    && data.steps.length >= 1
    && data.steps.length <= 3
    && data.steps.every(step => typeof step === 'object' && step !== null);

export const isValidIntegerAddSubtractStrategyProblem = (
    data: IntegerAddSubtractStrategyProblem
): boolean => {
    if (!hasExactCommonFields(data)) return false;
    const {leftOperand, rightOperand, answer, adjustment} = data;

    if (data.strategy === 'addition-counting-on') {
        return data.operation === 'addition'
            && rightOperand >= 1
            && rightOperand <= 3
            && adjustment === rightOperand
            && answer === leftOperand + rightOperand
            && stepsEqual(data.steps, Array.from(
                {length: rightOperand},
                (_, index) => operationStep(
                    'addition', leftOperand + index, 1, leftOperand + index + 1
                )
            ));
    }

    if (data.strategy === 'subtraction-counting-back') {
        return data.operation === 'subtraction'
            && rightOperand >= 1
            && rightOperand <= 3
            && adjustment === rightOperand
            && answer === leftOperand - rightOperand
            && stepsEqual(data.steps, Array.from(
                {length: rightOperand},
                (_, index) => operationStep(
                    'subtraction', leftOperand - index, 1, leftOperand - index - 1
                )
            ));
    }

    if (data.strategy === 'addition-make-ten') {
        const remainder = rightOperand - adjustment;
        return data.operation === 'addition'
            && leftOperand >= 6
            && leftOperand < 10
            && answer === leftOperand + rightOperand
            && adjustment === 10 - leftOperand
            && remainder > 0
            && stepsEqual(data.steps, [
                decompositionStep(rightOperand, adjustment, remainder),
                operationStep('addition', leftOperand, adjustment, 10),
                operationStep('addition', 10, remainder, answer)
            ]);
    }

    if (data.strategy === 'addition-near-doubles') {
        const base = Math.min(leftOperand, rightOperand);
        const knownDouble = 2 * base;
        return data.operation === 'addition'
            && Math.abs(leftOperand - rightOperand) === 1
            && adjustment === 1
            && answer === leftOperand + rightOperand
            && stepsEqual(data.steps, [
                operationStep('addition', base, base, knownDouble),
                operationStep('addition', knownDouble, 1, answer)
            ]);
    }

    if (data.strategy === 'addition-compensation') {
        const adjustedLeft = leftOperand - adjustment;
        const friendlyRight = rightOperand + adjustment;
        return data.operation === 'addition'
            && answer === leftOperand + rightOperand
            && adjustedLeft > 0
            && friendlyRight < 1000
            && friendlyRight % 10 === 0
            && stepsEqual(data.steps, [
                operationStep('subtraction', leftOperand, adjustment, adjustedLeft),
                operationStep('addition', rightOperand, adjustment, friendlyRight),
                operationStep('addition', adjustedLeft, friendlyRight, answer)
            ]);
    }

    if (data.strategy === 'subtraction-compensation') {
        const adjustedLeft = leftOperand + adjustment;
        const friendlyRight = rightOperand + adjustment;
        return data.operation === 'subtraction'
            && answer === leftOperand - rightOperand
            && adjustedLeft < 1000
            && friendlyRight < 1000
            && friendlyRight % 10 === 0
            && stepsEqual(data.steps, [
                operationStep('addition', rightOperand, adjustment, friendlyRight),
                operationStep('addition', leftOperand, adjustment, adjustedLeft),
                operationStep('subtraction', adjustedLeft, friendlyRight, answer)
            ]);
    }

    if (data.strategy === 'subtraction-make-ten') {
        const remainder = rightOperand - adjustment;
        return data.operation === 'subtraction'
            && leftOperand > 10
            && leftOperand < 20
            && answer === leftOperand - rightOperand
            && adjustment === leftOperand - 10
            && remainder > 0
            && stepsEqual(data.steps, [
                decompositionStep(rightOperand, adjustment, remainder),
                operationStep('subtraction', leftOperand, adjustment, 10),
                operationStep('subtraction', 10, remainder, answer)
            ]);
    }

    if (data.strategy === 'subtraction-think-addition') {
        const friendlyTen = rightOperand + adjustment;
        const remainingDifference = answer - adjustment;
        return data.operation === 'subtraction'
            && answer === leftOperand - rightOperand
            && friendlyTen < 1000
            && friendlyTen % 10 === 0
            && remainingDifference > 0
            && stepsEqual(data.steps, [
                operationStep('addition', rightOperand, adjustment, friendlyTen),
                operationStep('addition', friendlyTen, remainingDifference, leftOperand),
                operationStep('addition', adjustment, remainingDifference, answer)
            ]);
    }

    return false;
};

const formatStep = (step: IntegerAddSubtractStrategyStep): string => {
    if (step.kind === 'decomposition') {
        return `${step.whole} = ${step.parts[0]} + ${step.parts[1]}`;
    }
    const symbol = step.operation === 'addition' ? '+' : '−';
    return `${step.leftOperand} ${symbol} ${step.rightOperand} = ${step.result}`;
};

export const getIntegerAddSubtractStrategyPresentation = (
    data: IntegerAddSubtractStrategyProblem
): IntegerAddSubtractStrategyPresentation => {
    const {leftOperand, rightOperand, answer, adjustment} = data;
    const operationSymbol = data.operation === 'addition' ? '+' : '−';
    const questionEquation = `${leftOperand} ${operationSymbol} ${rightOperand} = ?`;
    const solutionEquation = `${leftOperand} ${operationSymbol} ${rightOperand} = ${answer}`;
    let prompt: string;
    let transformedEquation: string;
    let explanation: string;

    if (data.strategy === 'addition-counting-on') {
        const unitAddends = Array.from({length: rightOperand}, () => '1').join(' + ');
        prompt = `Count on to solve ${questionEquation}`;
        transformedEquation = `${leftOperand} + ${rightOperand} = ${leftOperand} + (${unitAddends})`;
        explanation = `Start at ${leftOperand} and count forward ${rightOperand} ${rightOperand === 1 ? 'step' : 'steps'} to reach ${answer}.`;
    } else if (data.strategy === 'subtraction-counting-back') {
        const unitSubtrahends = Array.from({length: rightOperand}, () => '1').join(' − ');
        prompt = `Count back to solve ${questionEquation}`;
        transformedEquation = `${leftOperand} − ${rightOperand} = ${leftOperand} − ${unitSubtrahends}`;
        explanation = `Start at ${leftOperand} and count backward ${rightOperand} ${rightOperand === 1 ? 'step' : 'steps'} to reach ${answer}.`;
    } else if (data.strategy === 'addition-make-ten') {
        const remainder = rightOperand - adjustment;
        prompt = `Make ten to solve ${questionEquation}`;
        transformedEquation = `${leftOperand} + ${rightOperand} = ${leftOperand} + (${adjustment} + ${remainder})`;
        explanation = `Decompose ${rightOperand} as ${adjustment} + ${remainder}. Add ${adjustment} to ${leftOperand} to make 10, then add the remaining ${remainder} to get ${answer}.`;
    } else if (data.strategy === 'addition-near-doubles') {
        const base = Math.min(leftOperand, rightOperand);
        const knownDouble = 2 * base;
        prompt = `Use a near double to solve ${questionEquation}`;
        transformedEquation = `${leftOperand} + ${rightOperand} = ${base} + ${base} + 1`;
        explanation = `${leftOperand} and ${rightOperand} differ by 1. Use the known double ${base} + ${base} = ${knownDouble}, then add 1 to get ${answer}.`;
    } else if (data.strategy === 'addition-compensation') {
        const adjustedLeft = leftOperand - adjustment;
        const friendlyRight = rightOperand + adjustment;
        prompt = `Use compensation to solve ${questionEquation}`;
        transformedEquation = `${leftOperand} + ${rightOperand} = ${adjustedLeft} + ${friendlyRight}`;
        explanation = `Move ${adjustment} from ${leftOperand} to ${rightOperand}. This keeps the sum unchanged and creates the friendly addend ${friendlyRight}.`;
    } else if (data.strategy === 'subtraction-compensation') {
        const adjustedLeft = leftOperand + adjustment;
        const friendlyRight = rightOperand + adjustment;
        prompt = `Use compensation to solve ${questionEquation}`;
        transformedEquation = `${leftOperand} − ${rightOperand} = ${adjustedLeft} − ${friendlyRight}`;
        explanation = `Add ${adjustment} to both numbers. Their difference stays unchanged, and the new subtrahend ${friendlyRight} is a multiple of ten.`;
    } else if (data.strategy === 'subtraction-make-ten') {
        const remainder = rightOperand - adjustment;
        prompt = `Make ten to solve ${questionEquation}`;
        transformedEquation = `${leftOperand} − ${rightOperand} = ${leftOperand} − (${adjustment} + ${remainder})`;
        explanation = `Decompose ${rightOperand} as ${adjustment} + ${remainder}. Subtract ${adjustment} from ${leftOperand} to reach 10, then subtract the remaining ${remainder} to get ${answer}.`;
    } else {
        const friendlyTen = rightOperand + adjustment;
        const remainingDifference = answer - adjustment;
        prompt = `Think addition to solve ${questionEquation}`;
        transformedEquation = `${rightOperand} + ? = ${leftOperand}`;
        explanation = `Count up from ${rightOperand} to ${leftOperand}: first ${adjustment} to reach ${friendlyTen}, then ${remainingDifference} more. The total increase is ${answer}.`;
    }

    return {
        prompt,
        questionEquation,
        solutionEquation,
        transformedEquation,
        steps: data.steps.map(formatStep),
        explanation
    };
};

export const maskEquationResult = (equation: string): string => {
    const decomposition = equation.match(/^(\d+ = \d+ \+ )\d+$/);
    if (decomposition) return `${decomposition[1]}?`;

    const separatorIndex = equation.lastIndexOf(' = ');
    return separatorIndex < 0 ? equation : `${equation.slice(0, separatorIndex)} = ?`;
};

export const formatOperationRelationship = (
    data: IntegerAddSubtractStrategyProblem,
    revealOperation: boolean
): string => {
    const operation = revealOperation
        ? (data.operation === 'addition' ? '+' : '−')
        : '□';
    return `${data.leftOperand} ${operation} ${data.rightOperand} = ${data.answer}`;
};
