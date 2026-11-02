import {Scope} from 'edugraph-ts';

export const roundingPlaces = [
    [Scope.StepsOf10, 10], [Scope.StepsOf100, 100], [Scope.StepsOf1000, 1000],
    [Scope.StepsOf10000, 10000], [Scope.StepsOf100000, 100000]
] as const;
export const midpointClearanceRatio = 0.05;
