import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../lib/resolvers.ts';

/** Ten/hundred offsets retain their independently reviewed legacy range contract. */
export const legacyOffsetRange = [deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000]), resolveRangeFromLabels] as const;

export const arithmeticOffsetDirection = [
    [Area.Increment, Area.Decrement],
    selectExactLabelMap([
        [Area.Increment, 'inc'],
        [Area.Decrement, 'dec']
    ] as const)
] as const;

export const arithmeticOffsetOperandProfile = [
    [Scope.TwoDigitLargestOperand, Scope.ThreeDigitLargestOperand],
    selectExactLabelSetMap([
        [[], 'unrestricted'],
        [[Scope.TwoDigitLargestOperand], 'two-digit'],
        [[Scope.ThreeDigitLargestOperand], 'three-digit']
    ] as const)
] as const;

export const hundredOffsetOperandProfile = [
    [Scope.ThreeDigitLargestOperand],
    selectExactLabelSetMap([
        [[], 'unrestricted'],
        [[Scope.ThreeDigitLargestOperand], 'three-digit']
    ] as const)
] as const;
