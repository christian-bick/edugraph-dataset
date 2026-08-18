import {StatisticalGraphProblem} from '../../../../types/problems.ts';
import {graphQuestion} from '../helpers.ts';

export const isConstructionTask = (task: StatisticalGraphProblem['task']): boolean =>
    task === 'construct' || task === 'organize';

export const isArithmeticTask = (task: StatisticalGraphProblem['task']): boolean =>
    task === 'find-total' || task === 'single-step-arithmetic' || task === 'multi-step-arithmetic';

export const taskHeading = (
    data: StatisticalGraphProblem,
    isSolutionView: boolean
): string => {
    if (data.task === 'construct') {
        return isSolutionView ? 'Completed bar graph' : 'Draw a bar graph for the data.';
    }
    if (data.task === 'organize' || data.task === 'read-category-count' || data.task === 'find-total') {
        return data.prompt;
    }
    return graphQuestion(data);
};

export const revealsBars = (
    data: StatisticalGraphProblem,
    isSolutionView: boolean
): boolean => data.graphState === 'complete' || isSolutionView;

export const revealsBarCounts = (
    data: StatisticalGraphProblem,
    isSolutionView: boolean
): boolean => data.task !== 'read-category-count' || isSolutionView;
