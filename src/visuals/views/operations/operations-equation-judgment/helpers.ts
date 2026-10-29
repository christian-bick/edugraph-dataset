import {EquationJudgmentProblem} from '../../../../types/problems.ts';
import {isCanonicalJudgment} from '../../../../generators/arithmetic/arithmetic-equation-judgment/claims.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';

export type EquationClaim = {
    claimedAnswer: number;
    isTrue: boolean;
};

export const resolveEquationClaim = (
    data: EquationJudgmentProblem
): EquationClaim => {
    if (!isCanonicalJudgment(data)) throw new ViewValidationError('operations-equation-judgment',
        'The exact relation and its canonical bounded claim must agree.');
    return {claimedAnswer: data.claimedAnswer, isTrue: data.claimedAnswer === data.answer};
};
