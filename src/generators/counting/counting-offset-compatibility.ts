import {Area, Scope} from 'edugraph-ts';
import {generatorLabelRule} from '../compatibility-rules.ts';

const lowerBounds = [
    [Scope.NumbersLarger5, 5],
    [Scope.NumbersLarger10, 10],
    [Scope.NumbersLarger20, 20],
    [Scope.NumbersLarger100, 100],
    [Scope.NumbersLarger120, 120]
] as const;

/** A fixed adjustment is an operand, so it must satisfy every selected lower bound. */
export function countingOffsetStepRangeRule(step: 1 | 10 | 100) {
    const excludedBounds = lowerBounds.filter(([, minimum]) => minimum > step).map(([label]) => label);
    return generatorLabelRule(`offset-${step}-operand-in-range`, excludedBounds,
        selected => !excludedBounds.some(selected));
}

export const tenOffsetRangeRules = [
    countingOffsetStepRangeRule(10),
    generatorLabelRule('ten-offset-profile-range', [
        Scope.TwoDigitLargestOperand, Scope.ThreeDigitLargestOperand, Scope.NumbersLarger10,
        Scope.NumbersSmaller20, Scope.NumbersSmaller100, Scope.NumbersSmaller120, Area.Increment
    ], selected => {
        // Zero-digit avoidance makes 121 the first feasible upper bound for a three-digit start.
        if (selected(Scope.ThreeDigitLargestOperand) && [
            Scope.NumbersSmaller20, Scope.NumbersSmaller100, Scope.NumbersSmaller120
        ].some(selected)) return false;
        return !selected(Scope.NumbersSmaller20)
            || !(selected(Scope.NumbersLarger10)
                || selected(Scope.TwoDigitLargestOperand) && selected(Area.Increment));
    })
] as const;

export const hundredOffsetRangeRules = [
    countingOffsetStepRangeRule(100),
    generatorLabelRule('hundred-offset-profile-range', [
        Scope.ThreeDigitLargestOperand, Scope.NumbersLarger20, Scope.NumbersLarger100,
        Scope.NumbersSmaller120, Area.Increment
    ], selected => !selected(Scope.NumbersSmaller120)
        || !(selected(Scope.NumbersLarger20) || selected(Scope.NumbersLarger100)
            || selected(Scope.ThreeDigitLargestOperand) && selected(Area.Increment)))
] as const;
