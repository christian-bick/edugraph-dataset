import {
    IntegerAddSubtractStrategy,
    IntegerAddSubtractStrategyProblem
} from '../../../../types/problems.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';

export type CountingRelationStrategy = Extract<
    IntegerAddSubtractStrategy,
    'addition-counting-on' | 'subtraction-counting-back'
>;

export const isCountingRelationStrategy = (
    strategy: IntegerAddSubtractStrategy
): strategy is CountingRelationStrategy =>
    strategy === 'addition-counting-on' || strategy === 'subtraction-counting-back';

export const validateCountingRelationStrategy = (
    strategy: IntegerAddSubtractStrategy
): CountingRelationStrategy => {
    if (!isCountingRelationStrategy(strategy)) {
        throw new ViewValidationError(
            'operations-add-subtract-strategy',
            'Concept derivation mode supports only counting-on and counting-back relationships.'
        );
    }
    return strategy;
};

const hasExactCommonFields = (data: IntegerAddSubtractStrategyProblem): boolean =>
    data.task === 'integer-add-subtract-strategy'
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
    && data.steps.every(step => typeof step === 'string' && step.length > 0)
    && typeof data.prompt === 'string'
    && data.prompt.length > 0
    && typeof data.questionEquation === 'string'
    && data.questionEquation.length > 0
    && typeof data.solutionEquation === 'string'
    && data.solutionEquation.length > 0
    && typeof data.transformedEquation === 'string'
    && data.transformedEquation.length > 0
    && typeof data.explanation === 'string'
    && data.explanation.length > 0;

