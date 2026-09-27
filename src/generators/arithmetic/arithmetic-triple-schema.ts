import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {hasLabel} from '../../lib/resolvers.ts';
import type {ConfigFromSchema} from '../../types/schema.ts';
import {arithmeticOperations, resolvePropertyAwareOperation} from './helpers.ts';

export const arithmeticTripleLabels = [
    Scope.ThreeOperands,
    Scope.IntegerNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives
] as const;

export const arithmeticTripleSchema = {
    operation: [[...arithmeticOperations, Area.Sum], resolvePropertyAwareOperation],
    requireZero: [[Scope.NumbersWithZero, Scope.NumbersWithoutZero], hasLabel(Scope.NumbersWithZero)],
    requireMultipleOf10: [[Scope.MultiplesOf10], hasLabel(Scope.MultiplesOf10)],
    useCommutativeLaw: [[Area.CommutativeLaw], hasLabel(Area.CommutativeLaw)],
    useAssociativeLaw: [[Area.AssociativeLaw], hasLabel(Area.AssociativeLaw)],
    useDistributiveLaw: [[Area.DistributiveLaw], hasLabel(Area.DistributiveLaw)],
    range: [deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]), resolveRangeFromLabels]
} as const;

export type ArithmeticTripleSamplingConfig = ConfigFromSchema<typeof arithmeticTripleSchema>;
