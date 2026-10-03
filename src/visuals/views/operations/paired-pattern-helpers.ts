import type {
    ArithmeticPairedPatternCorrespondence,
    ArithmeticPairedPatternProblem,
    ArithmeticPairedPatternSequence
} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const safeInteger = (value: unknown): value is number => Number.isSafeInteger(value);

function validSequence(sequence: ArithmeticPairedPatternSequence): boolean {
    if (!sequence || typeof sequence !== 'object' || !sequence.rule
        || sequence.rule.kind !== 'add-constant'
        || !safeInteger(sequence.start)
        || !safeInteger(sequence.rule.increment)
        || sequence.rule.increment <= 0
        || !Array.isArray(sequence.terms)
        || sequence.terms.length < 4
        || sequence.terms.length > 8
        || sequence.terms.some(term => !safeInteger(term))) return false;

    return sequence.terms[0] === sequence.start
        && sequence.terms.slice(1).every((term, index) =>
            term === sequence.terms[index]! + sequence.rule.increment);
}

/** Checks both recurrences; relation tasks additionally require a consistent correspondence. */
export function validatePairedPattern(
    viewId: string,
    data: ArithmeticPairedPatternProblem,
    requiresCorrespondence: boolean
): void {
    if (data.kind !== 'paired-additive-patterns'
        || !validSequence(data.first)
        || !validSequence(data.second)
        || data.first.terms.length !== data.second.terms.length) {
        throw new ViewValidationError(viewId, 'The two patterns must have complete, aligned additive recurrences.');
    }

    const {first, second, correspondence} = data;
    if (!correspondence) {
        if (requiresCorrespondence) {
            throw new ViewValidationError(viewId, 'A correspondence task requires an exact relation between the patterns.');
        }
        return;
    }
    if (typeof correspondence !== 'object') {
        throw new ViewValidationError(viewId, 'The stated correspondence is invalid.');
    }
    const validRelation = correspondence.kind === 'multiplicative'
        ? safeInteger(correspondence.factor)
            && correspondence.factor > 1
            && second.start === first.start * correspondence.factor
            && second.rule.increment === first.rule.increment * correspondence.factor
            && second.terms.every((term, index) => term === first.terms[index]! * correspondence.factor)
        : correspondence.kind === 'additive'
            && safeInteger(correspondence.difference)
            && second.start === first.start + correspondence.difference
            && second.rule.increment === first.rule.increment
            && second.terms.every((term, index) => term === first.terms[index]! + correspondence.difference);
    if (!validRelation) {
        throw new ViewValidationError(viewId, 'The stated correspondence must hold for the starts, rules, and every aligned term.');
    }
}

export function correspondenceStatement(relation: ArithmeticPairedPatternCorrespondence): string {
    if (relation.kind === 'multiplicative') {
        return `At every position, Pattern B is ${relation.factor} times Pattern A.`;
    }
    if (relation.difference === 0) return 'At every position, Pattern B equals Pattern A.';
    return relation.difference > 0
        ? `At every position, Pattern B is ${relation.difference} greater than Pattern A.`
        : `At every position, Pattern B is ${Math.abs(relation.difference)} less than Pattern A.`;
}

export function correspondenceExplanation(
    data: ArithmeticPairedPatternProblem,
    correspondence: ArithmeticPairedPatternCorrespondence
): string {
    const {first, second} = data;
    if (correspondence.kind === 'multiplicative') {
        return `Pattern A starts at ${first.start} and adds ${first.rule.increment} each step. Pattern B starts at ${second.start}, ${correspondence.factor} times the first start, and adds ${second.rule.increment}, ${correspondence.factor} times the first increase. The same factor therefore holds at every corresponding position.`;
    }
    if (correspondence.difference === 0) {
        return `Both patterns start at ${first.start} and add ${first.rule.increment} each step, so corresponding terms stay equal.`;
    }
    const direction = correspondence.difference > 0 ? 'higher' : 'lower';
    return `Pattern B starts ${Math.abs(correspondence.difference)} ${direction} than Pattern A. Both patterns add ${first.rule.increment} each step, so that difference remains the same at every corresponding position.`;
}
