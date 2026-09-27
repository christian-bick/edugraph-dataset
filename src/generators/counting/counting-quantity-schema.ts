import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {resolveParityConstraint} from './helpers.ts';

export const countingQuantityLabels = [
    Area.NumerationWithIntegers,
    Scope.IntegerNumbers,
    Scope.NumbersWithoutZero,
    Scope.NumbersWithoutNegatives,
    Scope.AdditiveCount
] as const;

export const countingQuantitySchema = {
    parity: [
        [Area.EvenDivisibility, Area.UnevenDivisibility, Scope.EvenNumbers, Scope.OddNumbers],
        resolveParityConstraint,
        [
            [Area.EvenDivisibility],
            [Scope.EvenNumbers],
            [Area.EvenDivisibility, Scope.EvenNumbers],
            [Area.UnevenDivisibility],
            [Scope.OddNumbers],
            [Area.UnevenDivisibility, Scope.OddNumbers]
        ]
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller20]),
        resolveRangeFromLabels
    ]
} as const;
