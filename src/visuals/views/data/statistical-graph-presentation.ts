import {StatisticalCategory, StatisticalGraphProblem} from '../../../types/problems.ts';
import {graphQuestion} from './helpers.ts';

export type StatisticalGraphPresentationTask =
    | 'construct'
    | 'organize'
    | 'read-category-count'
    | 'find-total'
    | 'single-step-arithmetic'
    | 'multi-step-arithmetic';

export type StatisticalGraphViewMode =
    | 'construction'
    | 'classification'
    | 'interpretation'
    | 'arithmetic';

export const isConstructionTask = (task: StatisticalGraphPresentationTask): boolean =>
    task === 'construct' || task === 'organize';

export const isArithmeticTask = (task: StatisticalGraphPresentationTask): boolean =>
    task === 'find-total' || task === 'single-step-arithmetic' || task === 'multi-step-arithmetic';

const hasArithmetic = (data: StatisticalGraphProblem): boolean => data.operation !== undefined;

export const resolveStatisticalGraphTask = (
    data: StatisticalGraphProblem,
    mode: StatisticalGraphViewMode
): StatisticalGraphPresentationTask | null => {
    if (!hasArithmetic(data)) {
        if (mode === 'construction') return 'construct';
        if (mode === 'classification') return 'organize';
        if (mode === 'interpretation') return 'read-category-count';
        return null;
    }
    if (mode !== 'arithmetic') return null;
    if (data.operandIndices?.length === 2) return 'single-step-arithmetic';
    return data.operation === 'addition' ? 'find-total' : 'multi-step-arithmetic';
};

export const selectCategoryIndex = (seed: number): 0 | 1 | 2 =>
    Math.abs(seed) % 3 as 0 | 1 | 2;

function shuffled<T>(values: readonly T[], seed: number): T[] {
    const result = [...values];
    let state = (seed ^ 0x9E3779B9) >>> 0;
    for (let index = result.length - 1; index > 0; index--) {
        state = Math.imul(state ^ state >>> 16, 0x21F0AAAD) >>> 0;
        state = Math.imul(state ^ state >>> 15, 0x735A2D97) >>> 0;
        const swapIndex = ((state ^ state >>> 15) >>> 0) % (index + 1);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

export const graphObservations = (
    data: StatisticalGraphProblem,
    seed: number
): StatisticalCategory['label'][] => {
    if (data.rawObservations) return [...data.rawObservations];
    const observations = data.categories.flatMap(category =>
        Array.from({length: category.count / data.scale}, () => category.label)
    );
    return shuffled(observations, seed);
};

export const taskHeading = (
    data: StatisticalGraphProblem,
    isSolutionView: boolean,
    task: StatisticalGraphPresentationTask,
    seed: number
): string => {
    if (task === 'construct') {
        return isSolutionView ? 'Completed bar graph' : 'Draw a bar graph for the data.';
    }
    if (task === 'organize') {
        return isSolutionView
            ? 'Grouped categorical data'
            : 'Sort the observations into the three categories, then complete the graph.';
    }
    if (task === 'read-category-count') {
        return `How many ${data.categories[selectCategoryIndex(seed)].label.toLowerCase()} are shown?`;
    }
    if (task === 'find-total') {
        return 'How many items are shown across all three categories?';
    }
    return graphQuestion(data);
};

export const revealsBars = (
    isSolutionView: boolean,
    task: StatisticalGraphPresentationTask
): boolean => !isConstructionTask(task) || isSolutionView;

export const revealsBarCounts = (
    isSolutionView: boolean,
    task: StatisticalGraphPresentationTask
): boolean => task !== 'read-category-count' || isSolutionView;
