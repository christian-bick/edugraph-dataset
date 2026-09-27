import {CountingClassifySortProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

export function validateCategoryCountData(viewId: string, data: CountingClassifySortProblem): void {
    validateProblemData(viewId, data, [
        'categories', 'numObjects', 'relation', 'ascendingGroups', 'minimumCategories', 'maximumCategories'
    ]);
    const fail = () => {
        throw new ViewValidationError(viewId, 'Category counts, ordered groups, and endpoints must agree.');
    };
    const categoryIds = Object.keys(data.categories).sort();
    if (categoryIds.length !== 3
        || Object.values(data.categories).some(count => !Number.isSafeInteger(count) || count < 1)
        || Object.values(data.categories).reduce((sum, count) => sum + count, 0) !== data.numObjects
        || !['least', 'most', 'ascending', 'descending'].includes(data.relation)
        || !Array.isArray(data.ascendingGroups)
        || data.ascendingGroups.some(group => !Array.isArray(group) || group.length === 0)) fail();

    const groups = data.ascendingGroups;
    const groupedIds = groups.flat();
    if (groupedIds.length !== categoryIds.length
        || new Set(groupedIds).size !== categoryIds.length
        || groupedIds.some(id => !categoryIds.includes(id))) fail();

    for (const [index, group] of groups.entries()) {
        const count = data.categories[group[0]!]!;
        if (group.some(id => data.categories[id] !== count)
            || (index > 0 && data.categories[groups[index - 1]![0]!]! >= count)) fail();
    }
    const sameMembers = (left: string[], right: string[]) => Array.isArray(left)
        && left.length === right.length
        && new Set(left).size === left.length
        && left.every(id => right.includes(id));
    if (!sameMembers(data.minimumCategories, groups[0]!)
        || !sameMembers(data.maximumCategories, groups[groups.length - 1]!)
        || (data.relation === 'least' && data.minimumCategories.length !== 1)
        || (data.relation === 'most' && data.maximumCategories.length !== 1)) fail();
}

/** Reversing canonical groups is presentation; no count sorting is performed here. */
export function categoryGroupsInDirection(data: CountingClassifySortProblem): string[][] {
    return categoryCountIsDescending(data.relation) ? [...data.ascendingGroups].reverse() : data.ascendingGroups;
}

export function categoryCountIsDescending(relation: CountingClassifySortProblem['relation']): boolean {
    return relation === 'most' || relation === 'descending';
}

export function generateScatteredPositions(numItems: number, width = 450, height = 200, maxItemSize = 40) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(numItems * width / height)));
    const rows = Math.ceil(numItems / cols);
    const padding = 10;
    const cellW = (width - padding * 2) / cols;
    const cellH = (height - padding * 2) / rows;
    const itemSize = Math.min(maxItemSize, cellW - 2, cellH - 2);
    const positions = Array.from({length: numItems}, (_, index) => ({
        x: Math.round(padding + (index % cols) * cellW + cellW / 2 - itemSize / 2),
        y: Math.round(padding + Math.floor(index / cols) * cellH + cellH / 2 - itemSize / 2)
    }));
    return {positions, itemSize};
}
