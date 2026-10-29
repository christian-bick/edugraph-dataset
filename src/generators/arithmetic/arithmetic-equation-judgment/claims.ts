import type {EquationJudgmentProblem} from '../../../types/problems.ts';

export type ExactJudgmentRelation = Omit<EquationJudgmentProblem, 'claimedAnswer'>;

/** The original bounded neighboring false equality, independent of any learner action. */
export function adjacentFalseAnswer(data: ExactJudgmentRelation): number | undefined {
    const maximum = Math.max(data.num1, data.num2, data.answer);
    return [data.answer - 1, data.answer + 1]
        .find(value => value >= 0 && value <= maximum && value !== data.answer);
}

export function isCanonicalJudgment(data: EquationJudgmentProblem): boolean {
    const exact = data.operation === 'addition' ? data.num1 + data.num2 : data.num1 - data.num2;
    return ['addition', 'subtraction'].includes(data.operation)
        && [data.num1, data.num2, data.answer, data.claimedAnswer].every(value => Number.isSafeInteger(value) && value >= 0)
        && data.answer === exact
        && (data.claimedAnswer === data.answer || data.claimedAnswer === adjacentFalseAnswer(data));
}
