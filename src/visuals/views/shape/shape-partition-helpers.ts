import {
    FractionParts,
    FractionShareName,
    ShapePartitionProblem
} from '../../../types/problems.ts';

export type ShapePartitionTask =
    | 'partition'
    | 'name-share'
    | 'compose-whole'
    | 'compare-share-size'
    | 'partition-and-label-unit-fraction'
    | 'interpret-fraction';

export const resolveShapePartitionTask = (
    data: ShapePartitionProblem,
    task: ShapePartitionTask
): ShapePartitionTask | null => {
    if (data.model === 'unit-share-comparison') {
        return task === 'compare-share-size' ? task : null;
    }
    if (data.model === 'fraction-region') {
        return task === 'interpret-fraction' ? task : null;
    }
    if (task === 'partition-and-label-unit-fraction') {
        return data.unitFraction === null ? null : task;
    }
    if (task === 'partition') return task;
    if (data.parts !== 2 && data.parts !== 4) return null;
    if (task === 'name-share' || task === 'compose-whole') return task;
    return null;
};

export const isValidShapePartitionProblem = (data: ShapePartitionProblem): boolean => {
    if (data.shape !== 'circle' && data.shape !== 'rectangle') return false;
    if (data.model === 'unit-share-comparison') {
        return data.unitFractions.length === 2
            && data.unitFractions[0].numerator === 1
            && data.unitFractions[0].denominator === 2
            && data.unitFractions[0].display === '1/2'
            && data.unitFractions[1].numerator === 1
            && data.unitFractions[1].denominator === 4
            && data.unitFractions[1].display === '1/4'
            && data.relation === 'less'
            && data.lesserFraction === '1/4';
    }
    if (!isFractionParts(data.parts)) return false;
    if (data.model === 'equal-share-partition') {
        return data.wholeCount === 1
            && (data.unitFraction === null || data.unitFraction === `1/${data.parts}`);
    }
    return Number.isSafeInteger(data.numerator)
        && data.numerator >= 1
        && data.numerator < data.parts
        && data.unitFraction === `1/${data.parts}`
        && data.fraction === `${data.numerator}/${data.parts}`;
};

export const isFractionParts = (parts: number): parts is FractionParts =>
    parts === 2 || parts === 3 || parts === 4 || parts === 6 || parts === 8;

export const selectShareIndex = (parts: FractionParts, seed: number): number =>
    Math.abs(seed) % parts;

export const selectShareName = (parts: 2 | 4, seed: number): FractionShareName => {
    if (parts === 2) return 'half';
    return Math.abs(seed) % 2 === 0 ? 'fourth' : 'quarter';
};
