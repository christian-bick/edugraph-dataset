import {EquationJudgmentProblem} from '../../../../types/problems.ts';

export type EquationClaim = {
    claimedAnswer: number;
    isTrue: boolean;
};

export const resolveEquationClaim = (
    data: EquationJudgmentProblem,
    seed: number
): EquationClaim => {
    const isTrue = Math.abs(Math.trunc(seed)) % 2 === 0;
    if (isTrue) return {claimedAnswer: data.answer, isTrue};

    const maximumCanonicalValue = Math.max(data.num1, data.num2, data.answer);
    const claimedAnswer = [data.answer - 1, data.answer + 1]
        .find(value => value >= 0 && value <= maximumCanonicalValue && value !== data.answer);
    if (claimedAnswer === undefined) {
        throw new Error('The exact relation has no bounded neighboring false claim.');
    }
    return {claimedAnswer, isTrue};
};
