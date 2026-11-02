import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../lib/resolvers.ts';

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
