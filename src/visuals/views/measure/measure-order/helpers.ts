import {MeasurementOrderProblem} from '../../../../types/problems.ts';

export type MeasurementOrderObject = {
    id: 'A' | 'B' | 'C';
    length: number;
};

export type MeasurementOrderPresentation = {
    objects: readonly MeasurementOrderObject[];
    answerIds: readonly MeasurementOrderObject['id'][];
};

const permutations = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0]
] as const;

const ids = ['A', 'B', 'C'] as const;

export function resolveMeasurementOrderPresentation(
    data: MeasurementOrderProblem,
    seed: number
): MeasurementOrderPresentation {
    const normalizedSeed = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0;
    const permutation = permutations[normalizedSeed % permutations.length]!;
    const objects = permutation.map((magnitudeIndex, presentationIndex) => ({
        id: ids[presentationIndex]!,
        length: data.magnitudes[magnitudeIndex]
    }));
    const answerIds = [...objects]
        .sort((left, right) => data.direction === 'ascending'
            ? left.length - right.length
            : right.length - left.length)
        .map(object => object.id);
    return {objects, answerIds};
}