export const isValidIntegerAddSubtractStrategyProblem = (
    data: IntegerAddSubtractStrategyProblem
): boolean => {
    if (!hasExactCommonFields(data)) return false;
    const {leftOperand, rightOperand, answer, adjustment} = data;
    const expectedQuestion = data.operation === 'addition'
        ? `${leftOperand} + ${rightOperand} = ?`
        : `${leftOperand} − ${rightOperand} = ?`;
    const expectedSolution = data.operation === 'addition'
        ? `${leftOperand} + ${rightOperand} = ${answer}`
        : `${leftOperand} − ${rightOperand} = ${answer}`;
    if (data.questionEquation !== expectedQuestion || data.solutionEquation !== expectedSolution) {
        return false;
    }

    if (data.strategy === 'addition-counting-on') {
        const expectedSteps = Array.from(
            {length: rightOperand},
            (_, index) => `${leftOperand + index} + 1 = ${leftOperand + index + 1}`
        );
        const unitAddends = Array.from({length: rightOperand}, () => '1').join(' + ');
        return data.operation === 'addition'
            && rightOperand >= 1
            && rightOperand <= 3
            && adjustment === rightOperand
            && answer === leftOperand + rightOperand
            && data.transformedEquation === `${leftOperand} + ${rightOperand} = ${leftOperand} + (${unitAddends})`
            && data.steps.length === rightOperand
            && data.steps.every((step, index) => step === expectedSteps[index]);
    }

    if (data.strategy === 'subtraction-counting-back') {
        const expectedSteps = Array.from(
            {length: rightOperand},
            (_, index) => `${leftOperand - index} − 1 = ${leftOperand - index - 1}`
        );
        const unitSubtrahends = Array.from({length: rightOperand}, () => '1').join(' − ');
        return data.operation === 'subtraction'
            && rightOperand >= 1
            && rightOperand <= 3
            && adjustment === rightOperand
            && answer === leftOperand - rightOperand
            && data.transformedEquation === `${leftOperand} − ${rightOperand} = ${leftOperand} − ${unitSubtrahends}`
            && data.steps.length === rightOperand
            && data.steps.every((step, index) => step === expectedSteps[index]);
    }

    if (data.strategy === 'addition-make-ten') {
        const remainder = rightOperand - adjustment;
        return data.operation === 'addition'
            && leftOperand >= 6
            && leftOperand < 10
            && answer === leftOperand + rightOperand
            && adjustment === 10 - leftOperand
            && remainder > 0
            && data.transformedEquation === `${leftOperand} + ${rightOperand} = ${leftOperand} + (${adjustment} + ${remainder})`
            && data.steps.length === 3
            && data.steps[0] === `${rightOperand} = ${adjustment} + ${remainder}`
            && data.steps[1] === `${leftOperand} + ${adjustment} = 10`
            && data.steps[2] === `10 + ${remainder} = ${answer}`;
    }

    if (data.strategy === 'addition-near-doubles') {
        const base = Math.min(leftOperand, rightOperand);
        const knownDouble = 2 * base;
        return data.operation === 'addition'
            && Math.abs(leftOperand - rightOperand) === 1
            && adjustment === 1
            && answer === leftOperand + rightOperand
            && data.transformedEquation === `${leftOperand} + ${rightOperand} = ${base} + ${base} + 1`
            && data.steps.length === 2
            && data.steps[0] === `${base} + ${base} = ${knownDouble}`
            && data.steps[1] === `${knownDouble} + 1 = ${answer}`;
    }

    if (data.strategy === 'addition-compensation') {
        const adjustedLeft = leftOperand - adjustment;
        const friendlyRight = rightOperand + adjustment;
        return data.operation === 'addition'
            && answer === leftOperand + rightOperand
            && adjustedLeft > 0
            && friendlyRight < 1000
            && friendlyRight % 10 === 0
            && data.transformedEquation === `${leftOperand} + ${rightOperand} = ${adjustedLeft} + ${friendlyRight}`
            && data.steps[0] === `${leftOperand} − ${adjustment} = ${adjustedLeft}`
            && data.steps[1] === `${rightOperand} + ${adjustment} = ${friendlyRight}`
            && data.steps[2] === `${adjustedLeft} + ${friendlyRight} = ${answer}`;
    }

    if (data.strategy === 'subtraction-compensation') {
        const adjustedLeft = leftOperand + adjustment;
        const friendlyRight = rightOperand + adjustment;
        return data.operation === 'subtraction'
            && answer === leftOperand - rightOperand
            && adjustedLeft < 1000
            && friendlyRight < 1000
            && friendlyRight % 10 === 0
            && data.transformedEquation === `${leftOperand} − ${rightOperand} = ${adjustedLeft} − ${friendlyRight}`
            && data.steps[0] === `${rightOperand} + ${adjustment} = ${friendlyRight}`
            && data.steps[1] === `${leftOperand} + ${adjustment} = ${adjustedLeft}`
            && data.steps[2] === `${adjustedLeft} − ${friendlyRight} = ${answer}`;
    }

    if (data.strategy === 'subtraction-make-ten') {
        const remainder = rightOperand - adjustment;
        return data.operation === 'subtraction'
            && leftOperand > 10
            && leftOperand < 20
            && answer === leftOperand - rightOperand
            && adjustment === leftOperand - 10
            && remainder > 0
            && data.transformedEquation === `${leftOperand} − ${rightOperand} = ${leftOperand} − (${adjustment} + ${remainder})`
            && data.steps[0] === `${rightOperand} = ${adjustment} + ${remainder}`
            && data.steps[1] === `${leftOperand} − ${adjustment} = 10`
            && data.steps[2] === `10 − ${remainder} = ${answer}`;
    }

    if (data.strategy === 'subtraction-think-addition') {
        const friendlyTen = rightOperand + adjustment;
        const remainingDifference = answer - adjustment;
        return data.operation === 'subtraction'
            && answer === leftOperand - rightOperand
            && friendlyTen < 1000
            && friendlyTen % 10 === 0
            && remainingDifference > 0
            && data.transformedEquation === `${rightOperand} + ? = ${leftOperand}`
            && data.steps[0] === `${rightOperand} + ${adjustment} = ${friendlyTen}`
            && data.steps[1] === `${friendlyTen} + ${remainingDifference} = ${leftOperand}`
            && data.steps[2] === `${adjustment} + ${remainingDifference} = ${answer}`;
    }

    return false;
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
