import {CountingClassifySortProblem} from '../../types/problems.ts';

/** Canonical ordering and endpoints, including equal-count categories. */
export function buildCategoryCountRelations(
    categories: Readonly<Record<string, number>>
): Pick<CountingClassifySortProblem, 'ascendingGroups' | 'minimumCategories' | 'maximumCategories'> {
    const entries = Object.entries(categories);
    if (entries.length === 0 || entries.some(([, count]) => !Number.isSafeInteger(count) || count < 1)) {
        throw new Error('Category counts must be positive integers.');
    }
    entries.sort(([leftId, leftCount], [rightId, rightCount]) =>
        leftCount - rightCount || leftId.localeCompare(rightId));

    const ascendingGroups: string[][] = [];
    let previousCount: number | undefined;
    for (const [category, count] of entries) {
        if (count !== previousCount) ascendingGroups.push([]);
        ascendingGroups[ascendingGroups.length - 1]!.push(category);
        previousCount = count;
    }
    return {
        ascendingGroups,
        minimumCategories: [...ascendingGroups[0]!],
        maximumCategories: [...ascendingGroups[ascendingGroups.length - 1]!]
    };
}
