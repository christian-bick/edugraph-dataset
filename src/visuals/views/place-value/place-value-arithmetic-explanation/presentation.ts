import {
    PlaceValueArithmeticProblem,
    PlaceValueArithmeticStep
} from '../../../../types/problems.ts';

export type ExplanationStepPresentation = {
    equation: string | null;
    explanation: string;
};

export const usesWholeTensPresentation = (data: PlaceValueArithmeticProblem): boolean =>
    data.operation === 'subtraction'
    && data.operandProfile === 'multiples-of-ten'
    && data.answer > 0;

export const regroupingPresentation = (data: PlaceValueArithmeticProblem): string =>
    usesWholeTensPresentation(data)
        ? 'Both operands contain whole tens, so no ones or regrouping are involved.'
        : data.regrouping.statement;

export const strategyStepPresentation = (
    data: PlaceValueArithmeticProblem,
    step: PlaceValueArithmeticStep
): ExplanationStepPresentation => {
    if (!usesWholeTensPresentation(data)) {
        return {equation: step.equation, explanation: step.explanation};
    }
    if (step.kind === 'subtract-ones') {
        return {
            equation: null,
            explanation: 'There are no ones to subtract.'
        };
    }
    if (step.kind === 'subtract-tens') {
        return {
            equation: step.equation,
            explanation: `Subtract the tens: ${step.equation}.`
        };
    }
    if (step.kind === 'result') {
        return {
            equation: `Result: ${data.answer}`,
            explanation: `The remaining tens give ${data.answer}.`
        };
    }
    return {equation: step.equation, explanation: step.explanation};
};
