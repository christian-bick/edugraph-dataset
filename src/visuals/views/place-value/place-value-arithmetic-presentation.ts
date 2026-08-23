import {
    PlaceValueArithmeticProblem,
    PlaceValueArithmeticStep
} from '../../../types/problems.ts';

export type ExplanationStepPresentation = {
    equation: string | null;
    explanation: string;
};

export const usesWholeTensPresentation = (data: PlaceValueArithmeticProblem): boolean =>
    data.operation === 'subtraction'
    && data.operandProfile === 'multiples-of-ten'
    && data.answer > 0;

export const regroupingPresentation = (data: PlaceValueArithmeticProblem): string => {
    if (usesWholeTensPresentation(data)) {
        return 'Both operands contain whole tens, so no ones or regrouping are involved.';
    }
    if (data.regrouping.kind === 'compose-ten') {
        return `Compose 10 of the ${data.regrouping.onesBefore} ones as 1 ten, leaving ${data.regrouping.onesAfter} ones.`;
    }
    if (data.regrouping.kind === 'decompose-ten') {
        return `Decompose 1 ten as 10 ones, changing ${data.regrouping.onesBefore} ones to ${data.regrouping.onesAfter} ones.`;
    }
    return data.operation === 'addition'
        ? `${data.regrouping.onesBefore} ones stay in the ones place; no ten is composed.`
        : `${data.regrouping.onesBefore} ones can subtract ${data.operands[1].ones} ones directly; no ten is decomposed.`;
};

const standardStepPresentation = (
    data: PlaceValueArithmeticProblem,
    step: PlaceValueArithmeticStep
): ExplanationStepPresentation => {
    const [left, right] = data.operands;
    const upperLeft = data.num1 - left.ones;
    const upperRight = data.num2 - right.ones;

    if (step.kind === 'combine-ones') {
        const total = left.ones + right.ones;
        const equation = `${left.ones} + ${right.ones} = ${total}`;
        return {equation, explanation: `Combine the ones: ${equation}.`};
    }
    if (step.kind === 'compose-ten') {
        const equation = `${data.regrouping.onesBefore} = 10 + ${data.regrouping.onesAfter}`;
        return {
            equation,
            explanation: `Compose a ten: ${data.regrouping.onesBefore} ones = 1 ten and ${data.regrouping.onesAfter} ones.`
        };
    }
    if (step.kind === 'combine-tens') {
        const equation = `${upperLeft} + ${upperRight} = ${data.answer - data.result.ones}`;
        return {equation, explanation: `Combine the tens and hundreds: ${equation}.`};
    }
    if (step.kind === 'decompose-ten') {
        const remainingUpper = upperLeft - 10;
        const equation = `${upperLeft} = ${remainingUpper} + 10`;
        return {equation, explanation: `Decompose one ten: ${equation}.`};
    }
    if (step.kind === 'subtract-ones') {
        const availableOnes = data.regrouping.kind === 'decompose-ten'
            ? data.regrouping.onesAfter
            : left.ones;
        const equation = `${availableOnes} − ${right.ones} = ${data.result.ones}`;
        return {equation, explanation: `Subtract the ones: ${equation}.`};
    }
    if (step.kind === 'subtract-tens') {
        const equation = `${upperLeft} − ${upperRight} = ${data.answer - data.result.ones}`;
        return {equation, explanation: `Subtract the tens and hundreds: ${equation}.`};
    }

    if (data.operation === 'addition') {
        const equation = data.regrouping.kind === 'compose-ten'
            ? `${upperLeft} + ${upperRight} + 10 + ${data.regrouping.onesAfter} = ${data.answer}`
            : `${upperLeft} + ${upperRight} + ${data.regrouping.onesBefore} = ${data.answer}`;
        return {
            equation,
            explanation: data.regrouping.kind === 'compose-ten'
                ? `Combine the tens, the composed ten, and ${data.regrouping.onesAfter} ones to get ${data.answer}.`
                : `Combine the place-value parts: ${equation}.`
        };
    }
    const equation = data.regrouping.kind === 'decompose-ten'
        ? `${upperLeft - 10} − ${upperRight} + ${data.result.ones} = ${data.answer}`
        : `${data.answer - data.result.ones} + ${data.result.ones} = ${data.answer}`;
    return {
        equation,
        explanation: data.regrouping.kind === 'decompose-ten'
            ? `Subtract the remaining place-value parts and combine them to get ${data.answer}.`
            : `Combine the remaining place-value parts to get ${data.answer}.`
    };
};

export const strategyStepPresentation = (
    data: PlaceValueArithmeticProblem,
    step: PlaceValueArithmeticStep
): ExplanationStepPresentation => {
    if (!usesWholeTensPresentation(data)) return standardStepPresentation(data, step);
    if (step.kind === 'subtract-ones') {
        return {equation: null, explanation: 'There are no ones to subtract.'};
    }
    if (step.kind === 'subtract-tens') {
        const equation = `${data.num1} − ${data.num2} = ${data.answer}`;
        return {equation, explanation: `Subtract the tens: ${equation}.`};
    }
    if (step.kind === 'result') {
        return {
            equation: `Result: ${data.answer}`,
            explanation: `The remaining tens give ${data.answer}.`
        };
    }
    return standardStepPresentation(data, step);
};
