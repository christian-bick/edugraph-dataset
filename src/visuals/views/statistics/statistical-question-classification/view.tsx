import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {isStatisticalQuestionsProblem} from '../../../../generators/statistics/statistical-question-helpers.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {StatisticalQuestionBody} from '../statistical-question-view.tsx';
import {StatisticalQuestionClassificationViewSchema, type StatisticalQuestionClassificationViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'statistical-question-classification';
export const StatisticalQuestionClassificationCore = ({payload}: {config: StatisticalQuestionClassificationViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'investigations']);
    if (!isStatisticalQuestionsProblem(data)) throw new ViewValidationError(VIEW_ID, 'The investigation, complete observation plan, response rules or variability evidence is inconsistent.');
    return <StatisticalQuestionBody data={data} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const StatisticalQuestionClassification = withConfig(StatisticalQuestionClassificationViewSchema, StatisticalQuestionClassificationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<StatisticalQuestionClassification payload={payload} />);
};
