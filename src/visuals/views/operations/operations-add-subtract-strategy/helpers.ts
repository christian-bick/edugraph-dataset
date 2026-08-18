import {IntegerAddSubtractStrategyProblem} from '../../../../types/problems.ts';

const hasExactCommonFields = (data: IntegerAddSubtractStrategyProblem): boolean =>
    data.task === 'integer-add-subtract-strategy'
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
    && data.steps.length === 3
    && data.steps.every(step => typeof step === 'string' && step.length > 0)
    && data.prompt.length > 0
    && data.questionEquation.length > 0
    && data.solutionEquation.length > 0
    && data.transformedEquation.length > 0
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
            && remainingDifference % 10 === 0
            && leftOperand % 10 === 0
            && data.transformedEquation === `${rightOperand} + ? = ${leftOperand}`
            && data.steps[0] === `${rightOperand} + ${adjustment} = ${friendlyTen}`
            && data.steps[1] === `${friendlyTen} + ${remainingDifference} = ${leftOperand}`
            && data.steps[2] === `${adjustment} + ${remainingDifference} = ${answer}`;
    }

    return false;
};

export const maskEquationResult = (equation: string): string => {
    const separatorIndex = equation.lastIndexOf(' = ');
    return separatorIndex < 0 ? equation : `${equation.slice(0, separatorIndex)} = ?`;
};
