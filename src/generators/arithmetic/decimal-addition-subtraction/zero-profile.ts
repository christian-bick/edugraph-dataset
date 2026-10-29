import type {DecimalAddSubtractProblem, DecimalAddSubtractUnitCounts} from '../../../types/problems.ts';

const containsZero = (counts: DecimalAddSubtractUnitCounts) => Object.values(counts).includes(0);

/** Visible unit quantities, including every exchange's before/after counts. */
export const hasDecimalUnitZero = (data: DecimalAddSubtractProblem): boolean =>
    data.first.alignedDigits.includes(0) || data.second.alignedDigits.includes(0)
    || containsZero(data.model.initial) || containsZero(data.model.final)
    || data.model.steps.some(step => containsZero(step.before) || containsZero(step.after));
