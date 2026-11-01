import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {EquationJudgmentProblem} from '../../../types/problems.ts';
import {adjacentFalseAnswer, type ExactJudgmentRelation} from './claims.ts';

export type JudgmentRelation = 'addition-positive' | 'addition-zero' | 'subtraction-positive' | 'subtraction-zero';

export interface JudgmentProfile {
    readonly relation: JudgmentRelation;
    readonly range: CanonicalNumericRange;
}

/** The stated proposal is an input, including when it is false. */
export const judgmentQuantities = (data: EquationJudgmentProblem): number[] =>
    [data.num1, data.num2, data.answer, data.claimedAnswer];

const originalDomain: EquationJudgmentProblem[] = [];
const addClaims = (exact: ExactJudgmentRelation): void => {
    originalDomain.push({...exact, claimedAnswer: exact.answer});
    const claimedAnswer = adjacentFalseAnswer(exact);
    if (claimedAnswer !== undefined) originalDomain.push({...exact, claimedAnswer});
};
// Retain the complete existing source domain, rather than retrying random proposals.
for (let first = 1; first <= 20; first++) {
    addClaims({num1: 0, num2: first, operation: 'addition', answer: first});
    addClaims({num1: first, num2: first, operation: 'subtraction', answer: 0});
    for (let second = 1; first + second <= 20; second++) {
        addClaims({num1: first, num2: second, operation: 'addition', answer: first + second});
        addClaims({num1: first + second, num2: first, operation: 'subtraction', answer: second});
    }
}

const domains = new Map<string, readonly EquationJudgmentProblem[]>();

/** A configuration selects a mathematical pool before generation; it never derives labels from a payload. */
export function judgmentDomain({relation, range}: JudgmentProfile): readonly EquationJudgmentProblem[] {
    if (!['addition-positive', 'addition-zero', 'subtraction-positive', 'subtraction-zero'].includes(relation)
        || !range || ![5, 10, 20].includes(range.max)) {
        throw new GeneratorValidationError('arithmetic-equation-judgment', 'Unsupported relation or canonical source band.');
    }
    let expected: CanonicalNumericRange;
    try {
        expected = createCanonicalNumericRange(range.max, range.min);
    } catch {
        throw new GeneratorValidationError('arithmetic-equation-judgment', 'Invalid canonical range.');
    }
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('arithmetic-equation-judgment', 'Canonical range witnesses are missing or inconsistent.');
    }
    const key = `${relation}:${range.min}:${range.max}`;
    if (!domains.has(key)) {
        const operation = relation.startsWith('addition-') ? 'addition' : 'subtraction';
        const zero = relation.endsWith('-zero');
        domains.set(key, originalDomain.filter(data => data.operation === operation
            && judgmentQuantities(data).includes(0) === zero
            && hasCanonicalRangeWitness(judgmentQuantities(data), range)));
    }
    return domains.get(key)!;
}
