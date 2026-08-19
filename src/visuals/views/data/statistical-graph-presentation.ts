import {StatisticalGraphProblem} from '../../../types/problems.ts';
import {graphQuestion} from './helpers.ts';

export type StatisticalGraphPresentationTask =
    | Exclude<StatisticalGraphProblem['task'], 'categorical-data'>
    | 'construct'
    | 'read-category-count';

export type StatisticalGraphViewMode =
    | 'construction'
    | 'classification'
    | 'interpretation'
    | 'arithmetic';

export const isConstructionTask = (task: StatisticalGraphPresentationTask): boolean =>
    task === 'construct' || task === 'organize';

export const isArithmeticTask = (task: StatisticalGraphPresentationTask): boolean =>
    task === 'find-total' || task === 'single-step-arithmetic' || task === 'multi-step-arithmetic';

export const resolveStatisticalGraphTask = (
    data: StatisticalGraphProblem,
    mode: StatisticalGraphViewMode
): StatisticalGraphPresentationTask | null => {
    if (mode === 'construction' && data.task === 'categorical-data') return 'construct';
    if (mode === 'interpretation' && data.task === 'categorical-data') return 'read-category-count';
    if (mode === 'classification' && data.task === 'organize') return 'organize';
    if (mode === 'arithmetic'
        && (data.task === 'find-total'
            || data.task === 'single-step-arithmetic'
            || data.task === 'multi-step-arithmetic')) return data.task;
    return null;
};

export const taskHeading = (
    data: StatisticalGraphProblem,
    isSolutionView: boolean,
    task: StatisticalGraphPresentationTask
): string => {
    if (task === 'construct') {
        return isSolutionView ? 'Completed bar graph' : 'Draw a bar graph for the data.';
    }
    if (task === 'read-category-count' && data.task === 'categorical-data') {
        return `How many ${data.selectedCategory.toLowerCase()} are shown?`;
    }
    if (data.task === 'organize' || data.task === 'find-total') {
        return data.prompt;
    }
    return graphQuestion(data);
};

export const revealsBars = (
    _data: StatisticalGraphProblem,
    isSolutionView: boolean,
    task: StatisticalGraphPresentationTask
): boolean => task !== 'construct' && task !== 'organize' || isSolutionView;

export const revealsBarCounts = (
    _data: StatisticalGraphProblem,
    isSolutionView: boolean,
    task: StatisticalGraphPresentationTask
): boolean => task !== 'read-category-count' || isSolutionView;
