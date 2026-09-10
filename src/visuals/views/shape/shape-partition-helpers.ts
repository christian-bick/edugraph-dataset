import {
    FractionParts,
    FractionShareName,
    ShapePartitionProblem,
    ShapeFractionRegionProblem,
    ShapeUnitShareComparisonProblem
} from '../../../types/problems.ts';

export type ShapePartitionModel = ShapePartitionProblem | ShapeFractionRegionProblem | ShapeUnitShareComparisonProblem;

export type ShapePartitionTask =
    | 'partition'
    | 'name-share'
    | 'compose-whole'
    | 'compare-share-size'
    | 'partition-and-label-unit-fraction'
    | 'interpret-fraction';

export const resolveShapePartitionTask = (
    data: ShapePartitionModel,
    task: ShapePartitionTask
): ShapePartitionTask | null => {
    if (data.kind === 'share-comparison') {
        return task === 'compare-share-size' ? task : null;
    }
    if (data.kind === 'selected-region') {
        return task === 'interpret-fraction' ? task : null;
    }
    if (task === 'partition-and-label-unit-fraction') return task;
    if (task === 'partition') return task;
    if (task === 'name-share' || task === 'compose-whole') return task;
    return null;
};

export const isValidShapePartitionProblem = (data: ShapePartitionModel): boolean => {
    if (data.shape !== 'circle' && data.shape !== 'rectangle') return false;
    if (data.kind === 'share-comparison') {
        return data.leftParts === 4
            && data.relation === 'less'
            && data.rightParts === 2;
    }
    if (!isFractionParts(data.parts)) return false;
    if (data.kind === 'partition') return true;
    if (data.kind !== 'selected-region') return false;
    return Number.isSafeInteger(data.numerator)
        && data.numerator >= 1
        && data.numerator < data.parts;
};

export const isFractionParts = (parts: number): parts is FractionParts =>
    parts === 2 || parts === 3 || parts === 4 || parts === 6 || parts === 8;

export const selectShareIndex = (parts: FractionParts, seed: number): number =>
    Math.abs(seed) % parts;

export const selectShareName = (parts: 2 | 4, seed: number): FractionShareName => {
    if (parts === 2) return 'half';
    return Math.abs(seed) % 2 === 0 ? 'fourth' : 'quarter';
};
