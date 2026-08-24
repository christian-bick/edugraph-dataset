import {SquareArrayDimension} from '../../types/problems.ts';

export type NonUnitSquareArrayDimension = Exclude<SquareArrayDimension, 1>;

const ARRAY_DIMENSIONS: readonly (readonly [
    NonUnitSquareArrayDimension,
    NonUnitSquareArrayDimension
])[] = [
    [2, 3],
    [3, 2],
    [2, 4],
    [4, 2],
    [2, 5],
    [5, 2],
    [3, 4],
    [4, 3],
    [3, 5],
    [5, 3],
    [4, 5],
    [5, 4]
];

export const selectArrayDimensions = (
    randomValue: number
): readonly [NonUnitSquareArrayDimension, NonUnitSquareArrayDimension] => {
    const bounded = Number.isFinite(randomValue)
        ? Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON)
        : 0;
    return ARRAY_DIMENSIONS[Math.floor(bounded * ARRAY_DIMENSIONS.length)]!;
};
